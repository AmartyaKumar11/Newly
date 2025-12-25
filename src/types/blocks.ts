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

/**
 * Text Effect Configuration
 * Single-effect system: only one effect active at a time
 * Preset-based, non-destructive, schema-driven
 */
export interface TextEffect {
  type:
    | "none"
    | "shadow"
    | "lift"
    | "hollow"
    | "outline"
    | "echo"
    | "glitch"
    | "neon"
    | "background";
  
  config?: {
    // Effect-specific, optional configuration
    color?: string;
    intensity?: number; // 0-100, default varies by effect
    offsetX?: number; // px, default 0
    offsetY?: number; // px, default 0
    blur?: number; // px, default varies by effect
  };
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
  fontStyle?: "normal" | "italic";
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: "none" | "underline" | "line-through";
  lineHeight?: number; // Relative multiplier (e.g. 1.2-2.5), default 1.4
  letterSpacing?: number; // Character spacing in px (range -1 to 10), default 0
  verticalAlign?: "top" | "center" | "bottom"; // Vertical alignment inside box, default "top"
  autoHeight?: boolean; // Auto-height mode (true by default, false when manually resized)
  textEffect?: TextEffect; // Single-effect system (preset-based, non-destructive)
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

export interface TextAnimations {
  // Future animation structure (scaffolding only, no runtime behavior yet)
  // This field exists for forward compatibility but is not currently used
  // Example future structure:
  // type?: "fadeIn" | "slideIn" | "bounce" | "none";
  // duration?: number; // ms
  // delay?: number; // ms
  // easing?: string;
  [key: string]: unknown; // Flexible structure for future implementation
}

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
  role?: "heading" | "subheading" | "body" | "caption"; // Semantic role (styling hint only, not enforced)
  animations?: TextAnimations; // Animation scaffolding (empty structure, no rendering changes)
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt?: string;
}

export interface ShapeBlock extends BaseBlock {
  type: "shape";
  shapeType: "rectangle";
  /**
   * Optional identifier of an SVG-based shape from the shapes registry.
   * When present, the shape renderer can load the corresponding SVG
   * from `/public/shapes` without changing layout geometry.
   */
  shapeId?: string;
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
