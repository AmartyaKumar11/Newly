"use client";

import { useRef, useEffect } from "react";
import type { Block } from "@/types/blocks";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { BlockRenderer } from "./BlockRenderer";

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
  } = useEditorStateStore();

  const isSelected = block.id === selectedBlockId;
  const isHovered = block.id === hoveredBlockId;
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);
  const resizeHandleRef = useRef<"se" | "sw" | "ne" | "nw" | null>(null);

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
  const handleResizeMouseDown = (e: React.MouseEvent, handle: "se" | "sw" | "ne" | "nw") => {
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
        const newX = e.clientX - canvasRect.left - dragStartRef.current.x;
        const newY = e.clientY - canvasRect.top - dragStartRef.current.y;

        // Constrain to canvas bounds
        const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - currentBlock.size.width));
        const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - currentBlock.size.height));

        moveBlock(block.id, { x: constrainedX, y: constrainedY });
      }

      if (editorMode === "resizing" && resizeStartRef.current && resizeHandleRef.current && isSelected) {
        const currentBlock = getBlock(block.id);
        if (!currentBlock) return;

        const canvasRect = blockRef.current?.parentElement?.getBoundingClientRect();
        if (!canvasRect) return;

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
        }

        // Constrain position
        newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - newWidth));
        newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - newHeight));

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
  }, [editorMode, isSelected, block.id, moveBlock, resizeBlock, getBlock, setEditorMode]);

  return (
    <div
      ref={blockRef}
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
