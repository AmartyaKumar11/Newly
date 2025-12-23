/**
 * AI → Editor Translation Layer
 * 
 * Pure, deterministic translation layer that converts validated AI output
 * into editor-ready blocks. This is the ONLY gateway through which AI
 * output may affect editor state.
 * 
 * Core Principles:
 * - No UI logic
 * - No Gemini or LLM calls
 * - No editor state mutation
 * - Deterministic behavior
 * - Fully undoable
 * - Schema-first validation
 * 
 * This layer treats translation like a compiler, not a feature.
 */

import type {
  AIOutputSchema,
  AIBlockDefinition,
  AITextContent,
  AIImageContent,
  AIShapeContent,
  AIContainerContent,
  AIBlockStyles,
} from "@/types/aiOutputSchema";
import type {
  Block,
  TextBlock,
  ImageBlock,
  ShapeBlock,
  ContainerBlock,
  Position,
  Size,
  BlockStyles,
} from "@/types/blocks";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_BLOCK_SIZE,
  MAX_BLOCK_SIZE,
} from "@/types/aiOutputSchema";
import { shapesRegistry } from "@/lib/shapes/shapesRegistry";

// ============================================================================
// Types
// ============================================================================

export interface TranslationError {
  type: "hard" | "soft";
  message: string;
  field?: string;
}

export interface TranslationResult {
  success: boolean;
  blocks?: Block[];
  errors?: TranslationError[];
  warnings?: TranslationError[];
}

// ============================================================================
// Constants
// ============================================================================

// Font families allowed in editor UI (more permissive than AI schema)
// AI output is still restricted to the original 7 fonts for consistency
const ALLOWED_FONT_FAMILIES = [
  "system-ui",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
] as const;

const MAX_TEXT_LENGTH = 10000;
const MAX_ALT_TEXT_LENGTH = 200;
const MAX_BLOCKS = 50;
const MIN_BLOCKS = 1;

// Default sizes by block type
const DEFAULT_SIZES: Record<string, Size> = {
  text: { width: 200, height: 100 },
  image: { width: 200, height: 200 },
  shape: { width: 200, height: 100 },
  container: { width: 200, height: 200 },
};

// Default starting position for auto-positioning
const AUTO_POSITION_START: Position = { x: 50, y: 50 };
const AUTO_POSITION_SPACING = 20; // Vertical spacing between auto-positioned blocks

// ============================================================================
// ID Generation
// ============================================================================

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Validation: Hard Failures
// ============================================================================

/**
 * Validates AI output against strict schema rules.
 * Returns errors for hard failures that must reject the entire output.
 */
