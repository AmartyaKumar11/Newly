"use client";

import { useEditorStore } from "@/stores/editorStore";

interface EditorTopBarProps {
  newsletterTitle?: string;
}

export function EditorTopBar({ newsletterTitle }: EditorTopBarProps) {
  const { isDirty, isSaving, lastSaved } = useEditorStore();

  return (
    <div className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {newsletterTitle || "Untitled Newsletter"}
        </h1>
        {isDirty && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            • Unsaved changes
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {isSaving && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Saving...
          </span>
        )}
        {lastSaved && !isSaving && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
        {/* Placeholder for future toolbar actions */}
        <div className="h-8 w-8 rounded border border-dashed border-zinc-300 dark:border-zinc-700" />
      </div>
    </div>
  );
}
