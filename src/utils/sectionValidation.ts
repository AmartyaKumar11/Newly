/**
 * Section Boundary Validation
 * 
 * Validates sections before AI actions to ensure deterministic boundaries.
 * Prevents AI actions on ambiguous, deeply nested, or invalid structures.
 */

import type { Block, ContainerBlock } from "@/types/blocks";
import { isContainerBlock } from "@/types/blocks";

export interface SectionValidationResult {
  valid: boolean;
  error?: string;
  sectionType: "container" | "text_block";
  depth: number;
  blockCount: number;
}

/**
 * Maximum nesting depth allowed for AI actions
 * Prevents actions on overly complex structures
 */
const MAX_SECTION_DEPTH = 3;

/**
 * Maximum block count in a section for AI actions
 * Prevents actions on overly large sections
 */
const MAX_SECTION_BLOCKS = 50;

/**
 * Validates a section is eligible for AI actions
 */
export function validateSectionForAIAction(
  container: ContainerBlock | null,
  textBlockId: string | null,
  allBlocks: Block[]
): SectionValidationResult {
  // Handle text block case (simple, always valid)
  if (textBlockId && !container) {
    const textBlock = allBlocks.find(b => b.id === textBlockId);
    if (!textBlock) {
      return {
        valid: false,
        error: "Selected text block not found",
        sectionType: "text_block",
        depth: 0,
        blockCount: 0,
      };
    }
    
    return {
      valid: true,
      sectionType: "text_block",
      depth: 0,
      blockCount: 1,
    };
  }
  
  // Handle container case (requires validation)
  if (!container) {
    return {
      valid: false,
      error: "No container or text block selected",
      sectionType: "container",
      depth: 0,
      blockCount: 0,
    };
  }
  
  // Check for circular references
  const circularCheck = checkCircularReferences(container, allBlocks);
  if (!circularCheck.valid) {
    return {
      valid: false,
      error: circularCheck.error || "Circular reference detected in container structure",
      sectionType: "container",
      depth: 0,
      blockCount: 0,
    };
  }
  
  // Calculate section depth
  const depth = calculateSectionDepth(container, allBlocks);
  if (depth > MAX_SECTION_DEPTH) {
    return {
      valid: false,
      error: `Section nesting depth (${depth}) exceeds maximum allowed (${MAX_SECTION_DEPTH})`,
      sectionType: "container",
      depth,
      blockCount: 0,
    };
  }
  
  // Calculate total block count in section
  const blockCount = countSectionBlocks(container, allBlocks);
  if (blockCount > MAX_SECTION_BLOCKS) {
    return {
      valid: false,
      error: `Section contains too many blocks (${blockCount}). Maximum is ${MAX_SECTION_BLOCKS}`,
      sectionType: "container",
      depth,
      blockCount,
    };
  }
  
  // Check for overlapping containers (child is also a container parent)
  const overlapCheck = checkOverlappingContainers(container, allBlocks);
  if (!overlapCheck.valid) {
    return {
      valid: false,
      error: overlapCheck.error || "Section contains overlapping container structures",
      sectionType: "container",
      depth,
      blockCount,
    };
  }
  
  return {
    valid: true,
    sectionType: "container",
    depth,
    blockCount,
  };
}

/**
 * Checks for circular references in container structure
 */
function checkCircularReferences(
  container: ContainerBlock,
  allBlocks: Block[]
): { valid: boolean; error?: string } {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  const checkRecursive = (blockId: string): boolean => {
    if (recursionStack.has(blockId)) {
      return false; // Circular reference detected
    }
    
    if (visited.has(blockId)) {
      return true; // Already checked, no cycle
    }
    
    visited.add(blockId);
    recursionStack.add(blockId);
    
    const block = allBlocks.find(b => b.id === blockId);
    if (block && isContainerBlock(block)) {
      for (const childId of block.children) {
        if (!checkRecursive(childId)) {
          return false;
        }
      }
    }
    
    recursionStack.delete(blockId);
    return true;
  };
  
  const isValid = checkRecursive(container.id);
  return {
    valid: isValid,
    error: isValid ? undefined : "Circular reference detected in container children",
  };
}

/**
 * Calculates maximum nesting depth of a section
 */
function calculateSectionDepth(
  container: ContainerBlock,
  allBlocks: Block[]
): number {
  const visited = new Set<string>();
  
  const getDepth = (blockId: string, currentDepth: number): number => {
    if (visited.has(blockId)) {
      return currentDepth;
    }
    visited.add(blockId);
    
    const block = allBlocks.find(b => b.id === blockId);
    if (block && isContainerBlock(block)) {
      let maxChildDepth = currentDepth;
      for (const childId of block.children) {
        const childDepth = getDepth(childId, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
      return maxChildDepth;
    }
    
    return currentDepth;
  };
  
  return getDepth(container.id, 0);
}

/**
 * Counts total number of blocks in a section (including nested)
 */
function countSectionBlocks(
  container: ContainerBlock,
  allBlocks: Block[]
): number {
  const visited = new Set<string>();
  let count = 0;
  
  const countRecursive = (blockId: string): void => {
    if (visited.has(blockId)) {
      return;
    }
    visited.add(blockId);
    count++;
    
    const block = allBlocks.find(b => b.id === blockId);
    if (block && isContainerBlock(block)) {
      for (const childId of block.children) {
        countRecursive(childId);
      }
    }
  };
  
  countRecursive(container.id);
  return count;
}

/**
 * Checks for overlapping container structures
 * (e.g., container A contains container B, but B also contains A's parent)
 */
function checkOverlappingContainers(
  container: ContainerBlock,
  allBlocks: Block[]
): { valid: boolean; error?: string } {
  // Build set of all block IDs in this section
  const sectionBlockIds = new Set<string>();
  const collectIds = (blockId: string): void => {
    if (sectionBlockIds.has(blockId)) return;
    sectionBlockIds.add(blockId);
    
    const block = allBlocks.find(b => b.id === blockId);
    if (block && isContainerBlock(block)) {
      for (const childId of block.children) {
        collectIds(childId);
      }
    }
  };
  collectIds(container.id);
  
  // Check that no child container references blocks outside this section
  const checkChild = (blockId: string): boolean => {
    const block = allBlocks.find(b => b.id === blockId);
    if (block && isContainerBlock(block)) {
      for (const childId of block.children) {
        if (!sectionBlockIds.has(childId)) {
          return false; // Child references block outside section
        }
        if (!checkChild(childId)) {
          return false;
        }
      }
    }
    return true;
  };
  
  const isValid = checkChild(container.id);
  return {
    valid: isValid,
    error: isValid ? undefined : "Section contains containers with references outside the section boundary",
  };
}