export function validateAIOutputStrict(
  input: unknown
): { valid: boolean; errors: TranslationError[] } {
  const errors: TranslationError[] = [];

  // 1. Check if input is an object
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push({
      type: "hard",
      message: "Input must be a valid object",
    });
    return { valid: false, errors };
  }

  const schema = input as Partial<AIOutputSchema>;

  // 2. Validate schemaVersion
  if (schema.schemaVersion !== "1.0.0") {
    errors.push({
      type: "hard",
      message: `Invalid schema version. Expected "1.0.0", got "${schema.schemaVersion}"`,
      field: "schemaVersion",
    });
    return { valid: false, errors };
  }

  // 3. Validate blocks array exists and is array
  if (!schema.blocks || !Array.isArray(schema.blocks)) {
    errors.push({
      type: "hard",
      message: "blocks array is required and must be an array",
      field: "blocks",
    });
    return { valid: false, errors };
  }

  // 4. Validate blocks array length
  if (schema.blocks.length < MIN_BLOCKS) {
    errors.push({
      type: "hard",
      message: `blocks array must contain at least ${MIN_BLOCKS} block`,
      field: "blocks",
    });
    return { valid: false, errors };
  }

  if (schema.blocks.length > MAX_BLOCKS) {
    errors.push({
      type: "hard",
      message: `blocks array exceeds maximum of ${MAX_BLOCKS} blocks`,
      field: "blocks",
    });
    return { valid: false, errors };
  }

  // 5. Validate each block
  const tempIdSet = new Set<string>();
  const tempIdToIndex = new Map<string, number>();

  for (let i = 0; i < schema.blocks.length; i++) {
    const block = schema.blocks[i];
    const blockErrors = validateBlockStrict(block, i, tempIdSet, tempIdToIndex);
    errors.push(...blockErrors);
  }

  // 6. Validate container references (after all blocks are validated)
  for (let i = 0; i < schema.blocks.length; i++) {
    const block = schema.blocks[i];
    if (block?.type === "container") {
      const containerErrors = validateContainerReferences(
        block,
        i,
        tempIdToIndex
      );
      errors.push(...containerErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateBlockStrict(
  block: unknown,
  index: number,
  tempIdSet: Set<string>,
  tempIdToIndex: Map<string, number>
): TranslationError[] {
  const errors: TranslationError[] = [];

  if (!block || typeof block !== "object" || Array.isArray(block)) {
    errors.push({
      type: "hard",
      message: `Block at index ${index} must be an object`,
      field: `blocks[${index}]`,
    });
    return errors;
  }

  const b = block as Partial<AIBlockDefinition>;

  // Validate block type
  const allowedTypes = ["text", "image", "shape", "container"];
  if (!b.type || !allowedTypes.includes(b.type)) {
    errors.push({
      type: "hard",
      message: `Invalid block type "${b.type}". Must be one of: ${allowedTypes.join(", ")}`,
      field: `blocks[${index}].type`,
    });
  }

  // Validate tempId uniqueness
  if (b.tempId) {
    if (typeof b.tempId !== "string" || b.tempId.trim() === "") {
      errors.push({
        type: "hard",
        message: `tempId must be a non-empty string`,
        field: `blocks[${index}].tempId`,
      });
    } else if (tempIdSet.has(b.tempId)) {
      errors.push({
        type: "hard",
        message: `Duplicate tempId "${b.tempId}" found`,
        field: `blocks[${index}].tempId`,
      });
    } else {
      tempIdSet.add(b.tempId);
      tempIdToIndex.set(b.tempId, index);
    }
  }

  // Validate content based on type
  if (!b.content || typeof b.content !== "object") {
    errors.push({
      type: "hard",
      message: `Block content is required`,
      field: `blocks[${index}].content`,
    });
  } else {
    const contentErrors = validateBlockContent(b.type, b.content, index);
    errors.push(...contentErrors);
  }

  // Validate position bounds (if provided)
  if (b.position) {
    if (typeof b.position.x !== "number" || typeof b.position.y !== "number") {
      errors.push({
        type: "hard",
        message: `Position must have numeric x and y values`,
        field: `blocks[${index}].position`,
      });
    } else {
      if (b.position.x < 0 || b.position.x > CANVAS_WIDTH) {
        errors.push({
          type: "hard",
          message: `Position x (${b.position.x}) is outside canvas bounds (0-${CANVAS_WIDTH})`,
          field: `blocks[${index}].position.x`,
        });
      }
      if (b.position.y < 0 || b.position.y > CANVAS_HEIGHT) {
        errors.push({
          type: "hard",
          message: `Position y (${b.position.y}) is outside canvas bounds (0-${CANVAS_HEIGHT})`,
          field: `blocks[${index}].position.y`,
        });
      }
    }
  }

  // Validate size bounds (if provided)
  if (b.size) {
    if (typeof b.size.width !== "number" || typeof b.size.height !== "number") {
      errors.push({
        type: "hard",
        message: `Size must have numeric width and height values`,
        field: `blocks[${index}].size`,
      });
    } else {
      if (b.size.width < MIN_BLOCK_SIZE || b.size.width > MAX_BLOCK_SIZE) {
        errors.push({
          type: "hard",
          message: `Size width (${b.size.width}) is outside allowed range (${MIN_BLOCK_SIZE}-${MAX_BLOCK_SIZE})`,
          field: `blocks[${index}].size.width`,
        });
      }
      if (b.size.height < MIN_BLOCK_SIZE || b.size.height > CANVAS_HEIGHT) {
        errors.push({
          type: "hard",
          message: `Size height (${b.size.height}) is outside allowed range (${MIN_BLOCK_SIZE}-${CANVAS_HEIGHT})`,
          field: `blocks[${index}].size.height`,
        });
      }
    }
  }

  // Validate block overflow (when both position and size are provided)
  if (b.position && b.size) {
    const x = b.position.x;
    const y = b.position.y;
    const width = b.size.width;
    const height = b.size.height;

    if (x + width > CANVAS_WIDTH) {
      errors.push({
        type: "hard",
        message: `Block overflows canvas: x (${x}) + width (${width}) = ${x + width} > ${CANVAS_WIDTH}`,
        field: `blocks[${index}]`,
      });
    }
    if (y + height > CANVAS_HEIGHT) {
      errors.push({
        type: "hard",
        message: `Block overflows canvas: y (${y}) + height (${height}) = ${y + height} > ${CANVAS_HEIGHT}`,
        field: `blocks[${index}]`,
      });
    }
  }

  return errors;
}

function validateBlockContent(
  type: string | undefined,
  content: unknown,
  index: number
): TranslationError[] {
  const errors: TranslationError[] = [];

  if (!type) {
    return errors; // Type validation handled elsewhere
  }

  if (type === "text") {
    const textContent = content as Partial<AITextContent>;
    if (typeof textContent.text !== "string") {
      errors.push({
        type: "hard",
        message: `Text block must have text content`,
        field: `blocks[${index}].content.text`,
      });
    } else {
      // Check for HTML tags
      if (/<[^>]+>/.test(textContent.text)) {
        errors.push({
          type: "hard",
          message: `Text content contains HTML tags`,
          field: `blocks[${index}].content.text`,
        });
      }
      // Check for scripts
      if (/<script|javascript:/i.test(textContent.text)) {
        errors.push({
          type: "hard",
          message: `Text content contains scripts or dangerous protocols`,
          field: `blocks[${index}].content.text`,
        });
      }
      // Check for markdown (basic patterns)
      if (/^#{1,6}\s|^\*\*|^\*[^*]|^```|^`[^`]/.test(textContent.text)) {
        errors.push({
          type: "hard",
          message: `Text content contains Markdown syntax`,
          field: `blocks[${index}].content.text`,
        });
      }
    }
  } else if (type === "image") {
    const imageContent = content as Partial<AIImageContent>;
    if (typeof imageContent.src !== "string") {
      errors.push({
        type: "hard",
        message: `Image block must have src URL`,
        field: `blocks[${index}].content.src`,
      });
    } else {
      // Validate URL
      try {
        const url = new URL(imageContent.src);
        // Check protocol
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push({
            type: "hard",
            message: `Image src must use HTTP or HTTPS protocol`,
            field: `blocks[${index}].content.src`,
          });
        }
        // Check for dangerous protocols
        if (/^javascript:|^data:/i.test(imageContent.src)) {
          errors.push({
            type: "hard",
            message: `Image src contains dangerous protocol`,
            field: `blocks[${index}].content.src`,
          });
        }
      } catch {
        errors.push({
          type: "hard",
          message: `Image src is not a valid URL`,
          field: `blocks[${index}].content.src`,
        });
      }
    }
  } else if (type === "shape") {
    const shapeContent = content as Partial<AIShapeContent> & Record<string, unknown>;
    if (shapeContent.shapeType !== "rectangle") {
      errors.push({
        type: "hard",
        message: `Shape type must be "rectangle"`,
        field: `blocks[${index}].content.shapeType`,
      });
    }

    // AI safety: Shapes may only reference pre-registered shapes by shapeId.
    // shapeId (when present) MUST exist in shapesRegistry.
    if ("shapeId" in shapeContent && shapeContent.shapeId !== undefined) {
      if (typeof shapeContent.shapeId !== "string" || shapeContent.shapeId.trim() === "") {
        errors.push({
          type: "hard",
          message: `shapeId must be a non-empty string when provided`,
          field: `blocks[${index}].content.shapeId`,
        });
      } else {
        const shapeId = shapeContent.shapeId.trim();
        const exists = shapesRegistry.some((entry) => entry.id === shapeId);
        if (!exists) {
          errors.push({
            type: "hard",
            message: `shapeId "${shapeId}" does not exist in shapesRegistry`,
            field: `blocks[${index}].content.shapeId`,
          });
        }
      }
    }

    // AI safety: forbid raw SVG / path payloads in shape content.
    // The only allowed field today is `shapeType` (and optional `shapeId`).
    const forbiddenShapePayloadKeys = [
      "svg",
      "svgMarkup",
      "rawSvg",
      "paths",
      "path",
      "d",
      "viewBox",
      "xmlns",
      "innerHTML",
    ];
    for (const key of forbiddenShapePayloadKeys) {
      if (key in shapeContent && shapeContent[key] !== undefined) {
        errors.push({
          type: "hard",
          message: `Shape content must not include raw SVG or path data ("${key}")`,
          field: `blocks[${index}].content.${key}`,
        });
      }
    }
  } else if (type === "container") {
    const containerContent = content as Partial<AIContainerContent>;
    if (!Array.isArray(containerContent.children)) {
      errors.push({
        type: "hard",
        message: `Container block must have children array`,
        field: `blocks[${index}].content.children`,
      });
    }
    // Container children validation happens after all blocks are processed
  }

  return errors;
}

function validateContainerReferences(
  block: Partial<AIBlockDefinition>,
  index: number,
  tempIdToIndex: Map<string, number>
): TranslationError[] {
  const errors: TranslationError[] = [];

  if (block.type !== "container") {
    return errors;
  }

  const containerContent = block.content as Partial<AIContainerContent>;
  if (!Array.isArray(containerContent.children)) {
    return errors; // Already validated in validateBlockContent
  }

  // Check for circular references (basic check - container can't reference itself)
  const blockTempId = block.tempId;
  if (blockTempId && containerContent.children.includes(blockTempId)) {
    errors.push({
      type: "hard",
      message: `Container references itself (circular reference)`,
      field: `blocks[${index}].content.children`,
    });
  }

  // Check that all referenced tempIds exist
  for (const childTempId of containerContent.children) {
    if (typeof childTempId !== "string") {
      errors.push({
        type: "hard",
        message: `Container child reference must be a string`,
        field: `blocks[${index}].content.children`,
      });
    } else if (!tempIdToIndex.has(childTempId)) {
      errors.push({
        type: "hard",
        message: `Container references non-existent tempId "${childTempId}"`,
        field: `blocks[${index}].content.children`,
      });
    }
  }

  return errors;
}

// ============================================================================
// Normalization: Soft Failures
// ============================================================================

/**
 * Normalizes AI blocks by applying soft failure fixes.
 * Returns normalized blocks and warnings for any fixes applied.
 */
export function normalizeAIBlocks(
  blocks: AIBlockDefinition[]
): {
  normalized: AIBlockDefinition[];
  warnings: TranslationError[];
} {
  const warnings: TranslationError[] = [];
  const normalized: AIBlockDefinition[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const normalizedBlock = { ...block };
    const blockWarnings = normalizeBlock(normalizedBlock, i);
    warnings.push(...blockWarnings);
    normalized.push(normalizedBlock);
  }

  return { normalized, warnings };
}

function normalizeBlock(
  block: AIBlockDefinition,
  index: number
): TranslationError[] {
  const warnings: TranslationError[] = [];

  // Normalize text content
  if (block.type === "text") {
    const textContent = block.content as AITextContent;
    if (textContent.text.length > MAX_TEXT_LENGTH) {
      textContent.text = textContent.text.substring(0, MAX_TEXT_LENGTH);
      warnings.push({
        type: "soft",
        message: `Text content truncated to ${MAX_TEXT_LENGTH} characters`,
        field: `blocks[${index}].content.text`,
      });
    }
  }

  // Normalize image alt text
  if (block.type === "image") {
    const imageContent = block.content as AIImageContent;
    if (!imageContent.alt) {
      imageContent.alt = "Image";
      warnings.push({
        type: "soft",
        message: `Missing alt text, default applied`,
        field: `blocks[${index}].content.alt`,
      });
    } else if (imageContent.alt.length > MAX_ALT_TEXT_LENGTH) {
      imageContent.alt = imageContent.alt.substring(0, MAX_ALT_TEXT_LENGTH);
      warnings.push({
        type: "soft",
        message: `Alt text truncated to ${MAX_ALT_TEXT_LENGTH} characters`,
        field: `blocks[${index}].content.alt`,
      });
    }
  }

  // Normalize styles
  if (block.styles) {
    const styleWarnings = normalizeStyles(block.styles, index);
    warnings.push(...styleWarnings);
  }

  return warnings;
}

function normalizeStyles(
  styles: AIBlockStyles,
  blockIndex: number
): TranslationError[] {
  const warnings: TranslationError[] = [];

  // Normalize fontFamily
  if (styles.fontFamily) {
    if (!ALLOWED_FONT_FAMILIES.includes(styles.fontFamily as any)) {
      delete styles.fontFamily;
      warnings.push({
        type: "soft",
        message: `Invalid fontFamily, style ignored`,
        field: `blocks[${blockIndex}].styles.fontFamily`,
      });
    }
  }

  // Normalize fontSize
  if (typeof styles.fontSize === "number") {
    if (styles.fontSize < 8) {
      styles.fontSize = 8;
      warnings.push({
        type: "soft",
        message: `fontSize clamped to minimum (8px)`,
        field: `blocks[${blockIndex}].styles.fontSize`,
      });
    } else if (styles.fontSize > 72) {
      styles.fontSize = 72;
      warnings.push({
        type: "soft",
        message: `fontSize clamped to maximum (72px)`,
        field: `blocks[${blockIndex}].styles.fontSize`,
      });
    }
  }

  // Normalize borderWidth
  if (typeof styles.borderWidth === "number") {
    if (styles.borderWidth < 0) {
      styles.borderWidth = 0;
    } else if (styles.borderWidth > 10) {
      styles.borderWidth = 10;
    }
  }

  // Normalize borderRadius
  if (typeof styles.borderRadius === "number") {
    if (styles.borderRadius < 0) {
      styles.borderRadius = 0;
    } else if (styles.borderRadius > 50) {
      styles.borderRadius = 50;
    }
  }

  // Normalize opacity
  if (typeof styles.opacity === "number") {
    if (styles.opacity < 0) {
      styles.opacity = 0;
    } else if (styles.opacity > 1) {
      styles.opacity = 1;
    }
  }

  // Normalize zIndex
  // Note: zIndex normalization happens during translation, not here

  return warnings;
}

// ============================================================================
// tempId Resolution
// ============================================================================

/**
 * Builds tempId to index mapping for validation.
 * Actual ID generation happens during translation to ensure consistency.
 */
export function buildTempIdMapping(
  blocks: AIBlockDefinition[]
): Map<string, number> {
  const tempIdToIndex = new Map<string, number>();

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.tempId) {
      tempIdToIndex.set(block.tempId, i);
    }
  }

  return tempIdToIndex;
}

