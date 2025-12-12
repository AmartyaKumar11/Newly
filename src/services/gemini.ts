import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

const apiKey = process.env.GEMINI_API_KEY;

export function getGeminiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
}

export async function generateText(prompt: string) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

