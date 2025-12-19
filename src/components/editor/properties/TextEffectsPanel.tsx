"use client";

import type { TextBlock } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";

interface TextEffectsPanelProps {
  block: TextBlock;
}

export function TextEffectsPanel({ block }: TextEffectsPanelProps) {
  const { updateBlockStyles } = useEditorStateStore();
  const effects = block.styles.effects || {};

  const updateEffects = (updates: Partial<typeof effects>) => {
    updateBlockStyles(block.id, {
      effects: { ...effects, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Text Effects</h3>

      {/* Shadow Effect */}
      <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Shadow</label>
          <input
            type="checkbox"
            checked={effects.shadow?.enabled || false}
            onChange={(e) =>
              updateEffects({
                shadow: {
                  ...effects.shadow,
                  enabled: e.target.checked,
                  offsetX: effects.shadow?.offsetX ?? 2,
                  offsetY: effects.shadow?.offsetY ?? 2,
                  blur: effects.shadow?.blur ?? 4,
                  color: effects.shadow?.color ?? "#000000",
                  opacity: effects.shadow?.opacity ?? 0.5,
                },
              })
            }
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
          />
        </div>
        {effects.shadow?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Offset X</label>
              <input
                type="number"
                value={effects.shadow.offsetX ?? 2}
                onChange={(e) =>
                  updateEffects({
                    shadow: { ...effects.shadow!, offsetX: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Offset Y</label>
              <input
                type="number"
                value={effects.shadow.offsetY ?? 2}
                onChange={(e) =>
                  updateEffects({
                    shadow: { ...effects.shadow!, offsetY: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Blur</label>
              <input
                type="number"
                value={effects.shadow.blur ?? 4}
                onChange={(e) =>
                  updateEffects({
                    shadow: { ...effects.shadow!, blur: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Color</label>
              <input
                type="color"
                value={effects.shadow.color || "#000000"}
                onChange={(e) =>
                  updateEffects({
                    shadow: { ...effects.shadow!, color: e.target.value },
                  })
                }
                className="h-8 w-full rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Outline Effect */}
      <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Outline</label>
          <input
            type="checkbox"
            checked={effects.outline?.enabled || false}
            onChange={(e) =>
              updateEffects({
                outline: {
                  ...effects.outline,
                  enabled: e.target.checked,
                  width: effects.outline?.width ?? 1,
                  color: effects.outline?.color ?? "#000000",
                },
              })
            }
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
          />
        </div>
        {effects.outline?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Width</label>
              <input
                type="number"
                value={effects.outline.width ?? 1}
                onChange={(e) =>
                  updateEffects({
                    outline: { ...effects.outline!, width: parseInt(e.target.value) || 1 },
                  })
                }
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Color</label>
              <input
                type="color"
                value={effects.outline.color || "#000000"}
                onChange={(e) =>
                  updateEffects({
                    outline: { ...effects.outline!, color: e.target.value },
                  })
                }
                className="h-8 w-full rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Highlight Effect */}
      <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Highlight</label>
          <input
            type="checkbox"
            checked={effects.highlight?.enabled || false}
            onChange={(e) =>
              updateEffects({
                highlight: {
                  ...effects.highlight,
                  enabled: e.target.checked,
                  color: effects.highlight?.color ?? "#ffff00",
                  opacity: effects.highlight?.opacity ?? 0.3,
                },
              })
            }
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
          />
        </div>
        {effects.highlight?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Color</label>
              <input
                type="color"
                value={effects.highlight.color || "#ffff00"}
                onChange={(e) =>
                  updateEffects({
                    highlight: { ...effects.highlight!, color: e.target.value },
                  })
                }
                className="h-8 w-full rounded border border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">Opacity</label>
              <input
                type="number"
                step="0.1"
                value={effects.highlight.opacity ?? 0.3}
                onChange={(e) =>
                  updateEffects({
                    highlight: { ...effects.highlight!, opacity: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                min="0"
                max="1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
