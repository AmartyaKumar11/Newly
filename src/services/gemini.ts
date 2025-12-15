/**
 * Gemini Service Wrapper
 * 
 * Server-side only service for calling Gemini API.
 * 
 * Responsibilities:
 * - Initialize Gemini client using process.env.GEMINI_API_KEY
 * - Accept prompt string
 * - Call Gemini API
 * - Return raw text output
 * - Handle API errors, timeouts, unexpected responses
 * 
 * Rules:
 * - No schema logic here
 * - No translation logic here
 * - No UI imports
 * - No editor imports
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

const apiKey = process.env.GEMINI_API_KEY;

function getGeminiClient(): GoogleGenerativeAI {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
}

/**
 * Calls Gemini API with a prompt and returns raw text output.
 * 
 * This is a pure wrapper - no schema validation, no translation, no UI logic.
 * 
 * @param prompt - The prompt string to send to Gemini
 * @param retries - Number of retry attempts for transient errors (default: 2)
 * @returns Raw text output from Gemini
 * @throws Error if API call fails, times out, or returns unexpected response
 */
export async function callGemini(prompt: string, retries: number = 2): Promise<string> {
  // Fallback models to try if primary model is unavailable
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
  let lastError: Error | null = null;
  
  // Try each model, then retry with exponential backoff
  for (const modelName of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        if (!text || typeof text !== "string") {
          throw new Error("Gemini returned invalid response: expected string text");
        }
        
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        
        // Check if this is a retryable error (503, 429, network errors)
        const isRetryable = 
          error instanceof Error && (
            error.message.includes("503") ||
            error.message.includes("overloaded") ||
            error.message.includes("Service Unavailable") ||
            error.message.includes("429") ||
            error.message.includes("rate limit")
          );
        
        // If this is the last attempt for this model and error is retryable, try next model
        if (attempt >= retries && isRetryable) {
          // Move to next model
          break;
        }
        
        // If error is not retryable, throw immediately
        if (!isRetryable) {
          // Re-throw with clear error context
          if (error instanceof Error) {
            // Check for API key errors
            if (error.message.includes("API_KEY") || error.message.includes("GEMINI_API_KEY")) {
              throw new Error("GEMINI_API_KEY configuration error");
            }
            // Check for other API errors
            if (error.message.includes("API") || error.message.includes("quota")) {
              throw new Error(`Gemini API error: ${error.message}`);
            }
            // Re-throw other errors
            throw error;
          }
          throw new Error("Unknown error calling Gemini API");
        }
        
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All models failed - throw with clear message
  if (lastError instanceof Error) {
    if (lastError.message.includes("503") || lastError.message.includes("overloaded") || lastError.message.includes("Service Unavailable")) {
      throw new Error("Gemini API is temporarily overloaded. Please try again in a few moments.");
    }
    if (lastError.message.includes("429") || lastError.message.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    throw lastError;
  }
  
  throw new Error("Failed to call Gemini API after trying all available models");
}

/**
 * @deprecated Use callGemini instead
 * Legacy function maintained for backward compatibility during migration
 */
export async function generateText(prompt: string): Promise<string> {
  return callGemini(prompt);
}

