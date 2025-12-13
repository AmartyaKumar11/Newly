"use client";

import type { TextBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface TextPropertiesProps {
  block: TextBlock;
}

export function TextProperties({ block }: TextPropertiesProps) {
  const { updateBlockStyles, updateBlock } = useEditorStateStore();

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Content
        </label>
        <textarea
          value={block.content}
          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          rows={3}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Font Size
        </label>
        <input
          type="number"
          value={block.styles.fontSize || 16}
          onChange={(e) =>
            updateBlockStyles(block.id, { fontSize: parseInt(e.target.value) || 16 })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          min="8"
          max="72"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Font Weight
        </label>
        <select
          value={block.styles.fontWeight || "normal"}
          onChange={(e) => updateBlockStyles(block.id, { fontWeight: e.target.value })}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="300">Light</option>
          <option value="500">Medium</option>
          <option value="600">Semi Bold</option>
          <option value="700">Bold</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Text Color
        </label>
        <input
          type="color"
          value={block.styles.color || "#000000"}
          onChange={(e) => updateBlockStyles(block.id, { color: e.target.value })}
          className="h-10 w-full rounded border border-zinc-300 dark:border-zinc-700"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Text Align
        </label>
        <select
          value={block.styles.textAlign || "left"}
          onChange={(e) =>
            updateBlockStyles(block.id, {
              textAlign: e.target.value as "left" | "center" | "right" | "justify",
            })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>
    </div>
  );
}
