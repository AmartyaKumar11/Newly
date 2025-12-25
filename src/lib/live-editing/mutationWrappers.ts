/**
 * Mutation Wrappers
 * 
 * Phase 4.1: Live Editing
 * 
 * Wrappers that broadcast mutations when editor operations are performed.
 * 
 * These wrappers intercept editor operations and:
 * 1. Create mutation objects
 * 2. Broadcast to server (optimistic update)
 * 3. Apply locally (already done by editor store)
 * 
 * This ensures all mutations are synchronized.
 */

import type { Mutation } from "@/types/mutations";
import type { Block, Position, Size, BlockStyles } from "@/types/blocks";

/**
 * Create mutation wrapper function
 */
export function createMutationWrapper(
  createMutation: (mutation: Mutation) => void
) {
  return {
    moveBlock: (blockId: string, position: Position, newsletterId: string, userId: string | null) => {
      const mutation: Mutation = {
        mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        timestamp: Date.now(),
        baseVersion: 0, // Will be set by useLiveEditing
        type: "move_block",
        newsletterId,
        blockId,
        position,
      };
      createMutation(mutation);
    },

    resizeBlock: (blockId: string, size: Size, newsletterId: string, userId: string | null) => {
      const mutation: Mutation = {
        mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "resize_block",
        newsletterId,
        blockId,
        size,
      };
      createMutation(mutation);
    },

    addBlock: (block: Block, newsletterId: string, userId: string | null) => {
      const mutation: Mutation = {
        mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "add_block",
        newsletterId,
        block,
      };
      createMutation(mutation);
    },

    deleteBlock: (blockId: string, newsletterId: string, userId: string | null) => {
      const mutation: Mutation = {
        mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "delete_block",
        newsletterId,
        blockId,
      };
      createMutation(mutation);
    },

    updateBlock: (blockId: string, updates: Partial<Block>, newsletterId: string, userId: string | null) => {
      const mutation: Mutation = {
        mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "update_block",
        newsletterId,
        blockId,
        updates,
      };
      createMutation(mutation);
    },

    updateBlockStyles: (blockId: string, styles: Partial<BlockStyles>, newsletterId: string, userId: string | null) => {
      const mutation: Mutation = {
        mutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "update_block_styles",
        newsletterId,
        blockId,
        styles,
      };
      createMutation(mutation);
    },
  };
}
