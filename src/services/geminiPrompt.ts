/**
 * FROZEN PROMPT CONTRACT
 * 
 * This prompt is a PRODUCTION CONTRACT that forces Gemini to output
 * ONLY valid JSON matching the frozen AI Output Schema v1.0.0.
 * 
 * This is NOT a suggestion - it is a contract that must be enforced.
 * 
 * DO NOT modify this prompt without:
 * 1. Understanding the full impact on all AI operations
 * 2. Testing with schema validation
 * 3. Versioning the prompt contract
 */

import type { AIOutputSchema } from "@/types/aiOutputSchema";

/**
 * Builds the system prompt that enforces JSON-only output matching AIOutputSchema.
 * 
 * This prompt explicitly describes the schema and instructs Gemini to output
 * ONLY valid JSON with no markdown, explanations, comments, or extra keys.
 * 
 * @param userPrompt - The user's prompt/request
 * @returns Complete prompt string for Gemini
 */
export function buildGeminiPrompt(userPrompt: string): string {
  return `You are a JSON generator for a visual editor. Your ONLY job is to output valid JSON that matches the required schema.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown code blocks, no explanations, no comments
2. The JSON MUST match the AIOutputSchema exactly (see schema below)
3. Do NOT wrap the JSON in markdown code blocks (no \`\`\`json)
4. Do NOT add any text before or after the JSON
5. Do NOT include any explanations or comments
6. The output must be parseable JSON.parse() directly

REQUIRED SCHEMA (AIOutputSchema v1.0.0):
{
  "schemaVersion": "1.0.0",  // REQUIRED: Must be exactly "1.0.0"
  "blocks": [                // REQUIRED: Array of 1-50 blocks
    {
      "type": "text" | "image" | "shape" | "container",  // REQUIRED
      "content": {          // REQUIRED: Structure depends on type
        // For "text": { "text": "string", "role"?: "heading" | "paragraph" | "list" | "quote" }
        // For "image": { "src": "https://...", "alt"?: "string" }
        // For "shape": { "shapeType": "rectangle" }
        // For "container": { "children": ["tempId1", "tempId2"] }
      },
      "tempId"?: "string",   // OPTIONAL: Unique identifier within this response (for container references)
      "position"?: {         // OPTIONAL: { "x": number (0-600), "y": number (0-800) }
        "x": number,
        "y": number
      },
      "size"?: {             // OPTIONAL: { "width": number (50-600), "height": number (50-800) }
        "width": number,
        "height": number
      },
      "styles"?: {           // OPTIONAL: Style object (see allowed fields below)
        "backgroundColor"?: "string (hex color)",
        "borderColor"?: "string (hex color)",
        "borderWidth"?: "number (0-10)",
        "borderRadius"?: "number (0-50)",
        "opacity"?: "number (0.0-1.0)",
        "fontSize"?: "number (8-72)",
        "fontWeight"?: "normal" | "bold" | "300" | "500" | "600" | "700",
        "fontFamily"?: "system-ui" | "Arial" | "Helvetica" | "Times New Roman" | "Georgia" | "Courier New" | "Verdana",
        "color"?: "string (hex color)",
        "textAlign"?: "left" | "center" | "right" | "justify",
        "objectFit"?: "cover" | "contain" | "fill" | "none"
      },
      "zIndex"?: "number (1-1000)"
    }
  ],
  "metadata"?: {             // OPTIONAL
    "operation"?: "string",
    "description"?: "string"
  }
}

CONTENT TYPE CONSTRAINTS:

1. Text blocks (type: "text"):
   - content.text: Plain text ONLY (no HTML, no Markdown)
   - Max 10,000 characters
   - No HTML tags (<div>, <p>, etc.)
   - No Markdown syntax (#, **, etc.)
   - Line breaks as \\n
   - No script tags or javascript: protocols

2. Image blocks (type: "image"):
   - content.src: Valid HTTPS URL ONLY
   - No data URIs
   - No javascript: or other dangerous protocols

3. Shape blocks (type: "shape"):
   - content.shapeType: Must be "rectangle" (only supported type)

4. Container blocks (type: "container"):
   - content.children: Array of tempId strings
   - All referenced tempIds MUST exist in the same response
   - No circular references

VALIDATION CONSTRAINTS:
- Position: x must be 0-600, y must be 0-800
- Size: width 50-600, height 50-800
- If both position and size are provided, x + width must be ≤ 600, y + height must be ≤ 800
- blocks array must have 1-50 items
- All tempIds in container.children must reference valid tempIds in the same response

IF YOUR OUTPUT IS INVALID JSON OR DOES NOT MATCH THE SCHEMA, IT WILL BE REJECTED.

USER REQUEST:
${userPrompt}

OUTPUT ONLY THE JSON OBJECT, NOTHING ELSE.`;
}

/**
 * Builds a correction prompt when JSON parsing fails.
 * Instructs Gemini to fix the JSON format.
 * 
 * @param userPrompt - Original user prompt
 * @param previousOutput - The invalid output that failed to parse
 * @param parseError - The JSON parse error message
 * @returns Correction prompt
 */
export function buildCorrectionPrompt(
  userPrompt: string,
  previousOutput: string,
  parseError: string
): string {
  return `Your previous response failed JSON parsing. The error was: ${parseError}

CRITICAL: You MUST output ONLY valid JSON, no markdown, no explanations, nothing else.

Previous (invalid) output:
${previousOutput.substring(0, 500)}${previousOutput.length > 500 ? "..." : ""}

Fix this and output ONLY valid JSON matching the AIOutputSchema.

USER REQUEST:
${userPrompt}

OUTPUT ONLY THE JSON OBJECT, NOTHING ELSE.`;
}
