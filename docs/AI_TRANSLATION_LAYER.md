# AI → Editor Translation Layer

**Status:** ✅ Complete  
**Version:** 1.0.0  
**Date:** Phase 3

---

## Overview

The AI → Editor Translation Layer is a **pure, deterministic** translation system that converts validated AI output into editor-ready blocks. This layer is the **ONLY gateway** through which AI output may affect editor state.

## Core Principles

- ✅ **No UI logic** - Pure data transformation
- ✅ **No Gemini or LLM calls** - Translation only
- ✅ **No editor state mutation** - Produces data only
- ✅ **Deterministic behavior** - Same input = same output
- ✅ **Fully undoable** - Output suitable for single undo group
- ✅ **Schema-first validation** - Strict enforcement of AIOutputSchema v1.0.0

## Architecture

### Main Entry Point

```typescript
translateAIOutputToEditorBlocks(
  input: unknown,
  existingBlocks?: Block[]
): TranslationResult
```

This is the **ONLY function** that should be called from outside this module.

### Translation Pipeline

1. **Strict Validation** (`validateAIOutputStrict`)
   - Schema version check
   - Block type validation
   - Position/size bounds checking
   - Block overflow detection
   - HTML/script/markdown detection
   - URL validation
   - Container reference validation
   - Hard failures → reject entire output

2. **Normalization** (`normalizeAIBlocks`)
   - Text truncation (max 10,000 chars)
   - Alt text defaults
   - Style value clamping
   - Font family allowlist enforcement
   - Soft failures → fix and continue

3. **tempId Mapping** (`buildTempIdMapping`)
   - Builds tempId → index mapping for validation
   - Actual ID generation happens during translation

4. **Default Application** (`applyDefaults`)
   - Auto-positioning (vertical stacking)
   - Default sizes by block type
   - Default styles by block type
   - zIndex calculation from existing blocks

5. **Translation** (`translateToEditorBlocks`)
   - Generate real editor block IDs
   - Resolve tempId → realId for containers
   - Convert AI block format to editor Block format
   - Create blocks in correct order (non-containers first, then containers)

## Validation Rules

### Hard Failures (Reject Entire Output)

- Invalid or missing `schemaVersion`
- Missing or empty `blocks` array
- Too many blocks (>50) or too few (<1)
- Invalid block type
- Position outside canvas bounds
- Size outside allowed range
- Block overflow (x + width > 600 or y + height > 800)
- HTML tags in text content
- Scripts or dangerous protocols
- Markdown syntax
- Invalid URLs
- Invalid container child references
- Circular container references

### Soft Failures (Normalize and Continue)

- Missing position → auto-position
- Missing size → apply type-specific defaults
- Invalid style value → clamp or ignore
- Text too long → truncate
- Missing alt text → apply default
- Invalid fontFamily → ignore style

## Container Handling

**Critical:** Containers use `tempId` values to reference children.

**Process:**
1. AI outputs blocks with optional `tempId` fields
2. Container `children` array references `tempId` values
3. Translation layer:
   - Generates real editor block IDs
   - Builds `tempId → realId` mapping
   - Resolves container children from tempIds to real IDs
   - Discards all tempIds (never persisted)

**Example:**
```json
// AI Output
{
  "blocks": [
    { "tempId": "heading-1", "type": "text", ... },
    { "tempId": "content-1", "type": "text", ... },
    { "type": "container", "content": { "children": ["heading-1", "content-1"] } }
  ]
}

// After Translation
[
  { "id": "block-123", "type": "text", ... },
  { "id": "block-456", "type": "text", ... },
  { "id": "block-789", "type": "container", "children": ["block-123", "block-456"] }
]
```

## Default Values

### Position
- **Missing:** Auto-positioned vertically starting at (50, 50)
- **Spacing:** 20px between auto-positioned blocks
- **Provided:** Used as-is (validated for bounds)

