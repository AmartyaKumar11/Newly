"use client";

import type { ShapeBlock } from "@/types/blocks";

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
  const { position, size, styles } = block;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: styles.backgroundColor || "#e5e7eb",
        borderColor: styles.borderColor || "#d1d5db",
        borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "1px",
        borderStyle: "solid",
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
        opacity: styles.opacity !== undefined ? styles.opacity : 1,
        cursor: "pointer",
        outline: isSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
      }}
    />
  );
}
