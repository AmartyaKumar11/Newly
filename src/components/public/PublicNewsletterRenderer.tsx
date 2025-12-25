/**
 * PublicNewsletterRenderer
 * 
 * Phase 3.5: Publishing System
 * 
 * Renders a published newsletter from snapshot data.
 * 
 * This is a pure, read-only renderer with:
 * - No editor state
 * - No interaction handlers
 * - No mutations
 * - Deterministic rendering
 * 
 * Used exclusively for /p/[slug] public routes.
 */

"use client";

import type { Block } from "@/types/blocks";
import { isContainerBlock } from "@/types/blocks";
import { deserializeBlocks } from "@/utils/blockSerialization";
import { shapesRegistry } from "@/lib/shapes/shapesRegistry";

interface PublicNewsletterRendererProps {
  blocks: Block[];
  title?: string;
  description?: string;
}

// Canvas dimensions (must match editor)
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

/**
 * Render a single block (handles containers recursively).
 */
function renderBlock(block: Block, allBlocks: Block[]): React.ReactNode {
  const { position, size, styles, zIndex } = block;

  // Common container styles
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex,
  };

  // Handle container blocks (recursive rendering)
  if (isContainerBlock(block)) {
    const childBlocks = block.children
      ?.map((childId) => allBlocks.find((b) => b.id === childId))
      .filter((b): b is Block => b !== undefined)
      .sort((a, b) => a.zIndex - b.zIndex) || [];

    return (
      <div
        key={block.id}
        style={{
          ...containerStyle,
          backgroundColor: styles.backgroundColor || "transparent",
          borderColor: styles.borderColor || "transparent",
          borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
          borderStyle: "solid",
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
          opacity: styles.opacity !== undefined ? styles.opacity : 1,
        }}
      >
        {childBlocks.map((child) => renderBlock(child, allBlocks))}
      </div>
    );
  }

  // Handle text blocks
  if (block.type === "text") {
    const content = block.content || "Text";
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
          ...containerStyle,
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
          ...effectStyles,
        }}
      >
        {content}
      </div>
    );
  }

  // Handle image blocks
  if (block.type === "image") {
    return (
      <div
        key={block.id}
        style={{
          ...containerStyle,
          overflow: "hidden",
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        }}
      >
        <img
          src={block.src || "https://via.placeholder.com/200x200"}
          alt={block.alt || "Image"}
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

  // Handle shape blocks
  if (block.type === "shape") {
    // Check if this is an SVG-based shape
    const shapeId = (block as any).shapeId;
    const shapeEntry = shapeId
      ? shapesRegistry.find((entry) => entry.id === shapeId)
      : undefined;

    return (
      <div
        key={block.id}
        style={{
          ...containerStyle,
          backgroundColor: shapeEntry ? "transparent" : (styles.backgroundColor || "#cccccc"),
          borderColor: shapeEntry ? "transparent" : (styles.borderColor || "transparent"),
          borderWidth: shapeEntry ? "0" : (styles.borderWidth ? `${styles.borderWidth}px` : "0"),
          borderStyle: "solid",
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
          opacity: styles.opacity !== undefined ? styles.opacity : 1,
        }}
      >
        {shapeEntry && (
          <img
            src={shapeEntry.file}
            alt={shapeEntry.id}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
              opacity: styles.opacity !== undefined ? styles.opacity : 1,
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

/**
 * Main public newsletter renderer.
 */
export function PublicNewsletterRenderer({
  blocks: serializedBlocks,
  title,
  description,
}: PublicNewsletterRendererProps) {
  // Deserialize blocks (convert from database format to Block[])
  const blocks = deserializeBlocks(serializedBlocks as unknown[]);

  // Sort blocks by zIndex for correct layering
  const sortedBlocks = [...blocks].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-4xl">
        {/* Header */}
        {title && (
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
            {description && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{description}</p>
            )}
          </header>
        )}

        {/* Canvas */}
        <div className="flex justify-center">
          <div
            className="relative rounded-lg border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              minHeight: `${CANVAS_HEIGHT}px`,
            }}
          >
            {sortedBlocks.map((block) => renderBlock(block, blocks))}
          </div>
        </div>
      </div>
    </div>
  );
}
