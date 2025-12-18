/**
 * Brand Voice Prompt Conditioning - Phase 3.3.3 Part B
 * 
 * Injects brand voice guidance into AI prompts at the prompt layer only.
 * Brand voice is advisory, not absolute - it influences but never overrides user intent.
 * 
 * Core Principles:
 * - Brand voice is injected as guidance, not commands
 * - Clearly separated from system rules and user intent
 * - Never modifies AI output post-generation
 * - Never auto-rewrites existing content
 */

import type { Document } from "mongoose";

export interface BrandVoiceDocument extends Document {
  name: string;
  tone: {
    primary: string;
    secondary: string[];
    description: string;
  };
  style: {
    sentenceLength: string;
    paragraphLength: string;
    voice: string;
    formality: string;
    notes: string;
  };
  vocabulary: {
    preferred: string[];
    avoided: string[];
    terminology: string[];
    notes: string;
  };
  rules: {
    do: string[];
    dont: string[];
  };
  examples: {
    good: string[];
    bad: string[];
  };
}

/**
 * Builds brand voice guidance snippet for injection into AI prompts.
 * Returns empty string if brand voice is null/undefined.
 * 
 * This guidance is ADVISORY ONLY - it influences tone and style but never overrides user intent.
 */
export function buildBrandVoiceGuidance(
  brandVoice: BrandVoiceDocument | null | undefined
): string {
  if (!brandVoice) {
    return "";
  }

  const sections: string[] = [];

  // Header
  sections.push("BRAND VOICE GUIDANCE (ADVISORY):");
  sections.push(`The following guidance represents the desired writing style for "${brandVoice.name}".`);
  sections.push("This guidance should influence your output, but user intent takes precedence.");
  sections.push("");

  // Tone
  if (brandVoice.tone) {
    sections.push("TONE:");
    if (brandVoice.tone.primary) {
      sections.push(`- Primary tone: ${brandVoice.tone.primary}`);
    }
    if (brandVoice.tone.secondary && brandVoice.tone.secondary.length > 0) {
      sections.push(`- Secondary tones: ${brandVoice.tone.secondary.join(", ")}`);
    }
    if (brandVoice.tone.description) {
      sections.push(`- Description: ${brandVoice.tone.description}`);
    }
    sections.push("");
  }

  // Style
  if (brandVoice.style) {
    sections.push("STYLE:");
    if (brandVoice.style.sentenceLength) {
      sections.push(`- Sentence length: ${brandVoice.style.sentenceLength}`);
    }
    if (brandVoice.style.paragraphLength) {
      sections.push(`- Paragraph length: ${brandVoice.style.paragraphLength}`);
    }
    if (brandVoice.style.voice) {
      sections.push(`- Voice: ${brandVoice.style.voice}`);
    }
    if (brandVoice.style.formality) {
      sections.push(`- Formality: ${brandVoice.style.formality}`);
    }
    if (brandVoice.style.notes) {
      sections.push(`- Additional notes: ${brandVoice.style.notes}`);
    }
    sections.push("");
  }

  // Vocabulary
  if (brandVoice.vocabulary) {
    const vocab: string[] = [];
    if (brandVoice.vocabulary.preferred && brandVoice.vocabulary.preferred.length > 0) {
      vocab.push(`Preferred terms: ${brandVoice.vocabulary.preferred.join(", ")}`);
    }
    if (brandVoice.vocabulary.avoided && brandVoice.vocabulary.avoided.length > 0) {
      vocab.push(`Avoided terms: ${brandVoice.vocabulary.avoided.join(", ")}`);
    }
    if (brandVoice.vocabulary.terminology && brandVoice.vocabulary.terminology.length > 0) {
      vocab.push(`Industry terminology: ${brandVoice.vocabulary.terminology.join(", ")}`);
    }
    if (vocab.length > 0) {
      sections.push("VOCABULARY:");
      vocab.forEach((v) => sections.push(`- ${v}`));
      if (brandVoice.vocabulary.notes) {
        sections.push(`- Notes: ${brandVoice.vocabulary.notes}`);
      }
      sections.push("");
    }
  }

  // Rules
  if (brandVoice.rules) {
    const rules: string[] = [];
    if (brandVoice.rules.do && brandVoice.rules.do.length > 0) {
      rules.push("DO:");
      brandVoice.rules.do.forEach((rule) => rules.push(`  - ${rule}`));
    }
    if (brandVoice.rules.dont && brandVoice.rules.dont.length > 0) {
      rules.push("DON'T:");
      brandVoice.rules.dont.forEach((rule) => rules.push(`  - ${rule}`));
    }
    if (rules.length > 0) {
      sections.push("WRITING RULES:");
      rules.forEach((r) => sections.push(r));
      sections.push("");
    }
  }

  // Examples (only include if present)
  if (brandVoice.examples) {
    const examples: string[] = [];
    if (brandVoice.examples.good && brandVoice.examples.good.length > 0) {
      examples.push("GOOD EXAMPLES (match this style):");
      brandVoice.examples.good.forEach((ex) => examples.push(`  - "${ex}"`));
    }
    if (brandVoice.examples.bad && brandVoice.examples.bad.length > 0) {
      examples.push("BAD EXAMPLES (avoid this style):");
      brandVoice.examples.bad.forEach((ex) => examples.push(`  - "${ex}"`));
    }
    if (examples.length > 0) {
      sections.push("EXAMPLES:");
      examples.forEach((ex) => sections.push(ex));
      sections.push("");
    }
  }

  // Footer reminder
  sections.push("REMEMBER: This brand voice guidance is advisory. User intent and explicit instructions take precedence.");

  return sections.join("\n");
}

/**
 * Conditionally injects brand voice into a prompt.
 * Returns the original prompt if brand voice is null/undefined.
 * 
 * Structure:
 * 1. System rules (existing prompt)
 * 2. Brand voice guidance (if present)
 * 3. User request
 */
export function injectBrandVoiceIntoPrompt(
  basePrompt: string,
  brandVoice: BrandVoiceDocument | null | undefined
): string {
  if (!brandVoice) {
    return basePrompt;
  }

  const brandGuidance = buildBrandVoiceGuidance(brandVoice);

  if (!brandGuidance) {
    return basePrompt;
  }

  // Find where "USER REQUEST:" appears in the base prompt
  const userRequestMarker = "USER REQUEST:";
  const userRequestIndex = basePrompt.indexOf(userRequestMarker);

  if (userRequestIndex === -1) {
    // No USER REQUEST marker, append brand guidance before the end
    return `${basePrompt}\n\n${brandGuidance}`;
  }

  // Insert brand guidance between system rules and user request
  const beforeUserRequest = basePrompt.substring(0, userRequestIndex).trim();
  const userRequest = basePrompt.substring(userRequestIndex);

  return `${beforeUserRequest}\n\n${brandGuidance}\n\n${userRequest}`;
}


