"use client";

import type { ShapeBlock } from "@/types/blocks";
import { shapesRegistry } from "@/lib/shapes/shapesRegistry";

interface ShapeBlockComponentProps {
  block: ShapeBlock;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ShapeBlockComponent({
  block,
  isSelected,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: ShapeBlockComponentProps) {
  const { styles } = block;

  // Optional SVG-based shape lookup. If `shapeId` is not set or not found,
  // fall back to the existing rectangle rendering to preserve behavior.
  const shapeEntry = block.shapeId
    ? shapesRegistry.find((entry) => entry.id === block.shapeId)
    : undefined;

  const fillColor = styles.backgroundColor || "#e5e7eb";
  const strokeColor = styles.borderColor || "#d1d5db";
  const borderWidth = styles.borderWidth ?? 1;
  const borderRadius = styles.borderRadius ?? 0;
  const opacity = styles.opacity !== undefined ? styles.opacity : 1;

  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    cursor: "pointer",
    outline: isSelected ? "2px solid #3b82f6" : "none",
    outlineOffset: "2px",
    position: "relative",
  };

  const rectStyle: React.CSSProperties = shapeEntry
    ? {
        backgroundColor: "transparent",
        borderStyle: "none",
      }
    : {
        backgroundColor: fillColor,
        borderColor: strokeColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderRadius: `${borderRadius}px`,
        opacity,
      };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ ...baseStyle, ...rectStyle }}
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
            opacity,
          }}
        />
      )}
    </div>
  );
}
