"use client";

import { useEditorStateStore } from "@/stores/editorStateStore";
import { isTextBlock, isImageBlock, isShapeBlock } from "@/types/blocks";
import { TextProperties } from "./properties/TextProperties";
import { ImageProperties } from "./properties/ImageProperties";
import { ShapeProperties } from "./properties/ShapeProperties";
import { LayoutProperties } from "./properties/LayoutProperties";

export function EditorPropertiesPanel() {
  const { getSelectedBlock } = useEditorStateStore();
  const selectedBlock = getSelectedBlock();

  if (!selectedBlock) {
    return (
      <div className="w-80 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-full flex-col p-4">
          <div className="mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Properties
            </h2>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select an element to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Properties
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)} Block
          </p>
        </div>

        <div className="space-y-6">
          {/* Type-specific properties */}
          {isTextBlock(selectedBlock) && <TextProperties block={selectedBlock} />}
          {isImageBlock(selectedBlock) && <ImageProperties block={selectedBlock} />}
          {isShapeBlock(selectedBlock) && <ShapeProperties block={selectedBlock} />}

          {/* Layout properties (common to all blocks) */}
          <LayoutProperties block={selectedBlock} />
        </div>
      </div>
    </div>
  );
}
