"use client";

import { useEffect } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { DraggableBlock } from "./blocks/DraggableBlock";

// Fixed canvas size for newsletter (standard email width)
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

export function EditorCanvasWrapper() {
  const {
    blocks,
    selectedBlockId,
    clearSelection,
    deleteBlock,
    duplicateBlock,
  } = useEditorStateStore();

  const sortedBlocks = blocks.sort((a, b) => a.zIndex - b.zIndex);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedBlockId) {
          e.preventDefault();
          deleteBlock(selectedBlockId);
        }
      } else if (e.key === "Escape") {
        clearSelection();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        // Duplicate (Cmd/Ctrl + D)
        if (selectedBlockId) {
          e.preventDefault();
          const duplicated = duplicateBlock(selectedBlockId);
          if (duplicated) {
            // Select the duplicated block
            // This will be handled by the store
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBlockId, deleteBlock, duplicateBlock, clearSelection]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only clear selection if clicking directly on canvas, not on a block
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="relative" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
        {/* Canvas area */}
        <div
          onClick={handleCanvasClick}
          className="relative rounded-lg border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            minHeight: `${CANVAS_HEIGHT}px`,
          }}
        >
          {sortedBlocks.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Canvas Area
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Add elements from the sidebar to get started
                </p>
              </div>
            </div>
          ) : (
            sortedBlocks.map((block) => (
              <DraggableBlock key={block.id} block={block} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
