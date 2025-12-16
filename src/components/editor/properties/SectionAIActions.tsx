"use client";

/**
 * Section AI Actions Component
 * 
 * Displays AI action buttons for section-level operations.
 * Shown when a container block or text block is selected.
 */

import type { ContainerBlock, TextBlock } from "@/types/blocks";

interface SectionAIActionsProps {
  containerBlock: ContainerBlock | null;
  textBlock: TextBlock | null;
  onActionClick: (action: string) => void;
}

export function SectionAIActions({ containerBlock, textBlock, onActionClick }: SectionAIActionsProps) {
  const actions = [
    { id: "rewrite", label: "Rewrite", description: "Improve wording and flow" },
    { id: "shorten", label: "Shorten", description: "Make more concise" },
    { id: "expand", label: "Expand", description: "Add more detail" },
    { id: "improve_clarity", label: "Improve Clarity", description: "Make easier to understand" },
    { id: "make_persuasive", label: "Make Persuasive", description: "Strengthen the argument" },
    { id: "change_tone", label: "Change Tone", description: "Adjust writing style" },
  ];

  const elementCount = containerBlock 
    ? containerBlock.children.length 
    : textBlock 
    ? 1 
    : 0;

  return (
    <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        AI Actions
      </h3>
      {/* P0-4: Explicit User Trust Messaging */}
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 p-2 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
        <p>✓ Only this {containerBlock ? "section" : "text block"} will be modified</p>
        <p>✓ Changes can be undone in one step</p>
      </div>
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
        Apply AI to this {containerBlock ? "section" : "text block"} ({elementCount} {elementCount === 1 ? "element" : "elements"})
      </p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            className="rounded-lg border border-blue-600 bg-blue-50 px-3 py-2 text-left text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
            title={action.description}
          >
            <div className="font-semibold">{action.label}</div>
            <div className="mt-0.5 text-xs opacity-75">{action.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
