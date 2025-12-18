import { Schema, model, models } from "mongoose";

/**
 * Brand Voice Model - Phase 3.3.3 Part B
 * 
 * Represents how an organization writes.
 * Stores editorial guidance, not UI hints.
 * Reusable across newsletters.
 * Versionable and auditable.
 */

const BrandVoiceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Tone characteristics
    tone: {
      // Primary tone descriptor
      primary: {
        type: String,
        enum: [
          "professional",
          "casual",
          "friendly",
          "formal",
          "conversational",
          "authoritative",
          "warm",
          "technical",
          "creative",
          "other",
        ],
        default: "professional",
      },
      // Additional tone descriptors (array for flexibility)
      secondary: {
        type: [String],
        default: [],
      },
      // Detailed tone description (freeform)
      description: {
        type: String,
        default: "",
        maxlength: 1000,
      },
    },

    // Writing style guidance
    style: {
      // Sentence structure preferences
      sentenceLength: {
        type: String,
        enum: ["short", "medium", "long", "varied"],
        default: "medium",
      },
      // Paragraph structure
      paragraphLength: {
        type: String,
        enum: ["short", "medium", "long", "varied"],
        default: "medium",
      },
      // Voice (first person, third person, etc.)
      voice: {
        type: String,
        enum: ["first-person", "second-person", "third-person", "mixed"],
        default: "third-person",
      },
      // Formality level
      formality: {
        type: String,
        enum: ["very-formal", "formal", "neutral", "casual", "very-casual"],
        default: "neutral",
      },
      // Additional style notes
      notes: {
        type: String,
        default: "",
        maxlength: 2000,
      },
    },

    // Vocabulary preferences
    vocabulary: {
      // Preferred terms/phrases (do use)
      preferred: {
        type: [String],
        default: [],
      },
      // Avoided terms/phrases (don't use)
      avoided: {
        type: [String],
        default: [],
      },
      // Industry-specific terminology
      terminology: {
        type: [String],
        default: [],
      },
      // Additional vocabulary notes
      notes: {
        type: String,
        default: "",
        maxlength: 1000,
      },
    },

    // Do / Don't rules
    rules: {
      // Do rules (positive guidance)
      do: {
        type: [String],
        default: [],
      },
      // Don't rules (negative guidance)
      dont: {
        type: [String],
        default: [],
      },
    },

    // Optional examples (text only, no HTML/Markdown)
    examples: {
      // Good examples that match this brand voice
      good: {
        type: [String],
        default: [],
      },
      // Bad examples that don't match (for contrast)
      bad: {
        type: [String],
        default: [],
      },
    },

    // Version tracking
    version: {
      type: Number,
      default: 1,
    },

    // Whether this is the default brand voice for the user
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Soft delete
    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
BrandVoiceSchema.index({ userId: 1, deleted: 1 });
BrandVoiceSchema.index({ userId: 1, isDefault: 1 });

export default models.BrandVoice || model("BrandVoice", BrandVoiceSchema);


