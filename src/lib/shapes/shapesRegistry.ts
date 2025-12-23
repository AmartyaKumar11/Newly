/**
 * Shape registry
 *
 * NOTE:
 * - This file is intended to be **auto-generated** by `scripts/normalize-svgs.ts`.
 * - The initial version is an empty registry so the app can compile.
 * - Running the normalization script should overwrite this file with
 *   a deterministic list of shapes discovered under `/public/shapes`.
 *
 * TAGGING & INTENT (MANUAL ONLY):
 * - The normalization script is responsible ONLY for discovering shapes
 *   and wiring up `id`, `category`, and `file`.
 * - The `tags` and `intent` arrays are intentionally left empty by the
 *   generator so that humans can curate them over time.
 * - DO NOT attempt to auto-generate or infer tags/intent in tooling or AI.
 *   These fields should reflect deliberate design decisions.
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
   *
   * TODO (manual curation):
   * - For frequently used shapes, add 3–5 short, lowercase tags that
   *   describe their visual role or semantics (e.g. "speech", "bubble",
   *   "callout").
   * - Keep tags stable over time to avoid breaking any future search
   *   or filtering that relies on them.
   */
  tags: string[];

  /**
   * Reserved for future intent metadata (e.g. "testimonial", "cta").
   * Always starts empty and can be curated manually later.
   *
   * TODO (manual curation):
   * - Use `intent` to describe *where* or *why* a shape should be used,
   *   not what it looks like (e.g. "testimonial", "feature-grid",
   *   "pricing-highlight").
   * - Keep this list small and opinionated; avoid duplicating visual
   *   tags here.
   */
  intent: string[];
}

/**
 * Default (empty) registry.
 * This will be replaced by a generated array when the normalization
 * script is wired into the build or a separate tooling command.
 */
export const shapesRegistry: ShapeRegistryEntry[] = [];

