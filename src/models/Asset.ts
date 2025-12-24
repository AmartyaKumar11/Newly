import { Schema, model, models } from "mongoose";

const AssetSchema = new Schema(
  {
    // NOTE: For assets we intentionally store userId as a string
    // that matches `session.user.id` from NextAuth, rather than a
    // Mongo ObjectId reference. This keeps the auth boundary simple
    // and avoids coupling uploads to the internal User schema.
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["image"],
      required: true,
      default: "image",
    },
    url: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

AssetSchema.index({ userId: 1, createdAt: -1 });

export default models.Asset || model("Asset", AssetSchema);

