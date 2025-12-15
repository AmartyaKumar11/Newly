/**
 * Test endpoint to check Gemini API connectivity and list available models
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model name formats
    // The SDK might need different formats or the API version might be the issue
    const testModels = [
      "gemini-pro",
      "models/gemini-pro",
      "gemini-1.5-flash",
      "models/gemini-1.5-flash",
      "gemini-1.5-flash-001",
      "gemini-1.5-pro",
      "models/gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      "models/gemini-1.5-pro-latest",
    ];

    const results: Record<string, { status: string; error?: string; response?: string }> = {};

    // Test each model with a minimal prompt
    for (const modelName of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Try a minimal test call
        const result = await model.generateContent("Hi");
        const text = result.response.text();
        results[modelName] = {
          status: "working",
          response: text.substring(0, 50), // First 50 chars
        };
        // If one works, break early (optional)
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results[modelName] = {
          status: "failed",
          error: errorMessage,
        };
      }
    }

    // Find the first working model
    const workingModel = Object.entries(results).find(([_, result]) => result.status === "working");

    if (workingModel) {
      const [modelName, result] = workingModel;
      return NextResponse.json({
        success: true,
        message: "API is working!",
        workingModel: modelName,
        testResponse: result.response,
        allResults: results,
      });
    }

    // If no models worked, try fetching available models via REST API directly
    try {
      const fetchResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );
      
      if (fetchResponse.ok) {
        const modelsData = await fetchResponse.json();
        const availableModelNames = modelsData.models?.map((m: any) => m.name) || [];
        
        // Also try using the models API via SDK if available
        let sdkModels: string[] = [];
        try {
          // Some SDK versions have listModels
          const client = genAI as any;
          if (client.listModels) {
            const models = await client.listModels();
            sdkModels = models.map((m: any) => m.name);
          }
        } catch (e) {
          // Ignore if listModels doesn't exist
        }
        
        // Test the first available model from the list
        let testedAvailableModel: { name: string; status: string; error?: string } | null = null;
        if (availableModelNames.length > 0) {
          // Extract just the model name part (remove "models/" prefix if present)
          const firstModel = availableModelNames[0].replace("models/", "");
          try {
            const testModel = genAI.getGenerativeModel({ model: firstModel });
            const testResult = await testModel.generateContent("test");
            const testText = testResult.response.text();
            testedAvailableModel = { name: firstModel, status: "working" };
          } catch (e) {
            testedAvailableModel = {
              name: firstModel,
              status: "failed",
              error: e instanceof Error ? e.message : "Unknown error",
            };
          }
        }
        
        return NextResponse.json({
          success: testedAvailableModel?.status === "working",
          message: testedAvailableModel?.status === "working"
            ? "Found working model from API list"
            : "API key is valid, but tested models failed",
          availableModelsFromAPI: availableModelNames,
          testedModel: testedAvailableModel,
          allTestResults: results,
          suggestion: "Use one of the model names from availableModelsFromAPI",
        });
      } else {
        const errorData = await fetchResponse.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          message: "Failed to fetch available models",
          apiError: errorData,
          allTestResults: results,
          suggestion: "Check your API key permissions in Google Cloud Console",
        }, { status: fetchResponse.status });
      }
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: fetchError instanceof Error ? fetchError.message : "Failed to fetch models",
        allTestResults: results,
        suggestion: "Check your API key and network connection",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: "All model tests failed",
      allResults: results,
      suggestion: "Check your API key and ensure it has access to Gemini models. You may need to enable the Generative Language API in Google Cloud Console.",
    }, { status: 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to connect to Gemini API",
      },
      { status: 500 }
    );
  }
}
