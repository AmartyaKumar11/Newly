/**
 * useEditorMutations Hook
 * 
 * Phase 4.1: Live Editing
 * 
 * Wraps editor operations to automatically broadcast mutations.
 * 
 * This hook provides mutation-aware versions of editor operations
 * that broadcast changes to other users in real-time.
 */

"use client";

import { useCallback } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { useLiveEditingContext } from "@/contexts/LiveEditingContext";
import { generateMutationId } from "@/types/mutations";
import type { Block, Position, Size, BlockStyles } from "@/types/blocks";

interface UseEditorMutationsOptions {
  newsletterId: string;
  userId: string | null;
}

/**
 * Hook that provides mutation-aware editor operations.
 * 
 * All operations automatically broadcast mutations when live editing is enabled.
 */
export function useEditorMutations({ newsletterId, userId }: UseEditorMutationsOptions) {
  const {
    moveBlock: storeMoveBlock,
    resizeBlock: storeResizeBlock,
    addBlock: storeAddBlock,
    deleteBlock: storeDeleteBlock,
    updateBlock: storeUpdateBlock,
    updateBlockStyles: storeUpdateBlockStyles,
  } = useEditorStateStore();

  const { broadcastMutation, isConnected } = useLiveEditingContext();

  // Wrapped operations that broadcast mutations
  const moveBlock = useCallback(
    (id: string, position: Position) => {
      // Apply locally (optimistic update)
      storeMoveBlock(id, position);

      // Broadcast mutation if live editing is enabled
      if (isConnected) {
        broadcastMutation({
          mutationId: generateMutationId(),
          userId,
          timestamp: Date.now(),
          baseVersion: 0, // Will be set by useLiveEditing hook
          type: "move_block",
          newsletterId,
          blockId: id,
          position,
        });
      }
    },
    [newsletterId, userId, storeMoveBlock, broadcastMutation, isConnected]
  );

  const resizeBlock = useCallback(
    (id: string, size: Size) => {
      // Apply locally
      storeResizeBlock(id, size);

      // Broadcast mutation
      if (isConnected) {
        broadcastMutation({
          mutationId: generateMutationId(),
          userId,
          timestamp: Date.now(),
          baseVersion: 0,
          type: "resize_block",
          newsletterId,
          blockId: id,
          size,
        });
      }
    },
    [newsletterId, userId, storeResizeBlock, broadcastMutation, isConnected]
  );

  const addBlock = useCallback(
    (block: Block) => {
      // Apply locally
      storeAddBlock(block);

      // Broadcast mutation
      if (isConnected) {
        broadcastMutation({
          mutationId: generateMutationId(),
          userId,
          timestamp: Date.now(),
          baseVersion: 0,
          type: "add_block",
          newsletterId,
          block,
        });
      }
    },
    [newsletterId, userId, storeAddBlock, broadcastMutation, isConnected]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      // Apply locally
      storeDeleteBlock(id);

      // Broadcast mutation
      if (isConnected) {
        broadcastMutation({
          mutationId: generateMutationId(),
          userId,
          timestamp: Date.now(),
          baseVersion: 0,
          type: "delete_block",
          newsletterId,
          blockId: id,
        });
      }
    },
    [newsletterId, userId, storeDeleteBlock, broadcastMutation, isConnected]
  );

  const updateBlock = useCallback(
    (id: string, updates: Partial<Block>) => {
      // Apply locally
      storeUpdateBlock(id, updates);

      // Broadcast mutation
      if (isConnected) {
        broadcastMutation({
          mutationId: generateMutationId(),
          userId,
          timestamp: Date.now(),
          baseVersion: 0,
          type: "update_block",
          newsletterId,
          blockId: id,
          updates,
        });
      }
    },
    [newsletterId, userId, storeUpdateBlock, broadcastMutation, isConnected]
  );

  const updateBlockStyles = useCallback(
    (id: string, styles: Partial<BlockStyles>) => {
      // Apply locally
      storeUpdateBlockStyles(id, styles);

      // Broadcast mutation
      if (isConnected) {
        broadcastMutation({
          mutationId: generateMutationId(),
          userId,
          timestamp: Date.now(),
          baseVersion: 0,
          type: "update_block_styles",
          newsletterId,
          blockId: id,
          styles,
        });
      }
    },
    [newsletterId, userId, storeUpdateBlockStyles, broadcastMutation, isConnected]
  );

  return {
    moveBlock,
    resizeBlock,
    addBlock,
    deleteBlock,
    updateBlock,
    updateBlockStyles,
    isLiveEditingEnabled: isConnected,
  };
}
