import type { Block } from "@/types/blocks";

// Convert Block to database format (matches Newsletter model)
export function serializeBlocks(blocks: Block[]): unknown[] {
  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    content: isTextBlock(block) ? block.content : isImageBlock(block) ? { src: block.src, alt: block.alt } : {},
    styles: block.styles,
    position: block.position,
    size: block.size,
    zIndex: block.zIndex,
    children: isContainerBlock(block) ? block.children : [],
    sectionMetadata: isContainerBlock(block) ? block.sectionMetadata : undefined,
  }));
}

// Convert database format to Block
export function deserializeBlocks(data: unknown[]): Block[] {
  return data.map((item: any) => {
    // Helper to validate size object (handle empty objects, null, undefined)
    const getSize = (size: any): { width: number; height: number } => {
      if (!size || typeof size !== "object" || Object.keys(size).length === 0) {
        return { width: 200, height: 100 };
      }
      // Validate width and height exist and are numbers
      if (typeof size.width === "number" && typeof size.height === "number") {
        return { width: size.width, height: size.height };
      }
      // Partial or invalid size - use defaults
      return { width: 200, height: 100 };
    };

    // Helper to validate zIndex
    const getZIndex = (zIndex: any): number => {
      if (typeof zIndex === "number" && zIndex >= 1) {
        return zIndex;
      }
      return 1;
    };

    const base = {
      id: item.id,
      type: item.type,
      position: item.position && typeof item.position === "object" && typeof item.position.x === "number" && typeof item.position.y === "number"
        ? item.position
        : { x: 0, y: 0 },
      size: getSize(item.size),
      styles: item.styles && typeof item.styles === "object" ? item.styles : {},
      zIndex: getZIndex(item.zIndex),
    };

    switch (item.type) {
      case "text":
        return {
          ...base,
          type: "text" as const,
          content: typeof item.content === "string" ? item.content : item.content?.content || item.content?.text || "Text",
        };
      case "image":
        return {
          ...base,
          type: "image" as const,
          src: item.content?.src || item.content || "https://via.placeholder.com/200x200",
          alt: item.content?.alt || "Image",
        };
      case "shape":
        return {
          ...base,
          type: "shape" as const,
          shapeType: "rectangle" as const,
        };
      case "container":
        return {
          ...base,
          type: "container" as const,
          children: item.children || [],
          sectionMetadata: item.sectionMetadata || undefined,
        };
      default:
        // Fallback to text block for unknown types
        return {
          ...base,
          type: "text" as const,
          content: "Text",
        };
    }
  }) as Block[];
}

// Helper type guards for serialization
function isTextBlock(block: Block): block is import("@/types/blocks").TextBlock {
  return block.type === "text";
}

function isImageBlock(block: Block): block is import("@/types/blocks").ImageBlock {
  return block.type === "image";
}

function isContainerBlock(block: Block): block is import("@/types/blocks").ContainerBlock {
  return block.type === "container";
}
