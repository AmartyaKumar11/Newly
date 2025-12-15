/**
 * AI Gateway - Phase 3.1
 * 
 * Single entry point for all AI operations.
 * Enforces rate limiting, authentication, schema validation, and cost controls.
 * 
 * Flow:
 * 1. Request enters gateway
 * 2. Auth check
 * 3. Rate limiting
 * 4. Logging
 * 5. Build prompt using frozen contract
 * 6. Call Gemini wrapper
 * 7. Receive raw output
 * 8. Parse JSON (with retry on failure)
 * 9. Validate schema
 * 10. Translate AI output → editor blocks
 * 11. Return editor-ready blocks (no insertion)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, validateTokenLimit } from "@/lib/rateLimit";
import { callGemini } from "@/services/gemini";
import { buildGeminiPrompt, buildCorrectionPrompt } from "@/services/geminiPrompt";
import { connectToDatabase } from "@/lib/db";
import { logAIOperation } from "@/lib/aiLogger";
import { translateAIOutputToEditorBlocks } from "@/utils/aiTranslation";
import User from "@/models/User";

interface AIRequest {
  prompt: string;
  maxTokens?: number;
  operation: "generate_text" | "generate_blocks";
}

const MAX_TOKENS_PER_REQUEST = 10000;
const MAX_REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_JSON_PARSE_RETRIES = 1; // Retry once on parse failure

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authentication check
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 2. Parse and validate request
    let body: AIRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (body.prompt.length > 10000) {
      return NextResponse.json(
        { error: "Prompt too long (max 10000 characters)" },
        { status: 400 }
      );
    }

    // 3. Rate limiting check
    const rateLimitResult = checkRateLimit(user._id.toString(), {
      maxRequests: 10, // 10 requests per minute
      windowMs: 60000,
      maxTokens: MAX_TOKENS_PER_REQUEST,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          reason: rateLimitResult.reason,
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 4. Token limit validation
    const requestedTokens = body.maxTokens || MAX_TOKENS_PER_REQUEST;
    if (!validateTokenLimit(requestedTokens, MAX_TOKENS_PER_REQUEST)) {
      return NextResponse.json(
        { error: `Token limit exceeded. Max: ${MAX_TOKENS_PER_REQUEST}` },
        { status: 400 }
      );
    }

    // 5. Build prompt using frozen contract (only for generate_blocks operation)
    // For generate_text, use the user prompt directly (backward compatibility)
    let fullPrompt: string;
    let isBlocksOperation = body.operation === "generate_blocks";
    
    if (isBlocksOperation) {
      fullPrompt = buildGeminiPrompt(body.prompt);
    } else {
      fullPrompt = body.prompt; // Legacy text generation
    }

    // 6. Execute AI operation with timeout and retry logic
    let rawOutput: string;
    let parseAttempts = 0;
    let parseError: Error | null = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MAX_REQUEST_TIMEOUT_MS);

    try {
      while (parseAttempts <= MAX_JSON_PARSE_RETRIES) {
        try {
          // Call Gemini with appropriate prompt
          if (parseAttempts === 0) {
            rawOutput = await Promise.race([
              callGemini(fullPrompt),
              new Promise<string>((_, reject) => {
                setTimeout(() => reject(new Error("Request timeout")), MAX_REQUEST_TIMEOUT_MS);
              }),
            ]);
          } else {
            // Retry with correction prompt
            const correctionPrompt = buildCorrectionPrompt(
              body.prompt,
              rawOutput!,
              parseError?.message || "JSON parse failed"
            );
            rawOutput = await Promise.race([
              callGemini(correctionPrompt),
              new Promise<string>((_, reject) => {
                setTimeout(() => reject(new Error("Request timeout")), MAX_REQUEST_TIMEOUT_MS);
              }),
            ]);
          }

          // If this is not a blocks operation, return raw text (legacy behavior)
          if (!isBlocksOperation) {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            logAIOperation({
              userId: user._id.toString(),
              userEmail: user.email,
              operation: body.operation,
              prompt: body.prompt.substring(0, 200),
              duration,
              success: true,
              metadata: {
                rateLimitRemaining: rateLimitResult.remaining,
              },
            });

            return NextResponse.json(
              {
                text: rawOutput,
                metadata: {
                  operation: body.operation,
                  duration: duration,
                  rateLimitRemaining: rateLimitResult.remaining,
                  rateLimitReset: rateLimitResult.resetAt,
                },
              },
              {
                headers: {
                  "X-RateLimit-Limit": "10",
                  "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                  "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
                },
              }
            );
          }

          // For blocks operation: Parse JSON
          let parsedOutput: unknown;
          try {
            // Strip markdown code blocks if present (defensive parsing)
            let jsonText = rawOutput.trim();
            if (jsonText.startsWith("```json")) {
              jsonText = jsonText.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
            } else if (jsonText.startsWith("```")) {
              jsonText = jsonText.replace(/^```\s*/i, "").replace(/```\s*$/, "");
            }
            
            parsedOutput = JSON.parse(jsonText);
            parseError = null; // Success
            break; // Exit retry loop
          } catch (parseErr) {
            parseError = parseErr instanceof Error ? parseErr : new Error("JSON parse failed");
            parseAttempts++;
            
            if (parseAttempts > MAX_JSON_PARSE_RETRIES) {
              // Max retries exceeded - log and throw
              clearTimeout(timeoutId);
              const duration = Date.now() - startTime;
              
              // Log parse failure
              logAIOperation({
                userId: user._id.toString(),
                userEmail: user.email,
                operation: body.operation,
                prompt: body.prompt.substring(0, 200),
                duration,
                success: false,
                error: `JSON parse failed after ${MAX_JSON_PARSE_RETRIES + 1} attempts: ${parseError.message}`,
              });
              
              throw new Error(`Failed to parse JSON after ${MAX_JSON_PARSE_RETRIES + 1} attempts: ${parseError.message}`);
            }
            // Continue to retry
            continue;
          }
        } catch (geminiError) {
          clearTimeout(timeoutId);
          throw geminiError;
        }
      }

      clearTimeout(timeoutId);

      // 7. Validate schema (for blocks operation)
      if (!isBlocksOperation) {
        // Should not reach here for text operations, but defensive
        throw new Error("Invalid operation flow");
      }

      // 8. Translate AI output to editor blocks
      const translationResult = translateAIOutputToEditorBlocks(parsedOutput);

      if (!translationResult.success) {
        // Validation failed - return structured error
        const duration = Date.now() - startTime;
        
        logAIOperation({
          userId: user._id.toString(),
          userEmail: user.email,
          operation: body.operation,
          prompt: body.prompt.substring(0, 200),
          duration,
          success: false,
          error: `Schema validation failed: ${translationResult.errors?.map(e => e.message).join("; ") || "Unknown validation error"}`,
        });

        return NextResponse.json(
          {
            error: "Schema validation failed",
            details: translationResult.errors?.map(e => ({
              type: e.type,
              message: e.message,
              field: e.field,
            })),
          },
          { status: 400 }
        );
      }

      // 9. Return editor-ready blocks (no insertion - that's the client's job)
      const duration = Date.now() - startTime;

      logAIOperation({
        userId: user._id.toString(),
        userEmail: user.email,
        operation: body.operation,
        prompt: body.prompt.substring(0, 200),
        duration,
        success: true,
        metadata: {
          rateLimitRemaining: rateLimitResult.remaining,
          blocksGenerated: translationResult.blocks?.length || 0,
          warnings: translationResult.warnings?.length || 0,
        },
      });

      return NextResponse.json(
        {
          blocks: translationResult.blocks,
          metadata: {
            operation: body.operation,
            duration: duration,
            rateLimitRemaining: rateLimitResult.remaining,
            rateLimitReset: rateLimitResult.resetAt,
            blocksGenerated: translationResult.blocks?.length || 0,
            warnings: translationResult.warnings,
          },
        },
        {
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error (if we have user context)
    try {
      await connectToDatabase();
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const user = await User.findOne({ email: session.user.email });
        if (user) {
          logAIOperation({
            userId: user._id.toString(),
            userEmail: user.email,
            operation: "unknown",
            duration,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } catch (logError) {
      // Don't fail request if logging fails
      console.error("Failed to log AI error:", logError);
    }
    
    console.error(`[AI Gateway] Error - Duration: ${duration}ms`, error);

    if (error instanceof Error) {
      if (error.message === "Request timeout") {
        return NextResponse.json(
          { error: "Request timeout", details: "AI operation exceeded maximum time limit" },
          { status: 504 }
        );
      }

      if (error.message.includes("GEMINI_API_KEY")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "AI operation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    gateway: "ai-gateway",
    version: "1.0.0",
  });
}
