/**
 * Server-Side Mutation Engine
 * 
 * Phase 4.1: Live Editing
 * 
 * Validates, orders, and applies mutations to authoritative state.
 * 
 * This engine ensures:
 * - Mutations are validated before application
 * - Version conflicts are detected and resolved
 * - Mutations are applied deterministically
 * - Invalid mutations are rejected
 */

import type { Mutation, MutationAck } from "@/types/mutations";
import {
  getDocumentVersion,
  incrementDocumentVersion,
  addPendingMutation,
  getPendingMutations,
  removePendingMutation,
} from "./mutationStore";
import type { Block } from "@/types/blocks";

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Apply mutation result
 */
interface ApplyResult {
  success: boolean;
  appliedVersion?: number;
  blocks?: Block[];
  reason?: string;
}

/**
 * Current authoritative state (in-memory cache)
 * This is synced from MongoDB but kept in memory for fast mutation application
 */
const authoritativeState = new Map<string, Block[]>();

/**
 * Initialize authoritative state from database
 */
export function initializeAuthoritativeState(newsletterId: string, blocks: Block[]): void {
  authoritativeState.set(newsletterId, JSON.parse(JSON.stringify(blocks))); // Deep clone
}

/**
 * Get authoritative state
 */
export function getAuthoritativeState(newsletterId: string): Block[] {
  return authoritativeState.get(newsletterId) || [];
}

/**
 * Validate mutation schema and permissions
 */
export function validateMutation(
  mutation: Mutation,
  role: "owner" | "editor" | "viewer"
): ValidationResult {
  // Viewers cannot mutate
  if (role === "viewer") {
    return {
      valid: false,
      reason: "Viewers cannot mutate document state",
    };
  }

  // Validate mutation type
  if (!mutation.type || !mutation.mutationId || !mutation.newsletterId) {
    return {
      valid: false,
      reason: "Invalid mutation structure",
    };
  }

  // Validate block-specific fields
  switch (mutation.type) {
    case "move_block":
    case "resize_block":
    case "delete_block":
    case "update_block_styles":
      if (!mutation.blockId) {
        return { valid: false, reason: "Missing blockId" };
      }
      break;

    case "add_block":
      if (!mutation.block || !mutation.block.id) {
        return { valid: false, reason: "Invalid block data" };
      }
      break;

    case "update_block":
      if (!mutation.blockId || !mutation.updates) {
        return { valid: false, reason: "Missing blockId or updates" };
      }
      break;

    case "undo":
    case "redo":
      if (!mutation.targetMutationId) {
        return { valid: false, reason: "Missing targetMutationId" };
      }
      break;
  }

  return { valid: true };
}

/**
 * Check if mutation can be applied (version compatibility)
 */
export function canApplyMutation(mutation: Mutation, newsletterId: string): ValidationResult {
  const version = getDocumentVersion(newsletterId);

  // Version mismatch: mutation is based on an older version
  if (mutation.baseVersion < version.version) {
    return {
      valid: false,
      reason: `Version conflict: mutation based on v${mutation.baseVersion}, current is v${version.version}`,
    };
  }

  return { valid: true };
}

/**
 * Apply mutation to authoritative state
 */
export function applyMutation(mutation: Mutation, newsletterId: string): ApplyResult {
  let blocks = getAuthoritativeState(newsletterId);

  try {
    switch (mutation.type) {
      case "move_block": {
        blocks = blocks.map((block) =>
          block.id === mutation.blockId
            ? { ...block, position: mutation.position }
            : block
        );
        break;
      }

      case "resize_block": {
        blocks = blocks.map((block) =>
          block.id === mutation.blockId ? { ...block, size: mutation.size } : block
        );
        break;
      }

      case "update_block": {
        blocks = blocks.map((block) =>
          block.id === mutation.blockId ? { ...block, ...mutation.updates } : block
        );
        break;
      }

      case "add_block": {
        // Check if block already exists
        if (blocks.some((b) => b.id === mutation.block.id)) {
          return {
            success: false,
            reason: "Block with same ID already exists",
          };
        }
        blocks = [...blocks, mutation.block];
        break;
      }

      case "delete_block": {
        blocks = blocks.filter((block) => block.id !== mutation.blockId);
        break;
      }

      case "update_block_styles": {
        blocks = blocks.map((block) =>
          block.id === mutation.blockId
            ? {
                ...block,
                styles: { ...block.styles, ...mutation.styles },
              }
            : block
        );
        break;
      }

      case "undo": {
        // Apply inverse mutation
        return applyMutation(mutation.inverseMutation, newsletterId);
      }

      case "redo": {
        // Reapply the mutation
        return applyMutation(mutation.redoMutation, newsletterId);
      }

      default:
        return {
          success: false,
          reason: `Unknown mutation type: ${(mutation as any).type}`,
        };
    }

    // Update authoritative state
    authoritativeState.set(newsletterId, blocks);

    // Increment version
    const appliedVersion = incrementDocumentVersion(newsletterId, mutation.mutationId);

    return {
      success: true,
      appliedVersion,
      blocks,
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Unknown error applying mutation",
    };
  }
}

/**
 * Process mutation (validate, apply, return result)
 */
export function processMutation(
  mutation: Mutation,
  role: "owner" | "editor" | "viewer"
): { ack: MutationAck; shouldBroadcast: boolean; blocks?: Block[] } {
  // Validate mutation
  const validation = validateMutation(mutation, role);
  if (!validation.valid) {
    return {
      ack: {
        mutationId: mutation.mutationId,
        accepted: false,
        appliedVersion: getDocumentVersion(mutation.newsletterId).version,
        reason: validation.reason,
      },
      shouldBroadcast: false,
    };
  }

  // Check version compatibility
  const canApply = canApplyMutation(mutation, mutation.newsletterId);
  if (!canApply.valid) {
    // Add to pending queue for later retry
    addPendingMutation(mutation.newsletterId, mutation);
    return {
      ack: {
        mutationId: mutation.mutationId,
        accepted: false,
        appliedVersion: getDocumentVersion(mutation.newsletterId).version,
        reason: canApply.reason,
      },
      shouldBroadcast: false,
    };
  }

  // Apply mutation
  const result = applyMutation(mutation, mutation.newsletterId);

  if (!result.success) {
    return {
      ack: {
        mutationId: mutation.mutationId,
        accepted: false,
        appliedVersion: getDocumentVersion(mutation.newsletterId).version,
        reason: result.reason,
      },
      shouldBroadcast: false,
    };
  }

  // Success - remove from pending if it was there
  removePendingMutation(mutation.newsletterId, mutation.mutationId);

  return {
    ack: {
      mutationId: mutation.mutationId,
      accepted: true,
      appliedVersion: result.appliedVersion!,
    },
    shouldBroadcast: true,
    blocks: result.blocks,
  };
}

/**
 * Process pending mutations (retry after version update)
 */
export function processPendingMutations(newsletterId: string): Mutation[] {
  const pending = getPendingMutations(newsletterId);
  const processed: Mutation[] = [];

  for (const mutation of pending) {
    const canApply = canApplyMutation(mutation, newsletterId);
    if (canApply.valid) {
      const result = applyMutation(mutation, newsletterId);
      if (result.success) {
        processed.push(mutation);
        removePendingMutation(newsletterId, mutation.mutationId);
      }
    }
  }

  return processed;
}
