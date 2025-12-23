/**
 * Shape registry
 *
 * NOTE:
 * - This file is intended to be **auto-generated** by `scripts/normalize-svgs.ts`.
 * - The initial version is an empty registry so the app can compile.
 * - Running the normalization script should overwrite this file with
 *   a deterministic list of shapes discovered under `/public/shapes`.
 */

export interface ShapeRegistryEntry {
  /**
   * Stable identifier derived from category + filename (without `.svg`).
   * Example: "speech/bubble-round"
   */
  id: string;

  /**
   * Top-level category inferred from the first folder under `/shapes`.
   * Example: "speech" for `/shapes/speech/bubble-round.svg`
   */
  category: string;

  /**
   * Public path to the normalized SVG, relative to the site root.
   * Example: "/shapes/speech/bubble-round.svg"
   */
  file: string;

  /**
   * Reserved for future semantic tagging (e.g. "callout", "quote").
   * Always starts empty and can be curated manually later.
   */
  tags: string[];

  /**
   * Reserved for future intent metadata (e.g. "testimonial", "cta").
   * Always starts empty and can be curated manually later.
   */
  intent: string[];
}

/**
 * Default (empty) registry.
 * This will be replaced by a generated array when the normalization
 * script is wired into the build or a separate tooling command.
 */
export const shapesRegistry: ShapeRegistryEntry[] = [];

