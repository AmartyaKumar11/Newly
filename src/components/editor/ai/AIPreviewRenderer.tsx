"use client";

/**
 * AI Preview Renderer - Read-only Preview Component
 * 
 * CRITICAL: This is a sandbox preview - NO editor state mutation.
 * - Read-only rendering
 * - Uses same renderer as editor
 * - No selection, drag, resize, or edit
 * - No autosave
 * - No undo interaction
 * - No editor store mutation
 */

import type { Block } from "@/types/blocks";
import { isTextBlock, isImageBlock, isShapeBlock } from "@/types/blocks";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/types/aiOutputSchema";
import { TextBlockComponent } from "../blocks/TextBlock";
import { ImageBlockComponent } from "../blocks/ImageBlock";
import { ShapeBlockComponent } from "../blocks/ShapeBlock";

interface AIPreviewRendererProps {
  blocks: Block[];
}

/**
 * Read-only text block component for preview
 */
function PreviewTextBlock({ block }: { block: Block }) {
  if (!isTextBlock(block)) return null;
  
  const { position, size, styles, content } = block;
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: block.zIndex,
        pointerEvents: "none", // Read-only, no interaction
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "8px",
          fontSize: styles.fontSize || 16,
          fontWeight: styles.fontWeight || "normal",
          fontFamily: styles.fontFamily || "system-ui",
          color: styles.color || "#000000",
          textAlign: styles.textAlign || "left",
          backgroundColor: styles.backgroundColor || "transparent",
          borderColor: styles.borderColor || "transparent",
          borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
          borderStyle: "solid",
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
          opacity: styles.opacity !== undefined ? styles.opacity : 1,
          overflow: "hidden",
          wordWrap: "break-word",
        }}
      >
        {content || "Text"}
      </div>
    </div>
  );
}

/**
 * Read-only image block component for preview
 */
function PreviewImageBlock({ block }: { block: Block }) {
  if (!isImageBlock(block)) return null;
  
  const { position, size, styles, src, alt } = block;
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: block.zIndex,
        pointerEvents: "none", // Read-only, no interaction
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: styles.backgroundColor || "transparent",
          borderColor: styles.borderColor || "transparent",
          borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
          borderStyle: "solid",
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
          opacity: styles.opacity !== undefined ? styles.opacity : 1,
          overflow: "hidden",
        }}
      >
        <img
          src={src}
          alt={alt || "Image"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: styles.objectFit || "cover",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Read-only shape block component for preview
 */
function PreviewShapeBlock({ block }: { block: Block }) {
  if (!isShapeBlock(block)) return null;
  
  const { position, size, styles } = block;
  
  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: block.zIndex,
        pointerEvents: "none", // Read-only, no interaction
        backgroundColor: styles.backgroundColor || "#e5e7eb",
        borderColor: styles.borderColor || "#d1d5db",
        borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "1px",
        borderStyle: "solid",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        opacity: styles.opacity !== undefined ? styles.opacity : 1,
      }}
    />
  );
}

/**
 * Main preview renderer component
 */
export function AIPreviewRenderer({ blocks }: AIPreviewRendererProps) {
  // Sort blocks by zIndex for correct rendering order
  const sortedBlocks = [...blocks].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative rounded-lg border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          minHeight: `${CANVAS_HEIGHT}px`,
        }}
      >
        {sortedBlocks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                No blocks to preview
              </p>
            </div>
          </div>
        ) : (
          sortedBlocks.map((block) => {
            if (isTextBlock(block)) {
              return <PreviewTextBlock key={block.id} block={block} />;
            }
            if (isImageBlock(block)) {
              return <PreviewImageBlock key={block.id} block={block} />;
            }
            if (isShapeBlock(block)) {
              return <PreviewShapeBlock key={block.id} block={block} />;
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}
