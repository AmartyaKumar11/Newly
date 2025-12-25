/**
 * ShareToken Model
 * 
 * Represents a shareable access link for newsletters.
 * 
 * Security:
 * - Tokens are cryptographically secure and unguessable
 * - Tokens are URL-safe (base64url encoding)
 * - Tokens can be revoked without deleting the record
 * - Expiration is optional but supported
 * 
 * Access Control:
 * - Only newsletter owner can create share tokens
 * - Tokens grant viewer or editor access (v1: viewer only)
 * - Viewer access does not require authentication
 * 
 * No editor, AI, or UI logic should be imported here.
 */

import { Schema, model, models } from "mongoose";
import type { AccessRole } from "@/types/access";
import crypto from "crypto";

const ShareTokenSchema = new Schema(
  {
    // Cryptographically secure, unguessable token
    // Generated using crypto.randomBytes and base64url encoding for URL safety
    // Length: 32 bytes = 43 characters in base64url (URL-safe)
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Token is URL-safe: base64url encoding (no +, /, or = padding)
    },
    
    // Newsletter this token grants access to
    newsletterId: {
      type: Schema.Types.ObjectId,
      ref: "Newsletter",
      required: true,
      index: true,
    },
    
    // Access role granted by this token
    role: {
      type: String,
      enum: ["viewer", "editor"],
      required: true,
      default: "viewer",
    },
    
    // User who created this share token (must be newsletter owner)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Revocation flag (soft delete - keeps audit trail)
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Optional expiration date (null = never expires)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Compound index for efficient lookups
ShareTokenSchema.index({ newsletterId: 1, revoked: 1 });

/**
 * Generate a cryptographically secure, URL-safe token.
 * 
 * Uses crypto.randomBytes for secure randomness.
 * Base64url encoding ensures URL safety (no +, /, or = padding).
 * 
 * @returns A secure, unguessable token string
 */
export function generateShareToken(): string {
  // Generate 32 random bytes (256 bits of entropy)
  const randomBytes = crypto.randomBytes(32);
  
  // Convert to base64url (URL-safe base64)
  // Replace + with -, / with _, and remove = padding
  return randomBytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Check if a token is valid (not revoked, not expired).
 * 
 * @param token - ShareToken document
 * @returns true if token is currently valid
 */
export function isTokenValid(token: {
  revoked: boolean;
  expiresAt: Date | null;
}): boolean {
  if (token.revoked) {
    return false;
  }
  
  if (token.expiresAt && token.expiresAt < new Date()) {
    return false;
  }
  
  return true;
}

export default models.ShareToken || model("ShareToken", ShareTokenSchema);