// ============================================================================
// Default Application
// ============================================================================

/**
 * Applies default values for missing position, size, and styles.
 * Auto-positions blocks when position is missing.
 */
export function applyDefaults(
  blocks: AIBlockDefinition[],
  existingBlocks?: Block[]
): {
  blocksWithDefaults: AIBlockDefinition[];
  autoPositioned: boolean[];
} {
  const blocksWithDefaults: AIBlockDefinition[] = [];
  const autoPositioned: boolean[] = [];

  // Calculate starting position for auto-positioning
  let nextY = AUTO_POSITION_START.y;
  const startX = AUTO_POSITION_START.x;

  // Get max zIndex from existing blocks if provided
  let maxZIndex = 0;
  if (existingBlocks && existingBlocks.length > 0) {
    maxZIndex = Math.max(...existingBlocks.map((b) => b.zIndex));
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockWithDefaults = { ...block };

    // Determine actual size that will be used (for auto-positioning calculation)
    const actualSize = block.size || DEFAULT_SIZES[block.type] || DEFAULT_SIZES.text;

    // Apply default position if missing
    if (!block.position) {
      blockWithDefaults.position = { x: startX, y: nextY };
      autoPositioned[i] = true;

      // Calculate next Y position based on actual block size
      nextY += actualSize.height + AUTO_POSITION_SPACING;
    } else {
      autoPositioned[i] = false;
      // Update nextY to ensure auto-positioned blocks don't overlap positioned ones
      nextY = Math.max(nextY, block.position.y + actualSize.height + AUTO_POSITION_SPACING);
    }

    // Apply default size if missing
    if (!block.size) {
      blockWithDefaults.size = { ...actualSize };
    }

    // Apply default zIndex if missing
    if (typeof block.zIndex !== "number") {
      blockWithDefaults.zIndex = maxZIndex + i + 1;
    } else {
      // Ensure zIndex is within valid range
      if (block.zIndex < 1) {
        blockWithDefaults.zIndex = 1;
      } else if (block.zIndex > 1000) {
        blockWithDefaults.zIndex = 1000;
      }
    }

    // Apply default styles if missing
    if (!block.styles) {
      blockWithDefaults.styles = getDefaultStyles(block.type);
    } else {
      // Merge with defaults (user styles take precedence)
      blockWithDefaults.styles = {
        ...getDefaultStyles(block.type),
        ...block.styles,
      };
    }

    blocksWithDefaults.push(blockWithDefaults);
  }

  return { blocksWithDefaults, autoPositioned };
}

