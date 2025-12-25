/**
 * PublicBlockRenderer
 * 
 * Phase 3.5: Publishing System
 * 
 * Read-only block renderer for published newsletters.
 * 
 * This is NOT a disabled editor - it's a pure renderer with:
 * - No selection state
 * - No interaction handlers
 * - No editor stores or hooks
 * - No side effects
 * - Deterministic rendering only
 * 
 * Used exclusively for /p/[slug] public routes.
 */

import type { Block } from "@/types/blocks";
import { isTextBlock, isImageBlock, isShapeBlock, isContainerBlock } from "@/types/blocks";

interface PublicBlockRendererProps {
  block: Block;
}

// Canvas dimensions (must match editor)
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

/**
 * Render text block (read-only).
 */
function renderTextBlock(block: Block) {
  if (!isTextBlock(block)) return null;

  const { position, size, styles, content } = block;

  // Calculate text effect styles (if any)
  const effectStyles: React.CSSProperties = {};
  if (styles.textEffect && styles.textEffect.type !== "none") {
    const effect = styles.textEffect;
    switch (effect.type) {
      case "shadow":
        effectStyles.textShadow = `2px 2px 4px rgba(0,0,0,0.3)`;
        break;
      case "lift":
        effectStyles.textShadow = `0 4px 8px rgba(0,0,0,0.2)`;
        break;
      case "outline":
        effectStyles.webkitTextStroke = `2px ${effect.config?.color || "#000"}`;
        effectStyles.webkitTextFillColor = styles.color || "transparent";
        break;
      default:
        break;
    }
  }

  return (
    <div
      key={block.id}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        minHeight: `${size.height}px`,
        fontSize: `${styles.fontSize || 16}px`,
        fontWeight: styles.fontWeight || "normal",
        fontFamily: styles.fontFamily || "inherit",
        fontStyle: styles.fontStyle || "normal",
        color: styles.color || "#000000",
        textAlign: styles.textAlign || "left",
        textDecoration: styles.textDecoration || "none",
        lineHeight: styles.lineHeight ? `${styles.lineHeight}` : "1.4",
        letterSpacing: styles.letterSpacing !== undefined ? `${styles.letterSpacing}px` : "0px",
        backgroundColor: styles.backgroundColor || "transparent",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        padding: "8px",
        overflow: "visible",
        zIndex: block.zIndex,
        ...effectStyles,
      }}
    >
      {content || "Text"}
    </div>
  );
}

/**
 * Render image block (read-only).
 */
function renderImageBlock(block: Block) {
  if (!isImageBlock(block)) return null;

  const { position, size, styles, src, alt } = block;

  return (
    <div
      key={block.id}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        overflow: "hidden",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        zIndex: block.zIndex,
      }}
    >
      <img
        src={src || "https://via.placeholder.com/200x200"}
        alt={alt || "Image"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: styles.objectFit || "cover",
          opacity: styles.opacity !== undefined ? styles.opacity : 1,
        }}
      />
    </div>
  );
}

/**
 * Render shape block (read-only).
 */
function renderShapeBlock(block: Block) {
  if (!isShapeBlock(block)) return null;

  const { position, size, styles } = block;

  return (
    <div
      key={block.id}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: styles.backgroundColor || "#cccccc",
        borderColor: styles.borderColor || "transparent",
        borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
        borderStyle: "solid",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        opacity: styles.opacity !== undefined ? styles.opacity : 1,
        zIndex: block.zIndex,
      }}
    />
  );
}

/**
 * Render container block (read-only).
 */
function renderContainerBlock(block: Block, allBlocks: Block[]) {
  if (!isContainerBlock(block)) return null;

  const { position, size, styles, children } = block;

  // Render child blocks recursively
  const childBlocks = children
    ?.map((childId) => allBlocks.find((b) => b.id === childId))
    .filter((b): b is Block => b !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex) || [];

  return (
    <div
      key={block.id}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: styles.backgroundColor || "transparent",
        borderColor: styles.borderColor || "transparent",
        borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
        borderStyle: "solid",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        opacity: styles.opacity !== undefined ? styles.opacity : 1,
        zIndex: block.zIndex,
      }}
    >
      {childBlocks.map((child) => (
        <PublicBlockRenderer key={child.id} block={child} />
      ))}
    </div>
  );
}

/**
 * Main public block renderer component.
 */
export function PublicBlockRenderer({ block }: PublicBlockRendererProps) {
  // This component needs access to all blocks for container rendering
  // For now, containers will render children from block.children array
  // In a real implementation, we'd pass allBlocks as context or prop
  
  if (isTextBlock(block)) {
    return renderTextBlock(block);
  }

  if (isImageBlock(block)) {
    return renderImageBlock(block);
  }

  if (isShapeBlock(block)) {
    return renderShapeBlock(block);
  }

  if (isContainerBlock(block)) {
    // For containers, we need all blocks - will handle this in parent component
    return null; // Containers handled separately in parent
  }

  return null;
}
