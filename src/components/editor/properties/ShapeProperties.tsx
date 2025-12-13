"use client";

import type { ShapeBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface ShapePropertiesProps {
  block: ShapeBlock;
}

export function ShapeProperties({ block }: ShapePropertiesProps) {
  const { updateBlockStyles } = useEditorStateStore();

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Background Color
        </label>
        <input
          type="color"
          value={block.styles.backgroundColor || "#e5e7eb"}
          onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })}
          className="h-10 w-full rounded border border-zinc-300 dark:border-zinc-700"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Border Color
        </label>
        <input
          type="color"
          value={block.styles.borderColor || "#d1d5db"}
          onChange={(e) => updateBlockStyles(block.id, { borderColor: e.target.value })}
          className="h-10 w-full rounded border border-zinc-300 dark:border-zinc-700"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Border Width
        </label>
        <input
          type="number"
          value={block.styles.borderWidth || 1}
          onChange={(e) =>
            updateBlockStyles(block.id, { borderWidth: parseInt(e.target.value) || 0 })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          min="0"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Border Radius
        </label>
        <input
          type="number"
          value={block.styles.borderRadius || 0}
          onChange={(e) =>
            updateBlockStyles(block.id, { borderRadius: parseInt(e.target.value) || 0 })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          min="0"
        />
      </div>
    </div>
  );
}