function getDefaultStyles(type: string): AIBlockStyles {
  const baseStyles: AIBlockStyles = {
    opacity: 1.0,
  };

  switch (type) {
    case "text":
      return {
        ...baseStyles,
        fontSize: 16,
        fontWeight: "normal",
        color: "#000000",
        textAlign: "left",
        fontFamily: "system-ui",
      };
    case "image":
      return {
        ...baseStyles,
        objectFit: "cover",
        borderRadius: 0,
      };
    case "shape":
      return {
        ...baseStyles,
        backgroundColor: "#e5e7eb",
        borderColor: "#d1d5db",
        borderWidth: 1,
        borderRadius: 0,
      };
    case "container":
      return {
        ...baseStyles,
        backgroundColor: "transparent",
        borderWidth: 0,
      };
    default:
      return baseStyles;
  }
}

// ============================================================================
// Translation: AI Blocks → Editor Blocks
// ============================================================================

/**
 * Translates normalized AI blocks to editor Block format.
 * Resolves tempIds to real IDs and creates editor-compatible blocks.
 */
export function translateToEditorBlocks(
  normalizedBlocks: AIBlockDefinition[],
  tempIdToIndex: Map<string, number>
): Block[] {
  const editorBlocks: Block[] = [];
  const tempIdToRealId = new Map<string, string>(); // Build mapping as we translate

  // First pass: Create all non-container blocks and build tempId -> realId mapping
  for (let i = 0; i < normalizedBlocks.length; i++) {
    const aiBlock = normalizedBlocks[i];
    if (aiBlock.type !== "container") {
      const realId = generateBlockId();
      
      // Store mapping if block has tempId
      if (aiBlock.tempId) {
        tempIdToRealId.set(aiBlock.tempId, realId);
      }
      
      const editorBlock = translateBlock(aiBlock, realId, tempIdToRealId);
      if (editorBlock) {
        editorBlocks.push(editorBlock);
      }
    }
  }

  // Second pass: Create container blocks (after all children exist and are mapped)
  for (let i = 0; i < normalizedBlocks.length; i++) {
    const aiBlock = normalizedBlocks[i];
    if (aiBlock.type === "container") {
      const realId = generateBlockId();
      
      // Store mapping if block has tempId
      if (aiBlock.tempId) {
        tempIdToRealId.set(aiBlock.tempId, realId);
      }
      
      const editorBlock = translateBlock(aiBlock, realId, tempIdToRealId) as ContainerBlock | null;
      if (editorBlock) {
        editorBlocks.push(editorBlock);
      }
    }
  }

  return editorBlocks;
}

