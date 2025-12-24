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
  position = DEFAULT_POSITION,
  role?: "heading" | "subheading" | "body" | "caption"
): TextBlock {
  // Detect dark mode for default text color
  const isDarkMode = typeof window !== "undefined" && (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  
  // Role-based default styles (hints only, user can override)
  const getRoleDefaults = (role?: string) => {
    switch (role) {
      case "heading":
        return { fontSize: 32, fontWeight: "bold", lineHeight: 1.2 };
      case "subheading":
        return { fontSize: 24, fontWeight: 600, lineHeight: 1.3 };
      case "body":
        return { fontSize: 16, fontWeight: "normal", lineHeight: 1.5 };
      case "caption":
        return { fontSize: 12, fontWeight: "normal", lineHeight: 1.4 };
      default:
        return { fontSize: 16, fontWeight: "normal", lineHeight: 1.4 };
    }
  };

  const roleDefaults = getRoleDefaults(role);
  
  return {
    id: generateId(),
    type: "text",
    content,
    role,
    position,
    size: { width: 200, height: 100 },
    styles: {
      ...roleDefaults,
      color: isDarkMode ? "#fafafa" : "#000000",
      textAlign: "left",
    },
    zIndex: 1,
    animations: undefined, // Animation scaffolding (empty, no runtime behavior)
  };
}

export function createImageBlock(
  src: string,
  position = DEFAULT_POSITION,
  size?: { width: number; height: number }
): ImageBlock {
  const finalSize = size || { width: 200, height: 200 };
  
  // Debug: Log the size being used
  console.log("[createImageBlock] Creating image block with size:", finalSize);
  
  return {
    id: generateId(),
    type: "image",
    src,
    alt: "Image",
    position,
    size: finalSize,
    styles: {
      objectFit: "cover", // "cover" crops the image when resized, "contain" scales it
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