### Size (by type)
- **Text:** 200x100
- **Image:** 200x200
- **Shape:** 200x100
- **Container:** 200x200

### Styles (by type)
- **Text:** fontSize: 16, fontWeight: "normal", color: "#000000", textAlign: "left", fontFamily: "system-ui"
- **Image:** objectFit: "cover", borderRadius: 0
- **Shape:** backgroundColor: "#e5e7eb", borderColor: "#d1d5db", borderWidth: 1
- **Container:** backgroundColor: "transparent", borderWidth: 0

### zIndex
- **Missing:** Calculated from existing blocks (max + 1, +2, ...)
- **Provided:** Used as-is (clamped to 1-1000)

## Usage

### From React Components

```typescript
import { insertBlocksFromAI } from "@/utils/aiBlockHelpers";
import type { AIOutputSchema } from "@/types/aiOutputSchema";

// AI output from gateway
const aiOutput: AIOutputSchema = {
  schemaVersion: "1.0.0",
  blocks: [...]
};

// Insert blocks (automatically grouped as one undo operation)
const result = insertBlocksFromAI(aiOutput);

if (!result.success) {
  console.error("Translation failed:", result.errors);
} else if (result.warnings) {
  console.warn("Translation warnings:", result.warnings);
}
```

### Direct Translation (Advanced)

```typescript
import { translateAIOutputToEditorBlocks } from "@/utils/aiTranslation";
import { useEditorStateStore } from "@/stores/editorStateStore";

const store = useEditorStateStore.getState();
const existingBlocks = store.blocks;

const result = translateAIOutputToEditorBlocks(aiOutput, existingBlocks);

if (result.success && result.blocks) {
  // Manually insert blocks with undo grouping
  store.startActionGroup();
  result.blocks.forEach(block => store.addBlock(block));
  store.endActionGroup();
}
```

## Safety Guarantees

1. **No Side Effects** - Translation layer never mutates editor state
2. **Deterministic** - Same input always produces same output
3. **Type Safe** - Full TypeScript type checking
4. **Validated** - All output guaranteed to be schema-compliant
5. **Isolated** - No dependencies on UI, React, or editor stores
6. **Testable** - Can be unit tested without React or browser

## Error Handling

### TranslationResult

```typescript
interface TranslationResult {
  success: boolean;
  blocks?: Block[];        // Only present if success === true
  errors?: TranslationError[];   // Hard failures
  warnings?: TranslationError[];  // Soft failures (normalized)
}
```

### Error Types

- **Hard failures:** Entire output rejected, `success: false`, `errors` populated
- **Soft failures:** Output accepted with fixes, `success: true`, `warnings` populated

## Testing

The translation layer is designed to be fully testable:

```typescript
import { translateAIOutputToEditorBlocks } from "@/utils/aiTranslation";

// Test valid input
const validInput = { schemaVersion: "1.0.0", blocks: [...] };
const result = translateAIOutputToEditorBlocks(validInput);
expect(result.success).toBe(true);
expect(result.blocks).toBeDefined();

// Test invalid input
const invalidInput = { schemaVersion: "2.0.0", blocks: [] };
const result2 = translateAIOutputToEditorBlocks(invalidInput);
expect(result2.success).toBe(false);
expect(result2.errors).toBeDefined();
```

## Files

- `src/utils/aiTranslation.ts` - Translation layer implementation
- `src/utils/aiBlockHelpers.ts` - React integration helpers
- `src/types/aiOutputSchema.ts` - AI schema definitions (FROZEN v1.0.0)
- `src/types/blocks.ts` - Editor block type definitions

## Dependencies

- **Input:** `AIOutputSchema` from `@/types/aiOutputSchema`
- **Output:** `Block[]` from `@/types/blocks`
- **No other dependencies** - Pure TypeScript, no React, no UI, no stores

---

**This layer protects the editor from AI bugs and ensures undo/redo reliability.**
