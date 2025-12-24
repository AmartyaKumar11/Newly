"use client";

import { useRef, useEffect } from "react";
import type { Block } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { BlockRenderer } from "./BlockRenderer";
import { isTextBlock } from "@/types/blocks";

// Canvas bounds
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

interface DraggableBlockProps {
  block: Block;
}

export function DraggableBlock({ block }: DraggableBlockProps) {
  const {
    selectedBlockId,
    hoveredBlockId,
    editorMode,
    selectBlock,
    setHoveredBlock,
    setEditorMode,
    moveBlock,
    resizeBlock,
    getBlock,
    updateBlockStyles,
    blocks,
  } = useEditorStateStore();

  const isSelected = block.id === selectedBlockId;
  const isHovered = block.id === hoveredBlockId;
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);
  const resizeHandleRef = useRef<"se" | "sw" | "ne" | "nw" | "e" | "w" | "n" | "s" | null>(null);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
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

  // Handle resize start
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    handle: "se" | "sw" | "ne" | "nw" | "e" | "w" | "n" | "s"
  ) => {
    e.stopPropagation();
    selectBlock(block.id);

    resizeHandleRef.current = handle;
    resizeStartRef.current = {
      width: block.size.width,
      height: block.size.height,
      x: e.clientX,
      y: e.clientY,
    };

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

        moveBlock(block.id, { x: constrainedX, y: constrainedY });
      }

      if (editorMode === "resizing" && resizeStartRef.current && resizeHandleRef.current && isSelected) {
        const currentBlock = getBlock(block.id);
        if (!currentBlock) return;

        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newX = currentBlock.position.x;
        let newY = currentBlock.position.y;

        // Handle different resize handles
        switch (resizeHandleRef.current) {
          case "se": // Southeast (bottom-right)
            newWidth = Math.max(50, Math.min(resizeStartRef.current.width + deltaX, CANVAS_WIDTH - currentBlock.position.x));
            newHeight = Math.max(50, Math.min(resizeStartRef.current.height + deltaY, CANVAS_HEIGHT - currentBlock.position.y));
            break;
          case "sw": // Southwest (bottom-left)
            newWidth = Math.max(50, Math.min(resizeStartRef.current.width - deltaX, currentBlock.position.x + currentBlock.size.width));
            newHeight = Math.max(50, Math.min(resizeStartRef.current.height + deltaY, CANVAS_HEIGHT - currentBlock.position.y));
            newX = currentBlock.position.x + (currentBlock.size.width - newWidth);
            break;
          case "ne": // Northeast (top-right)
            newWidth = Math.max(50, Math.min(resizeStartRef.current.width + deltaX, CANVAS_WIDTH - currentBlock.position.x));
            newHeight = Math.max(50, Math.min(resizeStartRef.current.height - deltaY, currentBlock.position.y + currentBlock.size.height));
            newY = currentBlock.position.y + (currentBlock.size.height - newHeight);
            break;
          case "nw": // Northwest (top-left)
            newWidth = Math.max(50, Math.min(resizeStartRef.current.width - deltaX, currentBlock.position.x + currentBlock.size.width));
            newHeight = Math.max(50, Math.min(resizeStartRef.current.height - deltaY, currentBlock.position.y + currentBlock.size.height));
            newX = currentBlock.position.x + (currentBlock.size.width - newWidth);
            newY = currentBlock.position.y + (currentBlock.size.height - newHeight);
            break;
          case "e": // East (right side) - horizontal resize only
            newWidth = Math.max(
              50,
              Math.min(resizeStartRef.current.width + deltaX, CANVAS_WIDTH - currentBlock.position.x)
            );
            break;
          case "w": // West (left side) - horizontal resize only
            newWidth = Math.max(
              50,
              Math.min(resizeStartRef.current.width - deltaX, currentBlock.position.x + currentBlock.size.width)
            );
            newX = currentBlock.position.x + (currentBlock.size.width - newWidth);
            break;
          case "s": // South (bottom side) - vertical resize only
            newHeight = Math.max(
              50,
              Math.min(resizeStartRef.current.height + deltaY, CANVAS_HEIGHT - currentBlock.position.y)
            );
            break;
          case "n": // North (top side) - vertical resize only
            newHeight = Math.max(
              50,
              Math.min(resizeStartRef.current.height - deltaY, currentBlock.position.y + currentBlock.size.height)
            );
            newY = currentBlock.position.y + (currentBlock.size.height - newHeight);
            break;
        }

        // Constrain position
        newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - newWidth));
        newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - newHeight));

        // CRITICAL: Resize logic is geometry-only (box-driven sizing)
        // - Updates ONLY block.size.width and block.size.height
        // - NEVER modifies block.styles.fontSize
        // - NEVER uses transform: scale
        // - Works identically for all block types (text, image, shape)
        // 
        // Defensive guard: Prevent any font size changes during resize
        // This ensures text blocks behave like image/shape blocks (geometry-only)
        // Text content wraps/reflows within the fixed bounding box
        if (isTextBlock(currentBlock)) {
          // Explicitly ensure fontSize is NOT modified during resize
          // Font size remains constant; text wraps within the resized box
          // Overflow detection will handle visual indication if needed
        }

        // Apply resize (geometry-only, no style mutations)
        resizeBlock(block.id, { width: newWidth, height: newHeight });
        if (newX !== currentBlock.position.x || newY !== currentBlock.position.y) {
          moveBlock(block.id, { x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      resizeStartRef.current = null;
      resizeHandleRef.current = null;
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
  }, [editorMode, isSelected, block.id, moveBlock, resizeBlock, getBlock, setEditorMode, blocks]);

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

      {/* Resize handles - only show when selected */}
      {isSelected && (
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
