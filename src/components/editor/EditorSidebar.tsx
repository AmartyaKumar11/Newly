"use client";

import { useState } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { createTextBlock, createImageBlock, createShapeBlock, getNextZIndex } from "@/utils/blockFactory";

type TabType = "text" | "elements" | "images";

export function EditorSidebar() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const { blocks, addBlock, getBlocksByZIndex } = useEditorStateStore();

  const handleAddText = () => {
    const allBlocks = getBlocksByZIndex();
    const newBlock = createTextBlock("Text", { x: 100, y: 100 });
    newBlock.zIndex = getNextZIndex(allBlocks);
    addBlock(newBlock);
  };

  const handleAddShape = () => {
    const allBlocks = getBlocksByZIndex();
    const newBlock = createShapeBlock({ x: 100, y: 100 });
    newBlock.zIndex = getNextZIndex(allBlocks);
    addBlock(newBlock);
  };

  const handleAddImage = () => {
    // For Phase 2, we'll use a placeholder image URL
    // In a real implementation, this would open a file picker or URL input
    const imageUrl = prompt("Enter image URL (or use placeholder):");
    if (imageUrl || imageUrl === "") {
      const allBlocks = getBlocksByZIndex();
      const newBlock = createImageBlock(
        imageUrl || "https://via.placeholder.com/200x200",
        { x: 100, y: 100 }
      );
      newBlock.zIndex = getNextZIndex(allBlocks);
      addBlock(newBlock);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "text", label: "Text" },
    { id: "elements", label: "Elements" },
    { id: "images", label: "Images" },
  ];

  return (
    <div className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-full flex-col">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "text" && (
            <div className="space-y-2">
              <button
                onClick={handleAddText}
                className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <span className="font-medium">Text Block</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Add a text element
                </p>
              </button>
            </div>
          )}

          {activeTab === "elements" && (
            <div className="space-y-2">
              <button
                onClick={handleAddShape}
                className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16v12H4z"
                    />
                  </svg>
                  <span className="font-medium">Rectangle</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Add a shape element
                </p>
              </button>
            </div>
          )}

          {activeTab === "images" && (
            <div className="space-y-2">
              <button
                onClick={handleAddImage}
                className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">Image</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Add an image element
                </p>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
