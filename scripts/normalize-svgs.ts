/**
 * SVG Normalization Pipeline (Skeleton)
 *
 * Purpose:
 * - Read raw, untrusted SVG files from `/raw-svgs`
 * - Normalize and sanitize them using SVGO
 * - Emit safe, production-ready SVGs into `/public/shapes`
 *
 * Design constraints:
 * - This script is **build-time tooling only**, not used at runtime
 * - It should be safe to run locally or in CI without touching editor logic
 * - Normalized output is the *only* SVGs that the editor will eventually consume
 *
 * NOTE:
 * - This file currently contains only path helpers and placeholders.
 * - No filesystem or SVGO logic has been implemented yet.
 * - Do NOT import this file from the editor or API code.
 */

import * as path from "path";
import fg from "fast-glob";
import fs from "fs-extra";
import { optimize } from "svgo";

import type { ShapeRegistryEntry } from "@/lib/shapes/shapesRegistry";

// Placeholder configuration for future implementation
interface NormalizeSvgsOptions {
  /**
   * Source directory for raw, untrusted SVGs.
   * Defaults to `<repoRoot>/raw-svgs`.
   */
  inputDir?: string;

  /**
   * Target directory for normalized, safe SVGs.
   * Defaults to `<repoRoot>/public/shapes`.
   */
  outputDir?: string;
}

const RAW_SVGS_ROOT = "raw-svgs";
const NORMALIZED_SVGS_ROOT = path.join("public", "shapes");

/**
 * Convert an arbitrary file name (with or without extension) to kebab-case.
 *
 * Rules:
 * - Lowercase
 * - Non-alphanumeric characters become `-`
 * - Multiple `-` collapse into a single `-`
 * - Leading/trailing `-` are trimmed
 */
export function toKebabCaseFileName(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  const kebab = withoutExt
    .replace(/[_\s]+/g, "-") // spaces/underscores -> dash
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // camelCase -> camel-case
    .replace(/[^a-zA-Z0-9-]+/g, "-") // other punctuation -> dash
    .toLowerCase()
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes;

  // Always return something sensible
  return kebab.length > 0 ? `${kebab}.svg` : "shape.svg";
}

/**
 * Given a raw SVG path under `/raw-svgs`, compute the normalized output path
 * under `/public/shapes`, preserving the relative folder structure and
 * enforcing kebab-case file names.
 *
 * Examples:
 * - raw-svgs/speech/bubble-round.svg -> public/shapes/speech/bubble-round.svg
 * - raw-svgs/icons/Social/Facebook Logo.svg -> public/shapes/icons/social/facebook-logo.svg
 */
export function getNormalizedOutputPath(
  rawSvgPath: string,
  options: NormalizeSvgsOptions = {},
): string {
  const inputRoot = path.resolve(process.cwd(), options.inputDir ?? RAW_SVGS_ROOT);
  const outputRoot = path.resolve(process.cwd(), options.outputDir ?? NORMALIZED_SVGS_ROOT);

  // Relative path from the raw SVG root, e.g. "speech/bubble-round.svg"
  const relative = path.relative(inputRoot, path.resolve(rawSvgPath));

  // Split into directory (category/subfolders) and file name
  const dir = path.dirname(relative); // "" | "speech" | "icons/social"
  const baseName = path.basename(relative);

  const normalizedFileName = toKebabCaseFileName(baseName);

  // Join output root, dir (if any), and normalized file name
  const targetDir = dir === "." ? "" : dir;
  const outputPath = targetDir
    ? path.join(outputRoot, targetDir, normalizedFileName)
    : path.join(outputRoot, normalizedFileName);

  return outputPath;
}

/**
 * Entry point for the SVG normalization pipeline.
 *
 * Responsibilities:
 * - Discover SVG files under `inputDir`
 * - Normalize them with SVGO into deterministic kebab-case paths
 * - Generate a deterministic shape registry file under
 *   `src/lib/shapes/shapesRegistry.ts`
 */