function translateBlock(
  aiBlock: AIBlockDefinition,
  realId: string,
  tempIdToRealId: Map<string, string>
): Block | null {

  // Ensure position and size exist (should be guaranteed by applyDefaults)
  const position: Position = aiBlock.position || AUTO_POSITION_START;
  const size: Size = aiBlock.size || DEFAULT_SIZES[aiBlock.type] || DEFAULT_SIZES.text;
  const zIndex = aiBlock.zIndex || 1;

  // Convert AI styles to editor styles
  const styles: BlockStyles = convertStyles(aiBlock.styles || {});

  switch (aiBlock.type) {
    case "text": {
      const textContent = aiBlock.content as AITextContent;
      const block: TextBlock = {
        id: realId,
        type: "text",
        content: textContent.text,
        role: undefined, // Role is optional, AI doesn't enforce it
        animations: undefined, // Animation scaffolding (empty, no runtime behavior)
        position,
        size,
        styles,
        zIndex,
      };
      return block;
    }

    case "image": {
      const imageContent = aiBlock.content as AIImageContent;
      const block: ImageBlock = {
        id: realId,
        type: "image",
        src: imageContent.src,
        alt: imageContent.alt || "Image",
        position,
        size,
        styles,
        zIndex,
      };
      return block;
    }

    case "shape": {
      const shapeContent = aiBlock.content as AIShapeContent;
      if (shapeContent.shapeType !== "rectangle") {
        return null; // Should not happen after validation
      }

      // Optional shapeId from AI (already validated against shapesRegistry in validateBlockContent)
      const contentWithShapeId = aiBlock.content as AIShapeContent & { shapeId?: string };
      const shapeId = typeof contentWithShapeId.shapeId === "string"
        ? contentWithShapeId.shapeId.trim()
        : undefined;

      const block: ShapeBlock = {
        id: realId,
        type: "shape",
        shapeType: "rectangle",
        shapeId,
        position,
        size,
        styles,
        zIndex,
      };
      return block;
    }

    case "container": {
      const containerContent = aiBlock.content as AIContainerContent;
      // Resolve tempIds to real IDs using the mapping built during translation
      const children = containerContent.children
        .map((tempId) => tempIdToRealId.get(tempId))
        .filter((id): id is string => id !== undefined);
      const block: ContainerBlock = {
        id: realId,
        type: "container",
        children,
        position,
        size,
        styles,
        zIndex,
      };
      return block;
    }

    default:
      return null;
  }
}

