"use client";

import { useState } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import type { Block } from "@/types/blocks";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

interface PositionSidebarProps {
  block: Block;
  isOpen: boolean;
  onClose: () => void;
}

export function PositionSidebar({ block, isOpen, onClose }: PositionSidebarProps) {
  const { updateBlock, moveBlock, resizeBlock, blocks } = useEditorStateStore();
  const [activeTab, setActiveTab] = useState<"arrange" | "layers">("arrange");
  const [lockAspectRatio, setLockAspectRatio] = useState(false);

  if (!isOpen) return null;

  // Get all blocks sorted by zIndex for layer management
  const sortedBlocks = [...blocks].sort((a, b) => a.zIndex - b.zIndex);
  const currentBlockIndex = sortedBlocks.findIndex((b) => b.id === block.id);
  const maxZIndex = Math.max(...blocks.map((b) => b.zIndex), 0);

  // Arrange functions
  const handleForward = () => {
    const newZIndex = Math.min(block.zIndex + 1, maxZIndex + 1);
    updateBlock(block.id, { zIndex: newZIndex });
  };

  const handleBackward = () => {
    const newZIndex = Math.max(block.zIndex - 1, 1);
    updateBlock(block.id, { zIndex: newZIndex });
  };

  const handleToFront = () => {
    updateBlock(block.id, { zIndex: maxZIndex + 1 });
  };

  const handleToBack = () => {
    updateBlock(block.id, { zIndex: 1 });
  };

  // Align to page functions
  const handleAlignTop = () => {
    moveBlock(block.id, { x: block.position.x, y: 0 });
  };

  const handleAlignLeft = () => {
    moveBlock(block.id, { x: 0, y: block.position.y });
  };

  const handleAlignMiddle = () => {
    const y = (CANVAS_HEIGHT - block.size.height) / 2;
    moveBlock(block.id, { x: block.position.x, y });
  };

  const handleAlignCenter = () => {
    const x = (CANVAS_WIDTH - block.size.width) / 2;
    moveBlock(block.id, { x, y: block.position.y });
  };

  const handleAlignBottom = () => {
    const y = CANVAS_HEIGHT - block.size.height;
    moveBlock(block.id, { x: block.position.x, y });
  };

  const handleAlignRight = () => {
    const x = CANVAS_WIDTH - block.size.width;
    moveBlock(block.id, { x, y: block.position.y });
  };

  // Advanced controls
  const handleWidthChange = (newWidth: number) => {
    if (lockAspectRatio && block.size.width > 0) {
      const ratio = block.size.height / block.size.width;
      const newHeight = newWidth * ratio;
      resizeBlock(block.id, { width: newWidth, height: newHeight });
    } else {
      resizeBlock(block.id, { width: newWidth, height: block.size.height });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (lockAspectRatio && block.size.height > 0) {
      const ratio = block.size.width / block.size.height;
      const newWidth = newHeight * ratio;
      resizeBlock(block.id, { width: newWidth, height: newHeight });
    } else {
      resizeBlock(block.id, { width: block.size.width, height: newHeight });
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[105] cursor-pointer bg-black/20"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-[110] h-full w-80 bg-white shadow-xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Position</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 cursor-pointer"
            title="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("arrange")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer ${
              activeTab === "arrange"
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            Arrange
          </button>
          <button
            onClick={() => setActiveTab("layers")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition cursor-pointer ${
              activeTab === "layers"
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            Layers
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ height: "calc(100vh - 120px)" }}>
          {activeTab === "arrange" && (
            <div className="space-y-6">
              {/* Arrange Section */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Arrange
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleForward}
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Move forward"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <span>Forward</span>
                  </button>
                  <button
                    onClick={handleBackward}
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Move backward"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                    <span>Backward</span>
                  </button>
                  <button
                    onClick={handleToFront}
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Bring to front"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>To front</span>
                  </button>
                  <button
                    onClick={handleToBack}
                    className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Send to back"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>To back</span>
                  </button>
                </div>
              </div>

              {/* Align to page Section */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Align to page
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleAlignTop}
                    className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Align to top"
                  >
                    Top
                  </button>
                  <button
                    onClick={handleAlignLeft}
                    className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Align to left"
                  >
                    Left
                  </button>
                  <button
                    onClick={handleAlignMiddle}
                    className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Align to middle (vertical center)"
                  >
                    Middle
                  </button>
                  <button
                    onClick={handleAlignCenter}
                    className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Align to center (horizontal center)"
                  >
                    Center
                  </button>
                  <button
                    onClick={handleAlignBottom}
                    className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Align to bottom"
                  >
                    Bottom
                  </button>
                  <button
                    onClick={handleAlignRight}
                    className="flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Align to right"
                  >
                    Right
                  </button>
                </div>
              </div>

              {/* Advanced Section */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Advanced
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Width
                      </label>
                      <input
                        type="number"
                        value={Math.round(block.size.width)}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 50)}
                        className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        min="50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Height
                      </label>
                      <input
                        type="number"
                        value={Math.round(block.size.height)}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 50)}
                        className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        min="50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Ratio
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="Locked"
                        readOnly
                        className="flex-1 rounded border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                      />
                      <button
                        onClick={() => setLockAspectRatio(!lockAspectRatio)}
                        className={`flex h-9 w-9 items-center justify-center rounded border transition cursor-pointer ${
                          lockAspectRatio
                            ? "border-blue-600 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-300"
                            : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                        title={lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {lockAspectRatio ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        X
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
                        className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Y
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
                        className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Rotate
                    </label>
                    <input
                      type="number"
                      value="0"
                      readOnly
                      className="w-full rounded border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                      disabled
                    />
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Rotation coming soon
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "layers" && (
            <div className="space-y-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Layers
              </h3>
              {sortedBlocks.map((b, index) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-2 rounded-lg border p-2 ${
                    b.id === block.id
                      ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {b.type === "text" ? "Text" : b.type === "image" ? "Image" : b.type === "shape" ? "Shape" : "Container"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">z-index: {b.zIndex}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
