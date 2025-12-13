import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, validateTokenLimit } from "@/lib/rateLimit";
import { generateText } from "@/services/gemini";
import { connectToDatabase } from "@/lib/db";
import { logAIOperation } from "@/lib/aiLogger";
import User from "@/models/User";

// AI Gateway - Single entry point for all AI operations
// Enforces rate limiting, authentication, and cost controls

interface AIRequest {
  prompt: string;
  maxTokens?: number;
  operation: "generate_text" | "generate_blocks";
}

const MAX_TOKENS_PER_REQUEST = 10000;
const MAX_REQUEST_TIMEOUT_MS = 30000; // 30 seconds

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

    // 5. Execute AI operation with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MAX_REQUEST_TIMEOUT_MS);

    try {
      const result = await Promise.race([
        generateText(body.prompt),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), MAX_REQUEST_TIMEOUT_MS);
        }),
      ]) as string;

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      // 6. Log successful operation
      logAIOperation({
        userId: user._id.toString(),
        userEmail: user.email,
        operation: body.operation,
        prompt: body.prompt.substring(0, 200), // Log first 200 chars
        duration,
        success: true,
        metadata: {
          rateLimitRemaining: rateLimitResult.remaining,
        },
      });

      return NextResponse.json(
        {
          text: result,
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
