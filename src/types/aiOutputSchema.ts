/**
 * AI OUTPUT JSON SCHEMA v1.0.0
 * 
 * This is a PRODUCTION CONTRACT between AI services and the editor.
 * This schema MUST be frozen before AI integration.
 * 
 * DO NOT modify this schema without:
 * 1. Incrementing schemaVersion
 * 2. Adding migration logic
 * 3. Updating validation rules
 * 4. Testing backward compatibility
 */

// Canvas constraints
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;
export const MIN_BLOCK_SIZE = 50;
export const MAX_BLOCK_SIZE = 600;

/**
 * Canonical AI Output JSON Schema v1.0.0
 * 
 * This is the ONLY format AI is allowed to output.
 * All AI responses must conform to this structure.
 */
export interface AIOutputSchema {
  /**
   * Schema version - MUST be "1.0.0" for this version
   * Future versions will increment (e.g., "1.1.0", "2.0.0")
   */
  schemaVersion: "1.0.0";

  /**
   * Array of blocks to insert into the editor
   * Must contain at least 1 block, maximum 50 blocks per response
   */
  blocks: AIBlockDefinition[];

  /**
   * Optional metadata about the AI operation
   * Used for logging and debugging
   */
  metadata?: {
    /**
     * Operation type (e.g., "generate_content", "insert_section")
     */
    operation?: string;

    /**
     * Optional description of what was generated
     */
    description?: string;
  };
}

/**
 * AI Block Definition
 * 
 * Represents a single block that AI wants to create.
 * Must map directly to existing editor block types.
 */
export interface AIBlockDefinition {
  /**
   * Block type - MUST be one of: "text", "image", "shape", "container"
   * AI cannot invent new types
   */
  type: "text" | "image" | "shape" | "container";

  /**
   * Content for the block
   * Structure depends on block type (see type-specific definitions below)
   */
  content: AITextContent | AIImageContent | AIShapeContent | AIContainerContent;

  /**
   * Temporary identifier for container block references
   * 
   * CRITICAL: This field is AI-scoped and NOT persisted to the editor.
   * 
   * Purpose:
   * - Allows container blocks to reference child blocks within the same AI response
   * - Must be unique within a single AI response
   * - Editor remaps tempId → real block ID during translation
   * - tempId must never leave the translation layer
   * 
   * Required for: Container blocks that need to reference children
   * Optional for: All other block types
   * 
   * Constraints:
   * - Must be a non-empty string
   * - Must be unique within the same AIOutputSchema.blocks array
   * - Cannot contain special characters that could cause issues
   * - Editor will generate real IDs and discard tempId after translation
   */
  tempId?: string;

  /**
   * Position on canvas
   * x: 0 to CANVAS_WIDTH (600)
   * y: 0 to CANVAS_HEIGHT (800)
   * 
   * If omitted, editor will auto-position blocks
   */
  position?: {
    x: number; // 0-600
    y: number; // 0-800
  };

  /**
   * Size of the block
   * width: MIN_BLOCK_SIZE (50) to MAX_BLOCK_SIZE (600)
   * height: MIN_BLOCK_SIZE (50) to MAX_BLOCK_SIZE (800)
   * 
   * If omitted, editor will use type-specific defaults
   */
  size?: {
    width: number;  // 50-600
    height: number; // 50-800
  };

  /**
   * Optional styling
   * Only allowed fields from BlockStyles interface
   * No arbitrary CSS or HTML
   */
  styles?: AIBlockStyles;

  /**
   * Optional z-index for layering
   * Default: editor assigns automatically
   * Range: 1-1000
   */
  zIndex?: number;
}

/**
 * Text Block Content
 * 
 * For type: "text"
 */
export interface AITextContent {
  /**
   * Text content to display
   * 
   * Constraints:
   * - Plain text only (no HTML, no Markdown)
   * - Maximum 10,000 characters
   * - Line breaks preserved as \n
   * - No script tags, no HTML entities
   */
  text: string;

  /**
   * Optional semantic role hint
   * Used by editor to apply appropriate default styles
   * Does NOT affect validation - all are treated as text blocks
   */
  role?: "heading" | "paragraph" | "list" | "quote";
}

/**
 * Image Block Content
 * 
 * For type: "image"
 */
export interface AIImageContent {
  /**
   * Image source URL
   * 
   * Constraints:
   * - Must be valid HTTP/HTTPS URL
   * - Must be image format (jpg, png, gif, webp, svg)
   * - No data URIs (security risk)
   * - No javascript: or other protocols
   * 
   * For placeholders, use: "https://via.placeholder.com/{width}x{height}"
   */
  src: string;

