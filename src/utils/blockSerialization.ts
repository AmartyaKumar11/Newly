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
  }));
}

// Convert database format to Block
export function deserializeBlocks(data: unknown[]): Block[] {
  return data.map((item: any) => {
    const base = {
      id: item.id,
      type: item.type,
      position: item.position || { x: 0, y: 0 },
      size: item.size || { width: 200, height: 100 },
      styles: item.styles || {},
      zIndex: item.zIndex || 1,
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
