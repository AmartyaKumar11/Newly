"use client";

import type { ImageBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface ImagePropertiesProps {
  block: ImageBlock;
}

export function ImageProperties({ block }: ImagePropertiesProps) {
  const { updateBlock, updateBlockStyles } = useEditorStateStore();

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Image URL
        </label>
        <input
          type="text"
          value={block.src}
          onChange={(e) => updateBlock(block.id, { src: e.target.value })}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Opacity
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={block.styles.opacity !== undefined ? block.styles.opacity : 1}
          onChange={(e) =>
            updateBlockStyles(block.id, { opacity: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {Math.round((block.styles.opacity !== undefined ? block.styles.opacity : 1) * 100)}%
        </span>
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
