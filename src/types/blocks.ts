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

/**
 * Section metadata for container blocks
 * Used for identity preservation, collaboration, and analytics
 */
export interface SectionMetadata {
  /**
   * Stable section identifier that persists across AI replacements
   * Generated once when container is created, never changes
   */
  sectionId: string;
  
  /**
   * Semantic type of section (for organization and filtering)
   */
  sectionType?: "header" | "intro" | "body" | "footer" | "sidebar" | "other";
  
  /**
   * How this section was created
   */
  createdBy: "manual" | "ai";
  
  /**
   * Last AI action performed on this section
   */
  lastAIAction?: "rewrite" | "shorten" | "expand" | "change_tone" | "improve_clarity" | "make_persuasive";
  
  /**
   * Timestamp of last modification (ISO string)
   */
  lastModifiedAt?: string;
}

export interface ContainerBlock extends BaseBlock {
  type: "container";
  children: string[]; // Array of child block IDs
  
  /**
   * Section metadata for identity preservation and tracking
   * Present for container blocks that represent logical sections
   */
  sectionMetadata?: SectionMetadata;
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
