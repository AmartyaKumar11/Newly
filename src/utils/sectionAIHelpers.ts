/**
 * Section-Level AI Helpers
 * 
 * Utilities for extracting section content and managing section-level AI operations.
 * These functions ensure AI only operates on selected sections.
 */

import type { Block, ContainerBlock, TextBlock, ImageBlock, ShapeBlock } from "@/types/blocks";
import { isContainerBlock, isTextBlock, isImageBlock, isShapeBlock } from "@/types/blocks";

/**
 * Extracts all blocks that belong to a section (container + all its children recursively).
 * 
 * @param containerId - The ID of the container block representing the section
 * @param allBlocks - All blocks in the editor
 * @returns Array of block IDs that belong to this section (including the container itself)
 */
export function getSectionBlockIds(containerId: string, allBlocks: Block[]): string[] {
  const sectionIds = new Set<string>([containerId]);
  
  const container = allBlocks.find(b => b.id === containerId) as ContainerBlock | undefined;
  if (!container || !isContainerBlock(container)) {
    return [containerId]; // If not a container, just return the block itself
  }
  
  // Recursively collect all child blocks
  const collectChildren = (childIds: string[]) => {
    for (const childId of childIds) {
      if (sectionIds.has(childId)) continue; // Prevent infinite loops
      sectionIds.add(childId);
      
      const childBlock = allBlocks.find(b => b.id === childId);
      if (childBlock && isContainerBlock(childBlock)) {
        collectChildren(childBlock.children);
      }
    }
  };
  
  collectChildren(container.children);
  return Array.from(sectionIds);
}

/**
 * Gets all blocks in a section as Block objects.
 * 
 * @param containerId - The ID of the container block
 * @param allBlocks - All blocks in the editor
 * @returns Array of Block objects in this section (container + all children)
 */
export function getSectionBlocks(containerId: string, allBlocks: Block[]): Block[] {
  const sectionIds = getSectionBlockIds(containerId, allBlocks);
  return allBlocks.filter(block => sectionIds.includes(block.id));
}

/**
 * Extracts text content from blocks for AI context.
 * Returns a human-readable description of the section content.
 * Provides structured context showing which blocks are in the container vs direct children.
 * 
 * @param blocks - Array of blocks in the section (should include container + all children, or just the target block)
 * @param containerBlock - Optional container block representing the section
 * @returns Plain text description of the section content
 */
export function extractSectionContentForPrompt(
  blocks: Block[],
  containerBlock?: ContainerBlock
): string {
  const contentParts: string[] = [];
  
  // If it's a single text block, extract it directly
  if (blocks.length === 1 && isTextBlock(blocks[0])) {
    const textBlock = blocks[0];
    return `Text block content to modify:\n"${textBlock.content}"`;
  }
  
  // Find the container block
  const container = containerBlock || blocks.find(b => b.type === "container") as ContainerBlock | undefined;
  
  // Separate container from children
  const childBlocks = blocks.filter(b => b.id !== container?.id);
  
  if (container) {
    contentParts.push(`Container section with ${childBlocks.length} child elements:`);
  } else {
    contentParts.push(`Section content (${blocks.length} blocks):`);
  }
  
  // Describe each child block
  for (const block of childBlocks) {
    if (isTextBlock(block)) {
      const textContent = block.content;
      contentParts.push(`  - Text block: "${textContent.substring(0, 200)}${textContent.length > 200 ? "..." : ""}"`);
    } else if (isImageBlock(block)) {
      contentParts.push(`  - Image block: ${block.alt || block.src}`);
    } else if (isShapeBlock(block)) {
      contentParts.push(`  - Shape block: ${block.shapeType}`);
    } else if (isContainerBlock(block)) {
      contentParts.push(`  - Nested container with ${block.children.length} child elements`);
    }
  }
  
  return contentParts.join("\n");
}
