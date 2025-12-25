"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { DraggableBlock } from "./blocks/DraggableBlock";
import { AlignmentGuides } from "./AlignmentGuides";
import { assetToImageBlock, calculateDropPosition } from "@/utils/assetToBlock";
import { getNextZIndex } from "@/utils/blockFactory";
import type { Asset } from "@/hooks/useAssets";
import type { PresenceState } from "@/hooks/usePresence";
import { PresenceCursors } from "@/components/presence/PresenceCursors";

// Fixed canvas size for newsletter (standard email width)
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

interface EditorCanvasWrapperProps {
  isViewerMode?: boolean; // Read-only viewer mode (no mutations allowed)
  presence?: PresenceState; // Phase 4.0: Presence awareness
}

export function EditorCanvasWrapper({ isViewerMode = false, presence }: EditorCanvasWrapperProps = {}) {
  const {
    blocks,
    selectedBlockId,
    clearSelection,
    deleteBlock,
    duplicateBlock,
    undo,
    redo,
    canUndo,
    canRedo,
    zoomLevel,
    setZoomLevel,
    editorMode,
    getBlock,
    addBlock,
    getBlocksByZIndex,
  } = useEditorStateStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const draggedAssetRef = useRef<Asset | null>(null);

  const sortedBlocks = blocks.sort((a, b) => a.zIndex - b.zIndex);

  // Calculate zoom to fit canvas in viewport (auto-fit on mount/resize)
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current) return 1;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Add some padding (20px on each side)
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;
    
    // Calculate scale to fit both width and height
    const scaleX = availableWidth / CANVAS_WIDTH;
    const scaleY = availableHeight / CANVAS_HEIGHT;
    
    // Use the smaller scale to ensure everything fits
    return Math.min(scaleX, scaleY, 1); // Max zoom is 1x (100%)
  }, []);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Auto-fit on mount or when zoom is reset to 0.1 (fit button clicked)
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      // If zoom is 1 (initial) or 0.1 (fit button clicked), calculate fit
      if (zoomLevel === 1 || zoomLevel === 0.1) {
        const fitZoom = calculateFitZoom();
        // Set the calculated fit zoom (or 1 if larger)
        setZoomLevel(Math.min(fitZoom, 1));
      }
    }
  }, [containerSize, calculateFitZoom, zoomLevel, setZoomLevel]);

  // Keyboard shortcuts - disabled in viewer mode (no mutations allowed)
  useEffect(() => {
    if (isViewerMode) return; // Viewer mode: no keyboard shortcuts

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedBlockId) {
          e.preventDefault();
          deleteBlock(selectedBlockId);
        }
      } else if (e.key === "Escape") {
        clearSelection();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        // Duplicate (Cmd/Ctrl + D)
        if (selectedBlockId) {
          e.preventDefault();
          const duplicated = duplicateBlock(selectedBlockId);
          if (duplicated) {
            // Select the duplicated block
            // This will be handled by the store
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        // Undo (Cmd/Ctrl + Z)
        if (canUndo()) {
          e.preventDefault();
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        // Redo (Cmd/Ctrl + Y or Cmd/Ctrl + Shift + Z)
        if (canRedo()) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewerMode, selectedBlockId, deleteBlock, duplicateBlock, clearSelection, undo, redo, canUndo, canRedo]);

  // Track mouse movement for presence cursor broadcasting (Phase 4.0)
  // This is visual-only and does not affect editor state
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!presence || !canvasRef.current) return;

    // Calculate cursor position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    // Broadcast cursor position (throttled in hook)
    presence.broadcastCursor(x, y);
  }, [presence, zoomLevel]);

  const handleMouseLeave = useCallback(() => {
    if (!presence) return;
    // Clear cursor when mouse leaves canvas
    presence.clearCursor();
  }, [presence]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Viewer mode: no selection clearing (read-only)
    if (isViewerMode) return;
    
    // Only clear selection if clicking directly on canvas, not on a block
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // Drag-and-drop handlers for asset insertion
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Check if this is an asset drag (has asset data)
    if (e.dataTransfer.types.includes("application/x-asset-id")) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only set drag over to false if we're leaving the canvas element itself
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      // Check if this is an asset drop
      const assetId = e.dataTransfer.getData("application/x-asset-id");
      if (!assetId || !draggedAssetRef.current) {
        return;
      }

      const asset = draggedAssetRef.current;
      draggedAssetRef.current = null;

      // Get canvas bounding rect to calculate drop position
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // Calculate drop position relative to canvas (accounting for zoom)
      const clientX = e.clientX;
      const clientY = e.clientY;
      const relativeX = (clientX - canvasRect.left) / zoomLevel;
      const relativeY = (clientY - canvasRect.top) / zoomLevel;

      // Convert asset to image block with drop position
      const allBlocks = getBlocksByZIndex();
      const size = assetToImageBlock(asset).size; // Get calculated size
      const position = calculateDropPosition(relativeX, relativeY, size);
      const newBlock = assetToImageBlock(asset, position, size);

      // Set zIndex to appear above existing blocks
      newBlock.zIndex = getNextZIndex(allBlocks);

      // Insert via editor store (creates one undo step automatically)
      addBlock(newBlock);
    },
    [zoomLevel, getBlocksByZIndex, addBlock]
  );

  // Listen for asset drag start events from UploadsSidebar
  useEffect(() => {
    const handleAssetDragStart = (event: CustomEvent<{ asset: Asset }>) => {
      draggedAssetRef.current = event.detail.asset;
    };

    window.addEventListener("asset-drag-start", handleAssetDragStart as EventListener);
    return () => {
      window.removeEventListener("asset-drag-start", handleAssetDragStart as EventListener);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950"
      style={{ overflow: "hidden" }} // Remove scrollbars
    >
      <div
        className="flex items-center justify-center"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: "center center",
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
        }}
      >
        {/* Canvas area */}
        <div
          ref={canvasRef}
          data-canvas-element
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onDragOver={isViewerMode ? undefined : handleDragOver}
          onDragLeave={isViewerMode ? undefined : handleDragLeave}
          onDrop={isViewerMode ? undefined : handleDrop}
          className={`relative rounded-lg border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${
            isDragOver ? "ring-2 ring-blue-500 ring-offset-2" : ""
          }`}
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            minHeight: `${CANVAS_HEIGHT}px`,
          }}
        >
          {/* Alignment guides - shown when dragging */}
          {selectedBlockId && editorMode === "dragging" && (
            <AlignmentGuides
              draggingBlock={getBlock(selectedBlockId) || null}
              allBlocks={blocks}
              editorMode={editorMode}
            />
          )}

          {sortedBlocks.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Canvas Area
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Add elements from the sidebar to get started
                </p>
              </div>
            </div>
          ) : (
            sortedBlocks.map((block) => (
              <DraggableBlock key={block.id} block={block} isViewerMode={isViewerMode} />
            ))
          )}

          {/* Presence Cursors - Ghost cursors for other users (Phase 4.0) */}
          {presence?.isConnected && canvasRef.current && (
            <PresenceCursors
              sessions={presence.sessions}
              canvasElement={canvasRef.current}
              zoom={zoomLevel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
