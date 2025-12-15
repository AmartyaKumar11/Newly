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
 * @returns Raw text output from Gemini
 * @throws Error if API call fails, times out, or returns unexpected response
 */
export async function callGemini(prompt: string): Promise<string> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text || typeof text !== "string") {
      throw new Error("Gemini returned invalid response: expected string text");
    }
    
    return text;
  } catch (error) {
    // Re-throw with clear error context
    if (error instanceof Error) {
      // Check for API key errors
      if (error.message.includes("API_KEY") || error.message.includes("GEMINI_API_KEY")) {
        throw new Error("GEMINI_API_KEY configuration error");
      }
      // Check for API errors
      if (error.message.includes("API") || error.message.includes("quota") || error.message.includes("rate limit")) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      // Re-throw other errors
      throw error;
    }
    throw new Error("Unknown error calling Gemini API");
  }
}

/**
 * @deprecated Use callGemini instead
 * Legacy function maintained for backward compatibility during migration
 */
export async function generateText(prompt: string): Promise<string> {
  return callGemini(prompt);
}

