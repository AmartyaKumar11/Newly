/**
 * Slug Utilities
 * 
 * Phase 3.5: Publishing System
 * 
 * Generates and validates URL slugs for published newsletters.
 * 
 * Rules:
 * - Slugs must be globally unique
 * - Human-readable (kebab-case)
 * - Collisions must be handled explicitly
 * - Locked when published (cannot change)
 */

/**
 * Generate a URL-safe slug from a string.
 * 
 * Converts to lowercase, removes special characters, replaces spaces with hyphens.
 * 
 * @param text - Input text to slugify
 * @returns URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, "")
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Limit length to 100 characters
    .slice(0, 100);
}

/**
 * Validate a slug format.
 * 
 * @param slug - Slug to validate
 * @returns true if slug is valid format
 */
export function isValidSlugFormat(slug: string): boolean {
  // Must be non-empty
  if (!slug || slug.length === 0) {
    return false;
  }

  // Must be 1-100 characters
  if (slug.length > 100) {
    return false;
  }

  // Must match pattern: lowercase letters, numbers, hyphens only
  // Cannot start or end with hyphen
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}

/**
 * Generate a unique slug with collision handling.
 * 
 * If the base slug already exists, appends a number suffix.
 * 
 * @param baseSlug - Base slug (without suffix)
 * @param checkExists - Function to check if slug exists (returns Promise<boolean>)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  // Validate base slug format
  if (!isValidSlugFormat(baseSlug)) {
    throw new Error(`Invalid slug format: ${baseSlug}`);
  }

  let candidateSlug = baseSlug;
  let counter = 1;

  // Check if base slug exists
  while (await checkExists(candidateSlug)) {
    // Append counter to base slug (e.g., "my-newsletter" -> "my-newsletter-2")
    const suffix = `-${counter}`;
    const maxLength = 100 - suffix.length;
    candidateSlug = `${baseSlug.slice(0, maxLength)}${suffix}`;
    counter++;

    // Safety limit (should never hit this in practice)
    if (counter > 1000) {
      throw new Error("Unable to generate unique slug after 1000 attempts");
    }
  }

  return candidateSlug;
}
