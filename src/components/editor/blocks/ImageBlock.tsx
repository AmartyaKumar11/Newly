"use client";

import type { ImageBlock } from "@/types/blocks";

interface ImageBlockComponentProps {
  block: ImageBlock;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ImageBlockComponent({
  block,
  isSelected,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: ImageBlockComponentProps) {
  const { position, size, styles, src, alt } = block;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: "100%",
        height: "100%",
        cursor: "pointer",
        outline: isSelected ? "2px solid #3b82f6" : "none",
        outlineOffset: "2px",
      }}
    >
      <img
        src={src}
        alt={alt || "Image"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: styles.objectFit || "cover",
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : "0",
          opacity: styles.opacity !== undefined ? styles.opacity : 1,
          borderColor: styles.borderColor || "transparent",
          borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : "0",
          borderStyle: "solid",
        }}
        draggable={false}
      />
    </div>
  );
}
