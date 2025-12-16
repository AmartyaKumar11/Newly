/**
 * Section Identity Utilities
 * 
 * Handles stable section identity generation and preservation.
 * Section identity must survive AI replacement operations.
 */

import type { ContainerBlock, SectionMetadata } from "@/types/blocks";

/**
 * Generates a stable section ID
 * Format: section-{timestamp}-{random}
 */
export function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates section metadata for a new container
 */
export function createSectionMetadata(
  createdBy: "manual" | "ai" = "manual",
  sectionType?: SectionMetadata["sectionType"]
): SectionMetadata {
  return {
    sectionId: generateSectionId(),
    sectionType,
    createdBy,
    lastModifiedAt: new Date().toISOString(),
  };
}

/**
 * Preserves section metadata when replacing section content
 * If the target container has metadata, it's preserved on the new container
 */
export function preserveSectionMetadata(
  existingContainer: ContainerBlock | null,
  newContainer: ContainerBlock
): ContainerBlock {
  if (existingContainer?.sectionMetadata) {
    // Preserve the sectionId (stable identity)
    // Update lastModifiedAt
    // Optionally update lastAIAction if provided
    return {
      ...newContainer,
      sectionMetadata: {
        ...existingContainer.sectionMetadata,
        lastModifiedAt: new Date().toISOString(),
      },
    };
  }
  
  // If no existing metadata, generate new metadata
  // This handles new containers created by AI
  if (!newContainer.sectionMetadata) {
    return {
      ...newContainer,
      sectionMetadata: createSectionMetadata("ai"),
    };
  }
  
  return newContainer;
}

/**
 * Updates section metadata with AI action info
 */
export function updateSectionMetadataWithAIAction(
  container: ContainerBlock,
  action: SectionMetadata["lastAIAction"]
): ContainerBlock {
  if (!container.sectionMetadata) {
    return {
      ...container,
      sectionMetadata: createSectionMetadata("ai"),
    };
  }
  
  return {
    ...container,
    sectionMetadata: {
      ...container.sectionMetadata,
      lastAIAction: action,
      lastModifiedAt: new Date().toISOString(),
    },
  };
}

/**
 * Gets section ID from container or returns null
 */
export function getSectionId(container: ContainerBlock | null): string | null {
  return container?.sectionMetadata?.sectionId || null;
}
