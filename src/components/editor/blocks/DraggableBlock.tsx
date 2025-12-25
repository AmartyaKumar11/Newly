"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Block } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { BlockRenderer } from "./BlockRenderer";
import { calculateResize, type ResizeHandle } from "@/utils/blockResize";
import { isTextBlock } from "@/types/blocks";
import { useLiveEditingContext } from "@/contexts/LiveEditingContext";
import { generateMutationId } from "@/types/mutations";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Canvas bounds
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

interface DraggableBlockProps {
  block: Block;
  isViewerMode?: boolean; // Read-only viewer mode (no mutations allowed)
}

export function DraggableBlock({ block, isViewerMode = false }: DraggableBlockProps) {
  const {
    selectedBlockId,
    hoveredBlockId,
    editorMode,
    selectBlock,
    setHoveredBlock,
    setEditorMode,
    moveBlock: storeMoveBlock,
    resizeBlock: storeResizeBlock,
    getBlock,
    updateBlockStyles: storeUpdateBlockStyles,
    blocks,
    startActionGroup,
    endActionGroup,
    updateBlock: storeUpdateBlock,
  } = useEditorStateStore();

  // Live editing context for mutation broadcasting
  // Context will return no-op functions if not available (handled in context)
  const { broadcastMutation, isConnected } = useLiveEditingContext();
  const params = useParams();
  const { data: session } = useSession();
  const newsletterId = params?.id as string;
  const userId = session?.user?.id || null;

  // Wrapped operations that broadcast mutations
  // Use useCallback to create stable function references for dependency arrays
  const moveBlockWithBroadcast = useCallback((id: string, position: { x: number; y: number }) => {
    storeMoveBlock(id, position);
    // Only broadcast if live editing is enabled and we have required data
    if (isConnected && !isViewerMode && newsletterId) {
      broadcastMutation({
        mutationId: generateMutationId(),
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "move_block",
        newsletterId,
        blockId: id,
        position,
      });
    }
  }, [storeMoveBlock, isConnected, isViewerMode, newsletterId, broadcastMutation, userId]);

  const resizeBlockWithBroadcast = useCallback((id: string, size: { width: number; height: number }) => {
    storeResizeBlock(id, size);
    // Only broadcast if live editing is enabled and we have required data
    if (isConnected && !isViewerMode && newsletterId) {
      broadcastMutation({
        mutationId: generateMutationId(),
        userId,
        timestamp: Date.now(),
        baseVersion: 0,
        type: "resize_block",
        newsletterId,
        blockId: id,
        size,
      });
    }
  }, [storeResizeBlock, isConnected, isViewerMode, newsletterId, broadcastMutation, userId]);

  const isSelected = block.id === selectedBlockId;
  const isHovered = block.id === hoveredBlockId;
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);
  const resizeHandleRef = useRef<ResizeHandle | null>(null);
  const hasSwitchedToFixedHeightRef = useRef<boolean>(false);

  // Handle drag start - disabled in viewer mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isViewerMode) return; // Viewer mode: no dragging allowed
    if (e.button !== 0) return; // Only left mouse button

    e.stopPropagation();
    selectBlock(block.id);

    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setEditorMode("dragging");
  };

  // Handle resize start - disabled in viewer mode
  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    if (isViewerMode) return; // Viewer mode: no resizing allowed
    e.stopPropagation();
    selectBlock(block.id);

    resizeHandleRef.current = handle;
    resizeStartRef.current = {
      width: block.size.width,
      height: block.size.height,
      x: e.clientX,
      y: e.clientY,
    };
    
    // Reset flag for this resize interaction
    hasSwitchedToFixedHeightRef.current = false;

    // Start action group to batch all resize updates into one undo step
    startActionGroup();
    setEditorMode("resizing");
  };

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (editorMode === "dragging" && dragStartRef.current && isSelected) {
        const currentBlock = getBlock(block.id);
        if (!currentBlock) return;

        const canvasRect = blockRef.current?.parentElement?.getBoundingClientRect();
        if (!canvasRect) return;

        // Calculate new position relative to canvas
        let newX = e.clientX - canvasRect.left - dragStartRef.current.x;
        let newY = e.clientY - canvasRect.top - dragStartRef.current.y;

        // Apply snapping to alignment guides
        const allBlocks = blocks;
        const SNAP_THRESHOLD = 5;
        const blockCenterX = newX + currentBlock.size.width / 2;
        const blockCenterY = newY + currentBlock.size.height / 2;
        const blockLeft = newX;
        const blockRight = newX + currentBlock.size.width;
        const blockTop = newY;
        const blockBottom = newY + currentBlock.size.height;

        // Canvas center snapping
        const canvasCenterX = CANVAS_WIDTH / 2;
        const canvasCenterY = CANVAS_HEIGHT / 2;

        if (Math.abs(blockCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
          newX = canvasCenterX - currentBlock.size.width / 2;
        }
        if (Math.abs(blockCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
          newY = canvasCenterY - currentBlock.size.height / 2;
        }

        // Snap to other blocks
        for (const otherBlock of allBlocks) {
          if (otherBlock.id === currentBlock.id) continue;

          const otherLeft = otherBlock.position.x;
          const otherRight = otherBlock.position.x + otherBlock.size.width;
          const otherTop = otherBlock.position.y;
          const otherBottom = otherBlock.position.y + otherBlock.size.height;
          const otherCenterX = otherBlock.position.x + otherBlock.size.width / 2;
          const otherCenterY = otherBlock.position.y + otherBlock.size.height / 2;

          // Vertical alignments
          if (Math.abs(blockLeft - otherLeft) <= SNAP_THRESHOLD) {
            newX = otherLeft;
          } else if (Math.abs(blockRight - otherRight) <= SNAP_THRESHOLD) {
            newX = otherRight - currentBlock.size.width;
          } else if (Math.abs(blockCenterX - otherCenterX) <= SNAP_THRESHOLD) {
            newX = otherCenterX - currentBlock.size.width / 2;
          }

          // Horizontal alignments
          if (Math.abs(blockTop - otherTop) <= SNAP_THRESHOLD) {
            newY = otherTop;
          } else if (Math.abs(blockBottom - otherBottom) <= SNAP_THRESHOLD) {
            newY = otherBottom - currentBlock.size.height;
          } else if (Math.abs(blockCenterY - otherCenterY) <= SNAP_THRESHOLD) {
            newY = otherCenterY - currentBlock.size.height / 2;
          }
        }

        // Constrain to canvas bounds
        const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - currentBlock.size.width));
        const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - currentBlock.size.height));

        moveBlockWithBroadcast(block.id, { x: constrainedX, y: constrainedY });
      }

      if (editorMode === "resizing" && resizeStartRef.current && resizeHandleRef.current && isSelected) {
        const currentBlock = getBlock(block.id);
        if (!currentBlock) return;

        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        // Check for modifier key (Shift = free resize for images)
        const allowFreeResize = e.shiftKey;

        // Use block-type-specific resize logic
        const resizeResult = calculateResize({
          block: currentBlock,
          handle: resizeHandleRef.current,
          deltaX,
          deltaY,
          startWidth: resizeStartRef.current.width,
          startHeight: resizeStartRef.current.height,
          startX: currentBlock.position.x,
          startY: currentBlock.position.y,
          allowFreeResize,
        });

        // CRITICAL: Resize logic is geometry-only (box-driven sizing)
        // - Updates ONLY block.size.width and block.size.height
        // - NEVER modifies block.styles.fontSize
        // - NEVER uses transform: scale
        // - Block-type-specific rules applied via calculateResize utility
        // 
        // Text blocks: Free resize, font size unchanged, text reflows
        // Image blocks: Aspect ratio preserved on corners (unless Shift), free on edges
        // Shape blocks: Free resize, no aspect ratio lock

        // For text blocks: If user manually resizes vertically, switch to fixed-height mode
        if (isTextBlock(currentBlock) && !hasSwitchedToFixedHeightRef.current) {
          const isVerticalResize = resizeHandleRef.current === "n" || 
                                   resizeHandleRef.current === "s" ||
                                   resizeHandleRef.current === "nw" ||
                                   resizeHandleRef.current === "ne" ||
                                   resizeHandleRef.current === "sw" ||
                                   resizeHandleRef.current === "se";
          
          // If user is resizing vertically and auto-height is enabled, switch to fixed-height
          // This only happens once per resize interaction
          if (isVerticalResize && currentBlock.styles.autoHeight !== false) {
            storeUpdateBlockStyles(currentBlock.id, { autoHeight: false });
            hasSwitchedToFixedHeightRef.current = true;
          }
        }

        // Apply resize (geometry-only, no style mutations)
        resizeBlockWithBroadcast(block.id, { width: resizeResult.width, height: resizeResult.height });
        if (resizeResult.x !== currentBlock.position.x || resizeResult.y !== currentBlock.position.y) {
          moveBlockWithBroadcast(block.id, { x: resizeResult.x, y: resizeResult.y });
        }
      }
    };

    const handleMouseUp = () => {
      // End action group if we were resizing (batches all resize updates into one undo step)
      if (editorMode === "resizing") {
        endActionGroup();
      }

      dragStartRef.current = null;
      resizeStartRef.current = null;
      resizeHandleRef.current = null;
      hasSwitchedToFixedHeightRef.current = false;
      setEditorMode("idle");
    };

    if (editorMode === "dragging" || editorMode === "resizing") {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editorMode, isSelected, block.id, moveBlockWithBroadcast, resizeBlockWithBroadcast, getBlock, setEditorMode, blocks, startActionGroup, endActionGroup, storeUpdateBlockStyles]);

  return (
    <div
      ref={blockRef}
      data-block-id={block.id}
      style={{
        position: "absolute",
        left: `${block.position.x}px`,
        top: `${block.position.y}px`,
        width: `${block.size.width}px`,
        height: `${block.size.height}px`,
        zIndex: block.zIndex,
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{ width: "100%", height: "100%" }}
      >
        <BlockRenderer
          block={block}
          isSelected={isSelected}
          isHovered={isHovered}
          onSelect={() => selectBlock(block.id)}
          onMouseEnter={() => setHoveredBlock(block.id)}
          onMouseLeave={() => setHoveredBlock(null)}
        />
      </div>

      {/* Resize handles - only show when selected and not in viewer mode */}
      {isSelected && !isViewerMode && (
        <>
          {/* East (right side) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "e")}
            style={{
              position: "absolute",
              right: "-4px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "20px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "e-resize",
              zIndex: 1000,
              pointerEvents: "auto",
              transition: "background-color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6";
            }}
          />
          {/* West (left side) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "w")}
            style={{
              position: "absolute",
              left: "-4px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "20px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "w-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
          {/* South (bottom side) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "s")}
            style={{
              position: "absolute",
              bottom: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "20px",
              height: "8px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "s-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
          {/* North (top side) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "n")}
            style={{
              position: "absolute",
              top: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "20px",
              height: "8px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "n-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
          {/* Southeast (bottom-right) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
            style={{
              position: "absolute",
              right: "-6px",
              bottom: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "se-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
          {/* Southwest (bottom-left) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
            style={{
              position: "absolute",
              left: "-6px",
              bottom: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "sw-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
          {/* Northeast (top-right) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
            style={{
              position: "absolute",
              right: "-6px",
              top: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "ne-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
          {/* Northwest (top-left) */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
            style={{
              position: "absolute",
              left: "-6px",
              top: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "2px",
              cursor: "nw-resize",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          />
        </>
      )}
    </div>
  );
}
