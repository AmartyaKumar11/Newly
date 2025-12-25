/**
 * Text Auto-Height Utilities
 * 
 * Pure utility functions for calculating text block height based on content.
 * 
 * Rules:
 * - No React dependencies
 * - No editor store dependencies
 * - Deterministic calculations
 * - Safe defaults
 */

import type { TextBlock } from "@/types/blocks";

const MIN_TEXT_HEIGHT = 50; // Minimum height for text blocks
const PADDING_VERTICAL = 0; // No padding (text fills container exactly)

/**
 * Calculate the natural height of text content.
 * 
 * This is a pure calculation based on text metrics.
 * Actual DOM measurement happens in the component.
 * 
 * @param block - Text block with content and styles
 * @param measuredHeight - Actual measured height from DOM (if available)
 * @returns Calculated height in pixels
 */
export function calculateTextHeight(
  block: TextBlock,
  measuredHeight?: number
): number {
  // If we have a measured height from DOM, use it (most accurate)
  if (measuredHeight && measuredHeight > 0) {
    return Math.max(MIN_TEXT_HEIGHT, Math.ceil(measuredHeight));
  }

  // Fallback calculation based on content and styles
  const content = block.content || "Text";
  const fontSize = block.styles.fontSize || 16;
  const lineHeight = block.styles.lineHeight || 1.4;
  const width = block.size.width;

  // Estimate lines: approximate characters per line based on font size
  // Rough estimate: ~0.6 * fontSize characters per line (varies by font)
  const charsPerLine = Math.max(1, Math.floor((width / fontSize) * 0.6));
  const lines = Math.max(1, Math.ceil(content.length / charsPerLine));

  // Calculate height: lines * lineHeight * fontSize + padding
  const estimatedHeight = lines * lineHeight * fontSize + PADDING_VERTICAL * 2;

  return Math.max(MIN_TEXT_HEIGHT, Math.ceil(estimatedHeight));
}

/**
 * Check if a text block should use auto-height.
 * 
 * Default behavior: auto-height is enabled unless explicitly disabled.
 * A block switches to fixed-height when manually resized vertically.
 * 
 * @param block - Text block to check
 * @returns true if auto-height should be enabled
 */
export function shouldUseAutoHeight(block: TextBlock): boolean {
  // Check if autoHeight is explicitly set to false
  // If undefined or true, use auto-height (default behavior)
  return block.styles.autoHeight !== false;
}