export async function normalizeSvgs(options: NormalizeSvgsOptions = {}): Promise<void> {
  const inputRoot = path.resolve(process.cwd(), options.inputDir ?? RAW_SVGS_ROOT);
  const outputRoot = path.resolve(process.cwd(), options.outputDir ?? NORMALIZED_SVGS_ROOT);

  // Discover all raw SVGs
  const rawFiles = await findRawSvgFiles(inputRoot);

  const registryEntries: ShapeRegistryEntry[] = [];

  for (const rawFile of rawFiles) {
    const outputPath = getNormalizedOutputPath(rawFile, options);

    // Ensure output directory exists
    await ensureOutputDir(path.dirname(outputPath));

    // Normalize the SVG into the target path
    await normalizeSingleSvg(rawFile, outputPath);

    // Derive registry entry from the final output path
    const entry = buildRegistryEntryFromOutput(outputPath, outputRoot);
    registryEntries.push(entry);
  }

  // Write a deterministic, overwrite-safe registry
  await writeShapesRegistry(registryEntries);
}

/**
 * Discover all raw SVG files under the given input root.
 */
async function findRawSvgFiles(inputDir: string): Promise<string[]> {
  const files = await fg("**/*.svg", {
    cwd: inputDir,
    absolute: true,
    dot: false,
  });
  return files.sort();
}

/**
 * Normalize a single SVG asset using SVGO and write it to the output path.
 * This is intentionally conservative; we can tune the SVGO config over time.
 */
async function normalizeSingleSvg(inputPath: string, outputPath: string): Promise<void> {
  const rawSvg = await fs.readFile(inputPath, "utf8");

  const result = optimize(rawSvg, {
    path: inputPath,
    // Minimal, safe baseline config; can be extended later.
    plugins: [
      "preset-default",
      {
        name: "removeDimensions",
        active: false,
      },
    ],
  });

  const normalizedSvg = "data" in result ? result.data : String(result);
  await fs.writeFile(outputPath, normalizedSvg, "utf8");
}

/**
 * Ensure the output directory structure exists.
 */
async function ensureOutputDir(outputDir: string): Promise<void> {
  await fs.ensureDir(outputDir);
}

/**
 * Build a ShapeRegistryEntry from an absolute output path under `public/shapes`.
 *
 * Example:
 * - outputRoot: /repo/public/shapes
 * - outputPath: /repo/public/shapes/speech/bubble-round.svg
 *
 * => id: "speech/bubble-round"
 *    category: "speech"
 *    file: "/shapes/speech/bubble-round.svg"
 */
function buildRegistryEntryFromOutput(
  outputPath: string,
  outputRoot: string,
): ShapeRegistryEntry {
  const relFromShapes = path.relative(outputRoot, outputPath).replace(/\\/g, "/");
  // relFromShapes e.g. "speech/bubble-round.svg" or "icons/social/facebook.svg"

  const parts = relFromShapes.split("/");
  const category = parts[0] || "uncategorized";

  const withoutExt = relFromShapes.replace(/\.svg$/i, "");
  const id = withoutExt; // includes category + nested folders

  const file = `/shapes/${relFromShapes}`;

  return {
    id,
    category,
    file,
    tags: [],
    intent: [],
  };
}

/**
 * Write the shapes registry file in a deterministic, overwrite-safe way.
 */
async function writeShapesRegistry(entries: ShapeRegistryEntry[]): Promise<void> {
  // Deduplicate by id and sort for determinism
  const byId = new Map<string, ShapeRegistryEntry>();
  for (const entry of entries) {
    byId.set(entry.id, entry);
  }

  const sorted = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));

  const registryPath = path.resolve(
    process.cwd(),
    "src",
    "lib",
    "shapes",
    "shapesRegistry.ts",
  );

  const header = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT BY HAND.
 * Generated by scripts/normalize-svgs.ts
 */

export interface ShapeRegistryEntry {
  id: string;
  category: string;
  file: string;
  tags: string[];
  intent: string[];
}

export const shapesRegistry: ShapeRegistryEntry[] = [
`;

  const body = sorted
    .map((entry) => {
      const safeId = entry.id.replace(/"/g, '\\"');
      const safeCategory = entry.category.replace(/"/g, '\\"');
      const safeFile = entry.file.replace(/"/g, '\\"');
      return `  {\n    id: "${safeId}",\n    category: "${safeCategory}",\n    file: "${safeFile}",\n    tags: [],\n    intent: [],\n  },`;
    })
    .join("\n");

  const footer = `
];
`;

  const content = `${header}${body}${sorted.length ? "\n" : ""}${footer}`;

  await fs.writeFile(registryPath, content, "utf8");
}


