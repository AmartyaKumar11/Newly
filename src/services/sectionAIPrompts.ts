/**
 * Section-Level AI Prompt Builders
 * 
 * Builds prompts for section-specific AI actions.
 * Each action has a clear, explicit intent.
 */

import type { AIOutputSchema } from "@/types/aiOutputSchema";
import { buildGeminiPrompt } from "./geminiPrompt";
import { injectBrandVoiceIntoPrompt } from "./brandVoicePrompt";
import type { BrandVoiceDocument } from "./brandVoicePrompt";

export type SectionAIAction = 
  | "rewrite"
  | "shorten"
  | "expand"
  | "change_tone"
  | "improve_clarity"
  | "make_persuasive";

/**
 * Builds a prompt for section-level AI actions.
 * 
 * @param action - The specific action to perform
 * @param sectionContent - The current content of the section (read-only context)
 * @param tone - Optional tone for change_tone action
 * @param brandVoice - Optional brand voice to inject (advisory guidance)
 * @returns Complete prompt string for Gemini
 */
export function buildSectionAIPrompt(
  action: SectionAIAction,
  sectionContent: string,
  tone?: string,
  brandVoice?: BrandVoiceDocument | null
): string {
  // Build the full schema prompt template to extract schema description
  const schemaTemplate = buildGeminiPrompt("PLACEHOLDER");
  
  // Extract just the schema description part (everything before USER REQUEST)
  const schemaDescription = schemaTemplate.split("USER REQUEST:")[0].trim();
  
  let actionInstructions = "";
  
  switch (action) {
    case "rewrite":
      actionInstructions = `Rewrite the following section content. Keep the same structure and meaning, but improve the wording and flow.`;
      break;
    
    case "shorten":
      actionInstructions = `Shorten the following section content. Make it more concise while preserving the key information and meaning. Reduce the number of blocks if needed.`;
      break;
    
    case "expand":
      actionInstructions = `Expand the following section content. Add more detail, examples, or explanations while maintaining the original structure and intent.`;
      break;
    
    case "change_tone":
      const toneDescription = tone || "professional";
      actionInstructions = `Change the tone of the following section content to be more ${toneDescription}. Keep the same information and structure, but adjust the writing style and language.`;
      break;
    
    case "improve_clarity":
      actionInstructions = `Improve the clarity of the following section content. Make it easier to understand while keeping the same meaning and structure.`;
      break;
    
    case "make_persuasive":
      actionInstructions = `Make the following section content more persuasive. Strengthen the argument and language to be more compelling, while maintaining the same structure.`;
      break;
  }
  
  const userRequest = `SECTION TO MODIFY (read-only context):
${sectionContent}

ACTION TO PERFORM:
${actionInstructions}

CRITICAL CONSTRAINTS:
- Modify ONLY this section - do not add new sections or blocks outside this section
- Output blocks that REPLACE the current section blocks
- Maintain similar structure (if section had 3 blocks, output approximately 3 blocks)
- Keep the same general layout and positioning
- Do not create blocks that exceed the canvas bounds
- All blocks must be valid and match the AIOutputSchema exactly

USER REQUEST:
Apply the ${action} action to the section above. Output ONLY the JSON object matching the AIOutputSchema, nothing else.`;

  // Build base prompt with schema
  const basePrompt = `${schemaDescription}\n\n${userRequest}`;

  // Inject brand voice guidance if provided (advisory only)
  return injectBrandVoiceIntoPrompt(basePrompt, brandVoice);
}
