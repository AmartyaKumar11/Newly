"use client";

import { useState } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { isTextBlock, isImageBlock, isShapeBlock, isContainerBlock } from "@/types/blocks";
import { TextProperties } from "./properties/TextProperties";
import { ImageProperties } from "./properties/ImageProperties";
import { ShapeProperties } from "./properties/ShapeProperties";
import { LayoutProperties } from "./properties/LayoutProperties";
import { SectionAIActions } from "./properties/SectionAIActions";
import { SectionAIPanel } from "./SectionAIPanel";

export function EditorPropertiesPanel() {
  const { getSelectedBlock } = useEditorStateStore();
  const selectedBlock = getSelectedBlock();
  const [sectionAIPanelState, setSectionAIPanelState] = useState<{
    isOpen: boolean;
    action: string;
  } | null>(null);

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
          {/* Section AI Actions - show for containers and text blocks */}
          {(isContainerBlock(selectedBlock) || isTextBlock(selectedBlock)) && (
            <SectionAIActions
              containerBlock={isContainerBlock(selectedBlock) ? selectedBlock : null}
              textBlock={isTextBlock(selectedBlock) ? selectedBlock : null}
              onActionClick={(action) => setSectionAIPanelState({ isOpen: true, action })}
            />
          )}

          {/* Type-specific properties */}
          {isTextBlock(selectedBlock) && <TextProperties block={selectedBlock} />}
          {isImageBlock(selectedBlock) && <ImageProperties block={selectedBlock} />}
          {isShapeBlock(selectedBlock) && <ShapeProperties block={selectedBlock} />}

          {/* Layout properties (common to all blocks) */}
          <LayoutProperties block={selectedBlock} />
        </div>
      </div>

      {/* Section AI Panel */}
      {sectionAIPanelState && selectedBlock && (isContainerBlock(selectedBlock) || isTextBlock(selectedBlock)) && (
        <SectionAIPanel
          isOpen={sectionAIPanelState.isOpen}
          containerBlock={isContainerBlock(selectedBlock) ? selectedBlock : null}
          textBlock={isTextBlock(selectedBlock) ? selectedBlock : null}
          action={sectionAIPanelState.action}
          onClose={() => setSectionAIPanelState(null)}
        />
      )}
    </div>
  );
}
