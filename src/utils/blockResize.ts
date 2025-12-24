/**
 * Block Resize Utilities
 * 
 * Block-type-specific resize logic for professional design tool behavior.
 * 
 * Rules:
 * - Text blocks: Free resize (no aspect ratio, no font scaling)
 * - Image blocks: Aspect ratio locked on corners, free on edges (optional modifier for free)
 * - Shape blocks: Free resize (no aspect ratio lock)
 * - All blocks: Minimum size constraints, canvas bounds
 */

import type { Block, ImageBlock, TextBlock, ShapeBlock } from "@/types/blocks";
import { isImageBlock, isTextBlock, isShapeBlock } from "@/types/blocks";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/components/editor/EditorCanvasWrapper";

const MIN_BLOCK_SIZE = 50; // Minimum width and height for any block

export type ResizeHandle =
  | "nw" // Northwest (top-left)
  | "ne" // Northeast (top-right)
  | "sw" // Southwest (bottom-left)
  | "se" // Southeast (bottom-right)
  | "n" // North (top)
  | "s" // South (bottom)
  | "e" // East (right)
  | "w"; // West (left)

interface ResizeParams {
  block: Block;
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
  allowFreeResize?: boolean; // Modifier key pressed (for images)
}

interface ResizeResult {
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Calculate aspect ratio for an image block.
 * 
 * Uses the current block size as the reference aspect ratio.
 * If block has no size history, falls back to 1:1.
 */
function getImageAspectRatio(block: ImageBlock): number {
  if (block.size.height > 0) {
    return block.size.width / block.size.height;
  }
  return 1; // Fallback to square
}

/**
 * Resize an image block with aspect ratio preservation.
 * 
 * Corner handles: Preserve aspect ratio
 * Edge handles: Free resize (unless modifier key allows free on corners)
 */
function resizeImageBlock(params: ResizeParams): ResizeResult {
  const { block, handle, deltaX, deltaY, startWidth, startHeight, startX, startY, allowFreeResize } = params;
  const imageBlock = block as ImageBlock;
  const aspectRatio = getImageAspectRatio(imageBlock);

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newX = startX;
  let newY = startY;

  // Determine if we should preserve aspect ratio
  const isCornerHandle = handle === "nw" || handle === "ne" || handle === "sw" || handle === "se";
  const preserveAspectRatio = isCornerHandle && !allowFreeResize;

  if (preserveAspectRatio) {
    // Corner handles: preserve aspect ratio
    switch (handle) {
      case "se": // Bottom-right
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
        // Constrain to canvas
        if (newWidth > CANVAS_WIDTH - startX) {
          newWidth = CANVAS_WIDTH - startX;
          newHeight = newWidth / aspectRatio;
        }
        if (newHeight > CANVAS_HEIGHT - startY) {
          newHeight = CANVAS_HEIGHT - startY;
          newWidth = newHeight * aspectRatio;
        }
        break;
      case "sw": // Bottom-left
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
        newX = startX + (startWidth - newWidth);
        // Constrain to canvas
        if (newX < 0) {
          newX = 0;
          newWidth = startX + startWidth;
          newHeight = newWidth / aspectRatio;
        }
        if (newHeight > CANVAS_HEIGHT - startY) {
          newHeight = CANVAS_HEIGHT - startY;
          newWidth = newHeight * aspectRatio;
          newX = startX + (startWidth - newWidth);
        }
        break;
      case "ne": // Top-right
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
        newY = startY + (startHeight - newHeight);
        // Constrain to canvas
        if (newWidth > CANVAS_WIDTH - startX) {
          newWidth = CANVAS_WIDTH - startX;
          newHeight = newWidth / aspectRatio;
          newY = startY + (startHeight - newHeight);
        }
        if (newY < 0) {
          newY = 0;
          newHeight = startY + startHeight;
          newWidth = newHeight * aspectRatio;
        }
        break;
      case "nw": // Top-left
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
        newX = startX + (startWidth - newWidth);
        newY = startY + (startHeight - newHeight);
        // Constrain to canvas
        if (newX < 0) {
          newX = 0;
          newWidth = startX + startWidth;
          newHeight = newWidth / aspectRatio;
          newY = startY + (startHeight - newHeight);
        }
        if (newY < 0) {
          newY = 0;
          newHeight = startY + startHeight;
          newWidth = newHeight * aspectRatio;
          newX = startX + (startWidth - newWidth);
        }
        break;
    }
  } else {
    // Edge handles or free resize: allow independent width/height
    switch (handle) {
      case "e": // Right
        newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth + deltaX, CANVAS_WIDTH - startX));
        break;
      case "w": // Left
        newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth - deltaX, startX + startWidth));
        newX = startX + (startWidth - newWidth);
        break;
      case "s": // Bottom
        newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight + deltaY, CANVAS_HEIGHT - startY));
        break;
      case "n": // Top
        newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight - deltaY, startY + startHeight));
        newY = startY + (startHeight - newHeight);
        break;
      case "se": // Bottom-right (free resize mode)
        newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth + deltaX, CANVAS_WIDTH - startX));
        newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight + deltaY, CANVAS_HEIGHT - startY));
        break;
      case "sw": // Bottom-left (free resize mode)
        newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth - deltaX, startX + startWidth));
        newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight + deltaY, CANVAS_HEIGHT - startY));
        newX = startX + (startWidth - newWidth);
        break;
      case "ne": // Top-right (free resize mode)
        newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth + deltaX, CANVAS_WIDTH - startX));
        newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight - deltaY, startY + startHeight));
        newY = startY + (startHeight - newHeight);
        break;
      case "nw": // Top-left (free resize mode)
        newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth - deltaX, startX + startWidth));
        newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight - deltaY, startY + startHeight));
        newX = startX + (startWidth - newWidth);
        newY = startY + (startHeight - newHeight);
        break;
    }
  }

  // Final constraints
  newWidth = Math.max(MIN_BLOCK_SIZE, newWidth);
  newHeight = Math.max(MIN_BLOCK_SIZE, newHeight);
  newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - newWidth));
  newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - newHeight));

  return { width: newWidth, height: newHeight, x: newX, y: newY };
}

