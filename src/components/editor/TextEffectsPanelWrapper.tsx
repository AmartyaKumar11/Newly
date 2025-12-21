"use client";

import { useEffect, useState } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { TextEffectsPanel } from "./properties/TextEffectsPanel";
import type { Block } from "@/types/blocks";
import { isTextBlock } from "@/types/blocks";

export function TextEffectsPanelWrapper() {
  const { getBlock, selectedBlockId } = useEditorStateStore();
  const [isOpen, setIsOpen] = useState(false);
  const [blockId, setBlockId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const { blockId: id } = e.detail;
      setBlockId(id);
      setIsOpen(true);
    };

    window.addEventListener("open-text-effects-panel", handleOpen as EventListener);
    return () => window.removeEventListener("open-text-effects-panel", handleOpen as EventListener);
  }, []);

  // Close if block is deselected
  useEffect(() => {
    if (blockId && selectedBlockId !== blockId) {
      setIsOpen(false);
      setBlockId(null);
    }
  }, [selectedBlockId, blockId]);

  if (!isOpen || !blockId) return null;

  const block = getBlock(blockId);
  if (!block || !isTextBlock(block)) {
    setIsOpen(false);
    setBlockId(null);
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    setBlockId(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[105] cursor-pointer bg-black/20"
        onClick={handleClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-[110] h-full w-80 bg-white shadow-xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Text Effects</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ height: "calc(100vh - 73px)" }}>
          <TextEffectsPanel block={block} />
        </div>
      </div>
    </>
  );
}
