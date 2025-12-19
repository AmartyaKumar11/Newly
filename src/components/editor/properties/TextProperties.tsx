"use client";

import type { TextBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { TextEffectsPanel } from "./TextEffectsPanel";

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
          Line Height
        </label>
        <input
          type="number"
          step="0.1"
          value={block.styles.lineHeight || 1.4}
          onChange={(e) =>
            updateBlockStyles(block.id, { lineHeight: parseFloat(e.target.value) || 1.4 })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          min="1.2"
          max="2.5"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Relative multiplier (default: 1.4)
        </p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Letter Spacing
        </label>
        <input
          type="number"
          step="0.1"
          value={block.styles.letterSpacing ?? 0}
          onChange={(e) =>
            updateBlockStyles(block.id, { letterSpacing: parseFloat(e.target.value) || 0 })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          min="-1"
          max="10"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Character spacing in pixels (default: 0)
        </p>
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

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Vertical Align
        </label>
        <select
          value={block.styles.verticalAlign || "top"}
          onChange={(e) =>
            updateBlockStyles(block.id, {
              verticalAlign: e.target.value as "top" | "center" | "bottom",
            })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Vertical alignment inside the text box
        </p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Text Role
        </label>
        <select
          value={block.role || "body"}
          onChange={(e) =>
            updateBlock(block.id, {
              role: e.target.value as "heading" | "subheading" | "body" | "caption" | undefined,
            })
          }
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="heading">Heading</option>
          <option value="subheading">Subheading</option>
          <option value="body">Body</option>
          <option value="caption">Caption</option>
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Semantic role (affects default styling hints only, can be overridden)
        </p>
      </div>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <TextEffectsPanel block={block} />
      </div>
    </div>
  );
}
