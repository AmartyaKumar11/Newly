"use client";

export function EditorPropertiesPanel() {
  return (
    <div className="w-80 border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-full flex-col p-4">
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Properties
          </h2>
        </div>
        <div className="flex-1 space-y-4">
          {/* Placeholder for properties panel content */}
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Properties panel
            <br />
            (Block settings, styles, etc.)
          </div>
        </div>
      </div>
    </div>
  );
}
