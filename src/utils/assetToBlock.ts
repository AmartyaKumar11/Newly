/**
 * Asset → Editor Block Translation Utility
 * 
 * Pure utility functions for converting Asset records to ImageBlock instances.
 * 
 * Rules:
 * - No React dependencies
 * - No editor store dependencies
 * - No side effects
 * - Deterministic output
 * - Safe defaults for missing dimensions
 */

import type { ImageBlock } from "@/types/blocks";
import type { Asset } from "@/hooks/useAssets";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/components/editor/EditorCanvasWrapper";

// Safe fallback dimensions when asset dimensions are unknown
const FALLBACK_WIDTH = 200;
const FALLBACK_HEIGHT = 200;
const FALLBACK_ASPECT_RATIO = FALLBACK_WIDTH / FALLBACK_HEIGHT; // 1:1

/**
 * Calculate intelligent default size for an asset.
 * 
 * Rules:
 * - Width defaults to 60% of canvas width
 * - Height computed from aspect ratio
 * - Clamp height to canvas height
 * - Use safe fallback if dimensions unknown
 * 
 * @param asset - Asset record with optional width/height
 * @returns Size object with width and height
 */
export function calculateAssetSize(asset: Asset): { width: number; height: number } {
  const defaultWidth = CANVAS_WIDTH * 0.6; // 60% of canvas width
  
  // Use actual dimensions if available
  if (asset.width && asset.height && asset.width > 0 && asset.height > 0) {
    const aspectRatio = asset.width / asset.height;
    let height = defaultWidth / aspectRatio;
    
    // Clamp height to canvas height
    if (height > CANVAS_HEIGHT) {
      height = CANVAS_HEIGHT;
      // Recalculate width to maintain aspect ratio
      const width = height * aspectRatio;
      return {
        width: Math.round(width),
        height: Math.round(height),
      };
    }
    
    return {
      width: Math.round(defaultWidth),
      height: Math.round(height),
    };
  }
  
  // Fallback: use safe defaults maintaining aspect ratio
  const height = defaultWidth / FALLBACK_ASPECT_RATIO;
  return {
    width: Math.round(defaultWidth),
    height: Math.round(Math.min(height, CANVAS_HEIGHT)),
  };
}

/**
 * Calculate center position for a block on the canvas.
 * 
 * Positions block so its center aligns with canvas center.
 * Never places blocks partially off-canvas.
 * 
 * @param size - Block size (width and height)
 * @returns Position object with x and y coordinates
 */
export function calculateCenterPosition(size: { width: number; height: number }): { x: number; y: number } {
  const x = Math.max(0, (CANVAS_WIDTH - size.width) / 2);
  const y = Math.max(0, (CANVAS_HEIGHT - size.height) / 2);
  
  // Ensure block doesn't exceed canvas bounds
  const constrainedX = Math.min(x, CANVAS_WIDTH - size.width);
  const constrainedY = Math.min(y, CANVAS_HEIGHT - size.height);
  
  return {
    x: Math.max(0, constrainedX),
    y: Math.max(0, constrainedY),
  };
}

/**
 * Calculate position from drop coordinates.
 * 
 * Converts mouse/client coordinates to canvas-relative position.
 * Ensures block stays within canvas bounds.
 * 
 * @param dropX - Mouse X coordinate relative to canvas
 * @param dropY - Mouse Y coordinate relative to canvas
 * @param size - Block size (width and height)
 * @returns Position object with x and y coordinates
 */
export function calculateDropPosition(
  dropX: number,
  dropY: number,
  size: { width: number; height: number }
): { x: number; y: number } {
  // Center the block on the drop point
  const x = dropX - size.width / 2;
  const y = dropY - size.height / 2;
  
  // Constrain to canvas bounds
  const constrainedX = Math.max(0, Math.min(x, CANVAS_WIDTH - size.width));
  const constrainedY = Math.max(0, Math.min(y, CANVAS_HEIGHT - size.height));
  
  return {
    x: constrainedX,
    y: constrainedY,
  };
}

/**
 * Convert an Asset to an ImageBlock.
 * 
 * Pure function that creates a valid ImageBlock from an Asset record.
 * Does not touch editor state or perform any side effects.
 * 
 * @param asset - Asset record to convert
 * @param position - Optional position (defaults to center)
 * @param size - Optional size (defaults to calculated size)
 * @returns ImageBlock instance ready for insertion
 */
export function assetToImageBlock(
  asset: Asset,
  position?: { x: number; y: number },
  size?: { width: number; height: number }
): ImageBlock {
  // Generate unique ID (using timestamp + random to avoid collisions)
  const id = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate size if not provided
  const finalSize = size || calculateAssetSize(asset);
  
  // Calculate position if not provided (defaults to center)
  const finalPosition = position || calculateCenterPosition(finalSize);
  
  // Validate URL (basic safety check)
  if (!asset.url || typeof asset.url !== "string") {
    throw new Error("Invalid asset URL");
  }
  
  return {
    id,
    type: "image",
    src: asset.url,
    alt: "Image",
    position: finalPosition,
    size: finalSize,
    styles: {
      objectFit: "cover", // Crop on resize, don't scale
      borderRadius: 0,
    },
    zIndex: 1, // Will be updated by caller using getNextZIndex
  };
}
