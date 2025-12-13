"use client";

import type { Block } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface LayoutPropertiesProps {
  block: Block;
}

export function LayoutProperties({ block }: LayoutPropertiesProps) {
  const { updateBlock, moveBlock, resizeBlock } = useEditorStateStore();

  return (
    <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        Layout
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            X Position
          </label>
          <input
            type="number"
            value={Math.round(block.position.x)}
            onChange={(e) =>
              moveBlock(block.id, {
                x: parseInt(e.target.value) || 0,
                y: block.position.y,
              })
            }
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="0"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Y Position
          </label>
          <input
            type="number"
            value={Math.round(block.position.y)}
            onChange={(e) =>
              moveBlock(block.id, {
                x: block.position.x,
                y: parseInt(e.target.value) || 0,
              })
            }
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Width
          </label>
          <input
            type="number"
            value={Math.round(block.size.width)}
            onChange={(e) =>
              resizeBlock(block.id, {
                width: parseInt(e.target.value) || 50,
                height: block.size.height,
              })
            }
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="50"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Height
          </label>
          <input
            type="number"
            value={Math.round(block.size.height)}
            onChange={(e) =>
              resizeBlock(block.id, {
                width: block.size.width,
                height: parseInt(e.target.value) || 50,
              })
            }
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            min="50"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Z-Index
        </label>
        <input
          type="number"
          value={block.zIndex}
          onChange={(e) => updateBlock(block.id, { zIndex: parseInt(e.target.value) || 1 })}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          min="1"
        />
      </div>
    </div>
  );
}
