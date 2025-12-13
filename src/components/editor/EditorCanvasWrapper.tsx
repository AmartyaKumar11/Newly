"use client";

interface EditorCanvasWrapperProps {
  children?: React.ReactNode;
}

export function EditorCanvasWrapper({ children }: EditorCanvasWrapperProps) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="relative w-full max-w-4xl">
        {/* Canvas area - will contain the actual editor canvas */}
        <div className="min-h-[600px] rounded-lg border border-dashed border-zinc-300 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
          {children || (
            <div className="flex h-full min-h-[600px] items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Canvas Area
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Editor canvas will render here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
