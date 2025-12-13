import type { Block, TextBlock, ImageBlock, ShapeBlock } from "@/types/blocks";

// Generate unique IDs for blocks
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default block dimensions
const DEFAULT_SIZE = { width: 200, height: 100 };
const DEFAULT_POSITION = { x: 100, y: 100 };

export function createTextBlock(
  content: string = "Text",
  position = DEFAULT_POSITION
): TextBlock {
  // Detect dark mode for default text color
  const isDarkMode = typeof window !== "undefined" && (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  
  return {
    id: generateId(),
    type: "text",
    content,
    position,
    size: { width: 200, height: 100 },
    styles: {
      fontSize: 16,
      fontWeight: "normal",
      color: isDarkMode ? "#fafafa" : "#000000",
      textAlign: "left",
    },
    zIndex: 1,
  };
}

export function createImageBlock(
  src: string,
  position = DEFAULT_POSITION
): ImageBlock {
  return {
    id: generateId(),
    type: "image",
    src,
    alt: "Image",
    position,
    size: { width: 200, height: 200 },
    styles: {
      objectFit: "cover",
      borderRadius: 0,
    },
    zIndex: 1,
  };
}

export function createShapeBlock(
  position = DEFAULT_POSITION
): ShapeBlock {
  return {
    id: generateId(),
    type: "shape",
    shapeType: "rectangle",
    position,
    size: { width: 200, height: 100 },
    styles: {
      backgroundColor: "#e5e7eb",
      borderColor: "#d1d5db",
      borderWidth: 1,
      borderRadius: 0,
    },
    zIndex: 1,
  };
}

// Helper to get next z-index for new blocks
export function getNextZIndex(blocks: Block[]): number {
  if (blocks.length === 0) return 1;
  return Math.max(...blocks.map((b) => b.zIndex)) + 1;
}
