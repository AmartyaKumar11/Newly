// Helper utilities for AI block operations
// These ensure AI operations are properly grouped for undo/redo

import type { Block } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

/**
 * Insert multiple blocks from AI as a single undoable operation
 * This ensures AI insertions can be reverted with one undo step
 * 
 * Usage: Call this from a React component or hook
 */
export function insertBlocksFromAI(blocks: Block[]) {
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

/**
 * Replace existing blocks with AI-generated blocks as a single operation
 * 
 * Usage: Call this from a React component or hook
 */
export function replaceBlocksWithAI(blockIdsToReplace: string[], newBlocks: Block[]) {
  const store = useEditorStateStore.getState();
  
  // Start action group
  store.startActionGroup();
  
  // Delete old blocks
  blockIdsToReplace.forEach((id) => {
    store.deleteBlock(id);
  });
  
  // Add new blocks
  newBlocks.forEach((block) => {
    store.addBlock(block);
  });
  
  // End action group
  store.endActionGroup();
}