  /**
   * Alt text for accessibility
   * Maximum 200 characters
   */
  alt?: string;
}

/**
 * Shape Block Content
 * 
 * For type: "shape"
 */
export interface AIShapeContent {
  /**
   * Shape type - currently only "rectangle" is supported
   * AI cannot request other shapes
   */
  shapeType: "rectangle";
}

/**
 * Container Block Content
 * 
 * For type: "container"
 * Container blocks group other blocks together
 */
export interface AIContainerContent {
  /**
   * Array of child block tempIds
   * 
   * CRITICAL: These reference tempId values, NOT editor block IDs.
   * 
   * Constraints:
   * - Must reference tempId values from blocks in the same AIOutputSchema.blocks array
   * - Cannot reference blocks from previous AI responses
   * - Cannot be circular (block A contains B, B contains A)
   * - All referenced tempIds must exist in the same response
   * 
   * Translation Process:
   * 1. Editor validates all tempIds exist in the response
   * 2. Editor generates real block IDs for all blocks
   * 3. Editor remaps tempId → real ID in container.children
   * 4. tempId is discarded and never persisted
   * 
   * Example:
   * AI output: [{ tempId: "header", ... }, { tempId: "content", ... }, { type: "container", content: { children: ["header", "content"] } }]
   * After translation: [{ id: "block-123", ... }, { id: "block-456", ... }, { type: "container", children: ["block-123", "block-456"] }]
   */
  children: string[]; // Array of tempId values
}

/**
 * Allowed Block Styles
 * 
 * AI can only specify these exact fields.
 * No arbitrary CSS, no HTML, no inline styles.
 */
export interface AIBlockStyles {
  // Common styles
  backgroundColor?: string;  // Hex color only (e.g., "#ffffff")
  borderColor?: string;       // Hex color only
  borderWidth?: number;       // 0-10 pixels
  borderRadius?: number;      // 0-50 pixels
  opacity?: number;           // 0.0-1.0

  // Text-specific styles
  fontSize?: number;          // 8-72 pixels
  fontWeight?: "normal" | "bold" | "300" | "500" | "600" | "700";
  /**
   * Font family - MUST be from explicit allowlist
   * 
   * Allowed values:
   * - "system-ui" (system default)
   * - "Arial"
   * - "Helvetica"
   * - "Times New Roman"
   * - "Georgia"
   * - "Courier New"
   * - "Verdana"
   * 
   * Custom fonts are NOT supported in Phase 3.
   * Font extensibility will be added in later phases.
   * 
   * Validation: Any font not in this list is rejected (soft failure - style ignored).
   */
  fontFamily?: "system-ui" | "Arial" | "Helvetica" | "Times New Roman" | "Georgia" | "Courier New" | "Verdana";
  color?: string;             // Hex color only
  textAlign?: "left" | "center" | "right" | "justify";

  // Image-specific styles
  objectFit?: "cover" | "contain" | "fill" | "none";
}

/**
 * Validation Rules
 * 
 * These rules MUST be enforced before any AI output is accepted.
 */
export interface ValidationRules {
  /**
   * Hard failures - output is completely rejected
   */
  hardFailures: {
    /**
     * Missing or invalid schemaVersion
     */
    invalidVersion: boolean;

    /**
     * Missing or empty blocks array
     */
    noBlocks: boolean;

    /**
     * Blocks array exceeds maximum (50)
     */
    tooManyBlocks: boolean;

    /**
     * Invalid block type (not in allowed list)
     */
    invalidBlockType: boolean;

    /**
     * Position outside canvas bounds
     */
    positionOutOfBounds: boolean;

    /**
     * Size outside allowed range
     */
    sizeOutOfRange: boolean;

    /**
     * Contains HTML tags
     */
    containsHTML: boolean;

    /**
     * Contains script tags or javascript:
     */
    containsScripts: boolean;

    /**
     * Contains markdown syntax
     */
    containsMarkdown: boolean;

    /**
     * Invalid URL format
     */
    invalidURL: boolean;

    /**
     * Container references invalid child tempIds
     * - References non-existent tempIds
     * - Circular references
     */
    invalidContainerChildren: boolean;

    /**
     * Block overflows canvas bounds
     * 
     * A block must be rejected if:
     * - x + width > CANVAS_WIDTH (600)
     * - y + height > CANVAS_HEIGHT (800)
     * 
     * This validation only applies when BOTH position and size are present.
     * If either is missing, editor auto-resolves (existing behavior).
     */
    blockOverflowsCanvas: boolean;
  };