/**
 * Resize a text block (free resize, no aspect ratio).
 * 
 * Text blocks can be resized freely in both directions.
 * Font size is NEVER modified - only container size changes.
 */
function resizeTextBlock(params: ResizeParams): ResizeResult {
  const { handle, deltaX, deltaY, startWidth, startHeight, startX, startY } = params;

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newX = startX;
  let newY = startY;

  switch (handle) {
    case "se": // Bottom-right
      newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth + deltaX, CANVAS_WIDTH - startX));
      newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight + deltaY, CANVAS_HEIGHT - startY));
      break;
    case "sw": // Bottom-left
      newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth - deltaX, startX + startWidth));
      newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight + deltaY, CANVAS_HEIGHT - startY));
      newX = startX + (startWidth - newWidth);
      break;
    case "ne": // Top-right
      newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth + deltaX, CANVAS_WIDTH - startX));
      newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight - deltaY, startY + startHeight));
      newY = startY + (startHeight - newHeight);
      break;
    case "nw": // Top-left
      newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth - deltaX, startX + startWidth));
      newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight - deltaY, startY + startHeight));
      newX = startX + (startWidth - newWidth);
      newY = startY + (startHeight - newHeight);
      break;
    case "e": // Right
      newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth + deltaX, CANVAS_WIDTH - startX));
      break;
    case "w": // Left
      newWidth = Math.max(MIN_BLOCK_SIZE, Math.min(startWidth - deltaX, startX + startWidth));
      newX = startX + (startWidth - newWidth);
      break;
    case "s": // Bottom
      newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight + deltaY, CANVAS_HEIGHT - startY));
      break;
    case "n": // Top
      newHeight = Math.max(MIN_BLOCK_SIZE, Math.min(startHeight - deltaY, startY + startHeight));
      newY = startY + (startHeight - newHeight);
      break;
  }

  // Final constraints
  newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - newWidth));
  newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - newHeight));

  return { width: newWidth, height: newHeight, x: newX, y: newY };
}

/**
 * Resize a shape block (free resize, no aspect ratio).
 * 
 * Shape blocks can be resized freely in both directions.
 */
function resizeShapeBlock(params: ResizeParams): ResizeResult {
  // Shape blocks use the same logic as text blocks (free resize)
  return resizeTextBlock(params);
}

/**
 * Calculate resize result for a block based on its type.
 * 
 * This is the main entry point for resize calculations.
 * It routes to block-type-specific resize logic.
 * 
 * @param params - Resize parameters
 * @returns Resize result with new dimensions and position
 */
export function calculateResize(params: ResizeParams): ResizeResult {
  const { block } = params;

  if (isImageBlock(block)) {
    return resizeImageBlock(params);
  } else if (isTextBlock(block)) {
    return resizeTextBlock(params);
  } else if (isShapeBlock(block)) {
    return resizeShapeBlock(params);
  }

  // Fallback: use text block logic (free resize)
  return resizeTextBlock(params);
}
