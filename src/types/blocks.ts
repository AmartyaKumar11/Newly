// Block type definitions for Phase 2

export type BlockType = "text" | "image" | "shape" | "container";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BlockStyles {
  // Common styles
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  // Text specific
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  // Image specific
  objectFit?: "cover" | "contain" | "fill" | "none";
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  position: Position;
  size: Size;
  styles: BlockStyles;
  zIndex: number;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt?: string;
}

export interface ShapeBlock extends BaseBlock {
  type: "shape";
  shapeType: "rectangle";
}

export interface ContainerBlock extends BaseBlock {
  type: "container";
  children: string[]; // Array of child block IDs
}

export type Block = TextBlock | ImageBlock | ShapeBlock | ContainerBlock;

// Helper type guards
export function isTextBlock(block: Block): block is TextBlock {
  return block.type === "text";
}

export function isImageBlock(block: Block): block is ImageBlock {
  return block.type === "image";
}

export function isShapeBlock(block: Block): block is ShapeBlock {
  return block.type === "shape";
}

export function isContainerBlock(block: Block): block is ContainerBlock {
  return block.type === "container";
}
