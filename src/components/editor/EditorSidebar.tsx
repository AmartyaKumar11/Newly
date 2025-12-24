"use client";

import { useState } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { createTextBlock, createImageBlock, createShapeBlock, getNextZIndex } from "@/utils/blockFactory";
import { UploadsSidebar } from "./UploadsSidebar";
import type { Asset } from "@/hooks/useAssets";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./EditorCanvasWrapper";

type TabType = "text" | "elements" | "images" | "uploads";

export function EditorSidebar() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleInsertAsset = (asset: Asset) => {
    // Insert a single image block at the visual center of the canvas.
    const allBlocks = getBlocksByZIndex();
    const defaultWidth = 200;
    const defaultHeight = 200;
    const x = (CANVAS_WIDTH - defaultWidth) / 2;
    const y = (CANVAS_HEIGHT - defaultHeight) / 2;

    const newBlock = createImageBlock(asset.url, { x, y });
    newBlock.zIndex = getNextZIndex(allBlocks);
    addBlock(newBlock);
  };

  const navItems: { id: TabType; label: string; icon: JSX.Element }[] = [
    {
      id: "elements",
      label: "Elements",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {/* Heart (top-left) */}
          <path
            d="M4.5 4.5C4.5 3.5 5.5 2.5 7 3.5C8.5 2.5 9.5 3.5 9.5 4.5C9.5 5.5 7 8 7 8C7 8 4.5 5.5 4.5 4.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
          {/* Triangle (top-right) */}
          <path
            d="M14 4L17 9H11L14 4Z"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
          {/* Square (bottom-left) */}
          <rect x="4" y="12" width="5" height="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Circle (bottom-right) */}
          <circle cx="14.5" cy="14.5" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "images",
      label: "Images",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {/* Cloud shape */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 11v6m0 0l-3-3m3 3l3-3"
          />
        </svg>
      ),
    },
    {
      id: "uploads",
      label: "Uploads",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      ),
    },
    {
      id: "text",
      label: "Text",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {/* T with horizontal line on top and vertical line extending down */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 4h12M12 4v16"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Vertical Icon Navigation */}
      <div className="flex w-20 flex-col border-r border-zinc-200 dark:border-zinc-800">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsExpanded(true);
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-4 transition cursor-pointer ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
            title={item.label}
          >
            <div className={activeTab === item.id ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"}>
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Content Panel */}
      {isExpanded && (
        <div className="w-64 border-l border-zinc-200 dark:border-zinc-800">
          <div className="flex h-full flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {navItems.find((item) => item.id === activeTab)?.label}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                title="Close sidebar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "text" && (
              <div className="space-y-2">
                <button
                  onClick={handleAddText}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20 cursor-pointer"
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
                  className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20 cursor-pointer"
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
                  className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-left text-sm transition hover:border-blue-500 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/20 cursor-pointer"
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

            {activeTab === "uploads" && (
              <UploadsSidebar onInsertAsset={handleInsertAsset} />
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
