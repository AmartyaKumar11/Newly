import { Schema, model, models } from "mongoose";

const BlockSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} },
    styles: { type: Schema.Types.Mixed, default: {} },
    position: { type: Schema.Types.Mixed, default: {} },
    // Geometry & layering (optional for backward compatibility)
    size: { type: Schema.Types.Mixed, default: {} },
    zIndex: { type: Number, default: 1 },
    // Section-level metadata for containers (optional)
    children: { type: [Schema.Types.Mixed], default: [] },
    sectionMetadata: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const VersionSchema = new Schema(
  {
    version: { type: Number },
    structureJSON: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const NewsletterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      default: "Untitled Newsletter",
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft"
    },

    blocks: {
      type: [BlockSchema],
      default: []
    },

    structureJSON: {
      type: Schema.Types.Mixed,
      default: {}
    },

    aiMetadata: {
      keywords: { type: [String], default: [] },
      tone: { type: String, default: "" },
      topic: { type: String, default: "" }
    },

    // Brand Voice - Phase 3.3.3 Part B
    // Reference to active brand voice (optional, can be null for no brand voice)
    brandVoiceId: {
      type: Schema.Types.ObjectId,
      ref: "BrandVoice",
      default: null,
      index: true,
    },

    versions: {
      type: [VersionSchema],
      default: []
    },

    publishedURL: {
      type: String,
      default: null
    },

    publishedAt: {
      type: Date,
      default: null
    },

    lastAutosave: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

NewsletterSchema.index({ userId: 1, status: 1 });

export default models.Newsletter || model("Newsletter", NewsletterSchema);