function convertStyles(aiStyles: AIBlockStyles): BlockStyles {
  const editorStyles: BlockStyles = {};

  // Common styles
  if (aiStyles.backgroundColor !== undefined) {
    editorStyles.backgroundColor = aiStyles.backgroundColor;
  }
  if (aiStyles.borderColor !== undefined) {
    editorStyles.borderColor = aiStyles.borderColor;
  }
  if (aiStyles.borderWidth !== undefined) {
    editorStyles.borderWidth = aiStyles.borderWidth;
  }
  if (aiStyles.borderRadius !== undefined) {
    editorStyles.borderRadius = aiStyles.borderRadius;
  }
  if (aiStyles.opacity !== undefined) {
    editorStyles.opacity = aiStyles.opacity;
  }

  // Text-specific styles
  if (aiStyles.fontSize !== undefined) {
    editorStyles.fontSize = aiStyles.fontSize;
  }
  if (aiStyles.fontWeight !== undefined) {
    editorStyles.fontWeight = aiStyles.fontWeight;
  }
  if (aiStyles.fontFamily !== undefined) {
    editorStyles.fontFamily = aiStyles.fontFamily;
  }
  if (aiStyles.color !== undefined) {
    editorStyles.color = aiStyles.color;
  }
  if (aiStyles.textAlign !== undefined) {
    editorStyles.textAlign = aiStyles.textAlign;
  }

  // Image-specific styles
  if (aiStyles.objectFit !== undefined) {
    editorStyles.objectFit = aiStyles.objectFit;
  }

  return editorStyles;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main translation function: Converts AI output to editor-ready blocks.
 * 
 * This is the ONLY function that should be called from outside this module.
 * It orchestrates validation, normalization, tempId resolution, default application,
 * and final translation.
 * 
 * @param input - AI output conforming to AIOutputSchema
 * @param existingBlocks - Optional existing blocks for zIndex calculation and auto-positioning
 * @returns Translation result with blocks or errors
 */
export function translateAIOutputToEditorBlocks(
  input: unknown,
  existingBlocks?: Block[]
): TranslationResult {
  // Step 1: Strict validation (hard failures)
  const validation = validateAIOutputStrict(input);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
    };
  }

  const schema = input as AIOutputSchema;

  // Step 2: Normalize blocks (soft failures)
  const normalization = normalizeAIBlocks(schema.blocks);
  const warnings = normalization.warnings;

  // Step 3: Build tempId mapping (for container reference validation)
  // Note: Actual ID generation happens during translation
  const tempIdToIndex = buildTempIdMapping(normalization.normalized);

  // Step 4: Apply defaults
  const defaults = applyDefaults(normalization.normalized, existingBlocks);

  // Step 5: Translate to editor blocks (generates IDs and resolves tempIds)
  const editorBlocks = translateToEditorBlocks(
    defaults.blocksWithDefaults,
    tempIdToIndex
  );

  return {
    success: true,
    blocks: editorBlocks,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