  /**
   * Soft failures - output is partially accepted with fixes
   */
  softFailures: {
    /**
     * Missing position - editor auto-positions
     */
    missingPosition: boolean;

    /**
     * Missing size - editor uses defaults
     */
    missingSize: boolean;

    /**
     * Invalid style value - style is ignored
     * Includes: invalid fontFamily (not in allowlist), out-of-range values, etc.
     */
    invalidStyle: boolean;

    /**
     * Duplicate tempId in same response
     * All tempIds must be unique within a single AI response
     */
    duplicateTempId: boolean;

    /**
     * Text exceeds max length - truncated
     */
    textTooLong: boolean;

    /**
     * Missing alt text - default applied
     */
    missingAltText: boolean;
  };
}

/**
 * Example Valid Output
 */
export const EXAMPLE_VALID_OUTPUT: AIOutputSchema = {
  schemaVersion: "1.0.0",
  blocks: [
    {
      type: "text",
      tempId: "heading-1",
      content: {
        text: "Welcome to Our Newsletter",
        role: "heading",
      },
      position: { x: 50, y: 50 },
      size: { width: 500, height: 60 },
      styles: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000000",
        textAlign: "center",
        fontFamily: "Arial",
      },
    },
    {
      type: "text",
      tempId: "paragraph-1",
      content: {
        text: "This is a paragraph of text that will be displayed in the newsletter.",
        role: "paragraph",
      },
      position: { x: 50, y: 130 },
      size: { width: 500, height: 100 },
      styles: {
        fontSize: 16,
        color: "#333333",
        textAlign: "left",
        fontFamily: "system-ui",
      },
    },
    {
      type: "image",
      tempId: "image-1",
      content: {
        src: "https://via.placeholder.com/500x300",
        alt: "Newsletter image",
      },
      position: { x: 50, y: 250 },
      size: { width: 500, height: 300 },
      styles: {
        borderRadius: 8,
      },
    },
    {
      type: "container",
      tempId: "section-1",
      content: {
        children: ["heading-1", "paragraph-1", "image-1"], // References tempIds
      },
      position: { x: 50, y: 50 },
      size: { width: 500, height: 500 },
    },
  ],
  metadata: {
    operation: "generate_content",
    description: "Generated newsletter header section with container",
  },
};

/**
 * Example Invalid Output
 */
export const EXAMPLE_INVALID_OUTPUT = {
  schemaVersion: "1.0.0",
  blocks: [
    {
      type: "text",
      content: {
        text: "<h1>Welcome</h1><script>alert('xss')</script>", // INVALID: Contains HTML and scripts
      },
      position: { x: 1000, y: 1000 }, // INVALID: Outside canvas bounds
      size: { width: 10, height: 10 }, // INVALID: Below minimum size
      styles: {
        fontSize: 200, // INVALID: Exceeds maximum (72)
        fontFamily: "Comic Sans", // INVALID: Not in allowlist
        customCSS: "display: flex", // INVALID: Not an allowed style field
      },
    },
    {
      type: "text",
      content: {
        text: "This block overflows",
      },
      position: { x: 550, y: 50 }, // Valid position
      size: { width: 100, height: 50 }, // Valid size, but x + width (650) > CANVAS_WIDTH (600)
      // INVALID: Block overflows canvas
    },
    {
      type: "custom", // INVALID: Not an allowed block type
      content: {},
    },
    {
      type: "image",
      content: {
        src: "javascript:alert('xss')", // INVALID: Dangerous protocol
      },
    },
    {
      type: "container",
      content: {
        children: ["missing-block"], // INVALID: References non-existent tempId
      },
    },
  ],
};

/**
 * Why Invalid Output is Rejected:
 * 
 * 1. HTML and Scripts: Security risk - could execute malicious code
 * 2. Position Out of Bounds: Blocks would be invisible or cause layout issues
 * 3. Size Below Minimum: Blocks would be too small to interact with
 * 4. Block Overflow: x + width (550) exceeds CANVAS_WIDTH (600) - block would be clipped
 * 5. Invalid Font Size: Would break layout or be unreadable
 * 6. Invalid Font Family: "Comic Sans" not in allowlist - style ignored, but block rejected due to other errors
 * 7. Custom CSS: Not allowed - breaks encapsulation
 * 8. Invalid Block Type: Editor doesn't support "custom" type
 * 9. Dangerous URL: javascript: protocol is a security risk
 * 10. Invalid Container Children: References non-existent tempId "missing-block"
 * 
 * All of these must be caught during validation and the entire output rejected.
 */
