import { Schema, model, models } from "mongoose";

const ProviderSchema = new Schema(
  {
    provider: { type: String },
    providerId: { type: String }
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      index: true
    },

    image: {
      type: String
    },

    providers: {
      type: [ProviderSchema],
      default: []
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    limits: {
      newsletters: {
        type: Number,
        default: 50
      },
      storageMB: {
        type: Number,
        default: 500
      }
    },

    preferences: {
      theme: { type: String, default: "light" },
      language: { type: String, default: "en" }
    },

    deleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, deleted: 1 });

export default models.User || model("User", UserSchema);
