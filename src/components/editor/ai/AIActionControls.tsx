"use client";

/**
 * AI Action Controls Component
 * 
 * Provides user control over what happens with AI-generated content.
 * All actions preserve single-step undo.
 */

interface AIActionControlsProps {
  onInsert: () => void;
  onAppend: () => void;
  onReplace: () => void;
  onCancel: () => void;
  canReplace: boolean;
  disabled?: boolean;
}

export function AIActionControls({
  onInsert,
  onAppend,
  onReplace,
  onCancel,
  canReplace,
  disabled = false,
}: AIActionControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        <p className="font-medium">Apply to editor?</p>
        <p className="text-xs">All changes can be undone with a single undo step</p>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Insert Button */}
        <button
          onClick={onInsert}
          disabled={disabled}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
          title="Insert at default position"
        >
          Insert
        </button>

        {/* Append Button */}
        <button
          onClick={onAppend}
          disabled={disabled}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
          title="Append at end of canvas"
        >
          Append
        </button>

        {/* Replace Button */}
        <button
          onClick={onReplace}
          disabled={disabled || !canReplace}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
          title={canReplace ? "Replace selected block" : "Select a block to replace"}
        >
          Replace
        </button>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={disabled}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
          title="Cancel - discard preview"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
