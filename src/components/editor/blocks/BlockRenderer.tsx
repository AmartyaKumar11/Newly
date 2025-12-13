"use client";

import type { Block } from "@/types/blocks";
import { isTextBlock, isImageBlock, isShapeBlock } from "@/types/blocks";
import { TextBlockComponent } from "./TextBlock";
import { ImageBlockComponent } from "./ImageBlock";
import { ShapeBlockComponent } from "./ShapeBlock";

interface BlockRendererProps {
  block: Block;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function BlockRenderer({
  block,
  isSelected,
  isHovered,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: BlockRendererProps) {
  if (isTextBlock(block)) {
    return (
      <TextBlockComponent
        block={block}
        isSelected={isSelected}
        isHovered={isHovered}
        onSelect={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  if (isImageBlock(block)) {
    return (
      <ImageBlockComponent
        block={block}
        isSelected={isSelected}
        isHovered={isHovered}
        onSelect={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  if (isShapeBlock(block)) {
    return (
      <ShapeBlockComponent
        block={block}
        isSelected={isSelected}
        isHovered={isHovered}
        onSelect={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  return null;
}
