/**
 * PublishedSnapshot Model
 * 
 * Immutable snapshots of published newsletters.
 * 
 * Phase 3.5: Publishing System
 * 
 * Rules:
 * - Snapshots are append-only (never modified)
 * - Republish always creates a new snapshot
 * - Existing snapshots are never overwritten
 * - Snapshots are immutable by design
 * 
 * This ensures published content remains stable even when drafts are edited.
 */

import { Schema, model, models } from "mongoose";
import crypto from "crypto";

const PublishedSnapshotSchema = new Schema(
  {
    // Newsletter this snapshot belongs to
    newsletterId: {
      type: Schema.Types.ObjectId,
      ref: "Newsletter",
      required: true,
      index: true,
    },

    // Version number (increments with each republish)
    snapshotVersion: {
      type: Number,
      required: true,
      default: 1,
    },

    // Serialized block tree (immutable snapshot)
    serializedBlocks: {
      type: Schema.Types.Mixed,
      required: true,
    },

    // Asset references (IDs only, for integrity checks)
    assetReferences: {
      type: [String], // Array of asset IDs referenced in blocks
      default: [],
    },

    // Slug at time of publication (locked, never changes)
    slug: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Newsletter metadata at time of publication
    newsletterTitle: {
      type: String,
      required: true,
    },

    newsletterDescription: {
      type: String,
      default: "",
    },

    // Integrity hash (SHA-256) for tamper detection
    integrityHash: {
      type: String,
      required: true,
      index: true,
    },

    // Who created this snapshot
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt (updatedAt should never change)
  }
);

// Compound index: newsletterId + snapshotVersion (for efficient lookups)
PublishedSnapshotSchema.index({ newsletterId: 1, snapshotVersion: 1 });

/**
 * Calculate integrity hash for a snapshot.
 * 
 * Uses SHA-256 to create a deterministic hash of the serialized blocks.
 * This allows tamper detection and integrity verification.
 * 
 * @param serializedBlocks - Serialized block tree
 * @returns SHA-256 hash as hex string
 */
export function calculateSnapshotHash(serializedBlocks: unknown): string {
  const jsonString = JSON.stringify(serializedBlocks);
  return crypto.createHash("sha256").update(jsonString).digest("hex");
}

export default models.PublishedSnapshot || model("PublishedSnapshot", PublishedSnapshotSchema);
