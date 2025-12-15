// Helper utilities for AI block operations
// These ensure AI operations are properly grouped for undo/redo
// 
// NOTE: These functions mutate editor state. The translation layer
// (aiTranslation.ts) is pure and does NOT mutate state.

import type { Block } from "@/types/blocks";
import type { AIOutputSchema } from "@/types/aiOutputSchema";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { translateAIOutputToEditorBlocks } from "./aiTranslation";

/**
 * Insert blocks from AI output as a single undoable operation.
 * 
 * This function:
 * 1. Translates AI output to editor blocks (via pure translation layer)
 * 2. Groups all insertions as one undo operation
 * 
 * @param aiOutput - AI output conforming to AIOutputSchema
 * @returns Translation result with success status and any errors/warnings
 * 
 * Usage: Call this from a React component or hook
 */
export function insertBlocksFromAI(aiOutput: AIOutputSchema) {
  const store = useEditorStateStore.getState();
  
  // Get existing blocks for zIndex calculation and auto-positioning
  const existingBlocks = store.blocks;
  
  // Translate AI output to editor blocks (pure function, no side effects)
  const result = translateAIOutputToEditorBlocks(aiOutput, existingBlocks);
  
  if (!result.success || !result.blocks) {
    // Translation failed - return error result
    return result;
  }
  
  // Start action group (all blocks inserted as one undo operation)
  store.startActionGroup();
  
  // Add all translated blocks
  result.blocks.forEach((block) => {
    store.addBlock(block);
  });
  
  // End action group (pushes to history as one operation)
  store.endActionGroup();
  
  return result;
}

/**
 * Replace existing blocks with AI-generated blocks as a single operation.
 * 
 * This function:
 * 1. Translates AI output to editor blocks (via pure translation layer)
 * 2. Deletes old blocks and inserts new ones as one undo operation
 * 
 * @param blockIdsToReplace - Array of block IDs to replace
 * @param aiOutput - AI output conforming to AIOutputSchema
 * @returns Translation result with success status and any errors/warnings
 * 
 * Usage: Call this from a React component or hook
 */
export function replaceBlocksWithAI(
  blockIdsToReplace: string[],
  aiOutput: AIOutputSchema
) {
  const store = useEditorStateStore.getState();
  
  // Get existing blocks for zIndex calculation and auto-positioning
  const existingBlocks = store.blocks.filter(
    (b) => !blockIdsToReplace.includes(b.id)
  );
  
  // Translate AI output to editor blocks (pure function, no side effects)
  const result = translateAIOutputToEditorBlocks(aiOutput, existingBlocks);
  
  if (!result.success || !result.blocks) {
    // Translation failed - return error result
    return result;
  }
  
  // Start action group (all operations grouped as one undo step)
  store.startActionGroup();
  
  // Delete old blocks
  blockIdsToReplace.forEach((id) => {
    store.deleteBlock(id);
  });
  
  // Add new blocks
  result.blocks.forEach((block) => {
    store.addBlock(block);
  });
  
  // End action group
  store.endActionGroup();
  
  return result;
}

/**
 * Insert pre-translated blocks as a single undoable operation.
 * 
 * Use this when you already have editor Block[] and just need to insert them.
 * For AI output, use insertBlocksFromAI() instead.
 * 
 * @param blocks - Pre-translated editor blocks
 * 
 * Usage: Call this from a React component or hook
 */
export function insertEditorBlocks(blocks: Block[]) {
  const store = useEditorStateStore.getState();
  
  // Start action group
  store.startActionGroup();
  
  // Add all blocks
  blocks.forEach((block) => {
    store.addBlock(block);
  });
  
  // End action group (pushes to history as one operation)
  store.endActionGroup();
}
