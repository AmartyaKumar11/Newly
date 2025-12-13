# AI Output JSON Schema Specification v1.0.0

**Status:** FROZEN - Production Contract  
**Last Updated:** Phase 2.5  
**Version:** 1.0.0

---

## Overview

This document defines the **canonical, production-ready JSON schema** that all AI services must use when communicating with the Newly editor. This schema is a **hard contract** that must be validated before any AI output is accepted.

**This schema is frozen.** Changes require version increment and migration logic.

---

## 1. Canonical AI Output JSON Schema

### Top-Level Structure

```json
{
  "schemaVersion": "1.0.0",
  "blocks": [...],
  "metadata": { ... } // optional
}
```

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | `"1.0.0"` | ✅ Yes | Schema version identifier |
| `blocks` | `AIBlockDefinition[]` | ✅ Yes | Array of blocks to insert (1-50 blocks) |

### Optional Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `metadata` | `object` | ❌ No | Operation metadata for logging |

---

## 2. Block Definition Structure

### Base Block Structure

```json
{
  "type": "text" | "image" | "shape" | "container",
  "content": { ... },
  "tempId": "string",  // optional - for container block references
  "position": { "x": number, "y": number },  // optional
  "size": { "width": number, "height": number }, // optional
  "styles": { ... },  // optional
  "zIndex": number  // optional
}
```

### Type-Specific Content

#### Text Block (`type: "text"`)

```json
{
  "type": "text",
  "content": {
    "text": "Plain text content only",
    "role": "heading" | "paragraph" | "list" | "quote"  // optional hint
  }
}
```

**Constraints:**
- `text`: Plain text only, max 10,000 characters
- No HTML tags
- No Markdown syntax
- Line breaks as `\n`
- No script tags or HTML entities

#### Image Block (`type: "image"`)

```json
{
  "type": "image",
  "content": {
    "src": "https://example.com/image.jpg",
    "alt": "Image description"  // optional, max 200 chars
  }
}
```

**Constraints:**
- `src`: Valid HTTP/HTTPS URL only
- Must be image format (jpg, png, gif, webp, svg)
- No `data:` URIs
- No `javascript:` or other dangerous protocols
- Placeholder format: `https://via.placeholder.com/{width}x{height}`

#### Shape Block (`type: "shape"`)

```json
{
  "type": "shape",
  "content": {
    "shapeType": "rectangle"
  }
}
```

**Constraints:**
- Only `"rectangle"` is supported
- AI cannot request other shapes

#### Container Block (`type: "container"`)

```json
{
  "type": "container",
  "tempId": "container-1",  // optional but recommended for clarity
  "content": {
    "children": ["heading-1", "paragraph-1"]  // References tempId values
  }
}
```

**Constraints:**
- `children`: Array of **tempId** values from blocks in the same response
- Cannot reference blocks from previous AI responses
- Cannot be circular (block A contains B, B contains A)
- All referenced tempIds must exist in the same `blocks` array
- Editor remaps tempId → real block ID during translation
- tempId is discarded after translation and never persisted

**tempId Field:**
- Optional but recommended for blocks that need to be referenced
- Must be unique within a single AI response
- AI-scoped only - never persisted to editor
- Editor generates real IDs and discards tempId

---

## 3. Position and Size Constraints

### Position

```json
{
  "position": {
    "x": number,  // 0 to 600 (CANVAS_WIDTH)
    "y": number   // 0 to 800 (CANVAS_HEIGHT)
  }
}
```

**Rules:**
- If omitted: Editor auto-positions blocks
- If provided: Must be within canvas bounds
- Blocks cannot be positioned outside canvas

### Size

```json
{
  "size": {
    "width": number,   // 50 to 600 (MIN_BLOCK_SIZE to MAX_BLOCK_SIZE)
    "height": number   // 50 to 800
  }
}
```

**Rules:**
- If omitted: Editor uses type-specific defaults
- If provided: Must be within allowed range
- Minimum: 50px (ensures blocks are interactive)
- Maximum: Canvas dimensions

---

## 4. Allowed Styles

AI can only specify these exact style fields. No arbitrary CSS.

### Common Styles

```json
{
  "styles": {
    "backgroundColor": "#ffffff",  // Hex color only
    "borderColor": "#000000",      // Hex color only
    "borderWidth": 1,              // 0-10 pixels
    "borderRadius": 4,             // 0-50 pixels
    "opacity": 1.0                 // 0.0-1.0
  }
}
```

### Text-Specific Styles

```json
{
  "styles": {
    "fontSize": 16,                // 8-72 pixels
    "fontWeight": "bold",          // "normal" | "bold" | "300" | "500" | "600" | "700"
    "fontFamily": "Arial",         // Must be from explicit allowlist (see below)
    "color": "#000000",            // Hex color only
    "textAlign": "center"          // "left" | "center" | "right" | "justify"
  }
}
```

**fontFamily Allowlist:**
- `"system-ui"` - System default font
- `"Arial"`
- `"Helvetica"`
- `"Times New Roman"`
- `"Georgia"`
- `"Courier New"`
- `"Verdana"`

**Validation:** Any font not in this list is rejected (soft failure - style ignored).  
**Rationale:** Custom fonts are not supported in Phase 3. Font extensibility will be added in later phases. This ensures consistent rendering across all platforms.

### Image-Specific Styles

```json
{
  "styles": {
    "objectFit": "cover"  // "cover" | "contain" | "fill" | "none"
  }
}
```

**Forbidden:**
- HTML attributes
- Inline CSS
- Custom CSS properties
- JavaScript
- Any styling not explicitly listed above

---

## 5. Field Semantics and Defaults

### `schemaVersion`

**What it represents:** Contract version between AI and editor  
**How editor interprets:** Validates compatibility, applies appropriate validation rules  
**Default if missing:** ❌ **HARD FAIL** - Output rejected  
**Allowed values:** `"1.0.0"` (current version)

### `blocks` Array

**What it represents:** Blocks to insert into editor  
**How editor interprets:** Each block is validated and inserted as a single undoable operation  
**Default if missing:** ❌ **HARD FAIL** - Output rejected  
**Constraints:** 1-50 blocks per response

### `content.text` (Text Blocks)

**What it represents:** Plain text content to display  
**How editor interprets:** Rendered as-is, line breaks preserved  
**Default if missing:** ❌ **HARD FAIL** - Text block must have text  
**Constraints:** Max 10,000 characters, plain text only

### `content.src` (Image Blocks)

**What it represents:** Image source URL  
**How editor interprets:** Loaded and displayed as image  
**Default if missing:** ❌ **HARD FAIL** - Image block must have src  
**Constraints:** Valid HTTP/HTTPS URL, image format only

### `tempId`

**What it represents:** Temporary identifier for container block references  
**How editor interprets:** Used to resolve container.children relationships, then discarded  
**Default if missing:** ✅ Optional - only needed if block is referenced by a container  
**Constraints:** Must be unique within a single AI response, non-empty string  
**CRITICAL:** tempId is AI-scoped and never persisted. Editor remaps to real IDs during translation.

### `position`

**What it represents:** Block position on canvas  
**How editor interprets:** Absolute positioning in pixels  
**Default if missing:** ✅ Editor auto-positions (stacks blocks vertically)  
**Constraints:** Must be within canvas bounds (0-600 x, 0-800 y)  
**Overflow Check:** When both position and size are present, must satisfy: `x + width <= 600` and `y + height <= 800`

### `size`

**What it represents:** Block dimensions  
**How editor interprets:** Width and height in pixels  
**Default if missing:** ✅ Editor uses type-specific defaults:
- Text: 200x100
- Image: 200x200
- Shape: 200x100
- Container: 200x200

**Constraints:** 50-600 width, 50-800 height

### `styles`

**What it represents:** Visual styling for the block  
**How editor interprets:** Applied to block's style object  
**Default if missing:** ✅ Editor uses type-specific defaults  
**Invalid values:** Ignored (soft failure)

### `zIndex`

**What it represents:** Layering order  
**How editor interprets:** Higher values appear on top  
**Default if missing:** ✅ Editor assigns automatically (increments from existing blocks)  
**Constraints:** 1-1000

---

## 6. Invalid Output Rules

### Hard Failures (Complete Rejection)

These conditions cause the **entire AI output to be rejected**:

1. **Missing or invalid `schemaVersion`**
   - Must be exactly `"1.0.0"`
   - Future versions will be rejected until migration logic is added

2. **Missing or empty `blocks` array**
   - Must contain at least 1 block
   - Maximum 50 blocks

3. **Invalid block type**
   - Must be one of: `"text"`, `"image"`, `"shape"`, `"container"`
   - Any other type is rejected

4. **Position outside canvas bounds**
   - `x` must be 0-600
   - `y` must be 0-800
   - Blocks outside bounds are rejected

5. **Size outside allowed range**
   - Width: 50-600
   - Height: 50-800
   - Below minimum: rejected
   - Above maximum: clamped (soft failure)

6. **Block overflows canvas**
   - When both `position` and `size` are present:
     - `x + width > CANVAS_WIDTH (600)` → rejected
     - `y + height > CANVAS_HEIGHT (800)` → rejected
   - If either position or size is missing, editor auto-resolves (no overflow check)
   - Prevents blocks from being partially or fully invisible

7. **Contains HTML tags**
   - Any HTML tags in text content: rejected
   - Security risk

8. **Contains scripts**
   - `<script>` tags: rejected
   - `javascript:` URLs: rejected
   - Security risk

9. **Contains Markdown**
   - Markdown syntax in text: rejected
   - Editor expects plain text only

10. **Invalid URL format**
    - Non-HTTP/HTTPS URLs: rejected
    - Invalid URL syntax: rejected

11. **Invalid container children**
    - References non-existent tempIds: rejected
    - Circular references: rejected
    - Duplicate tempIds in same response: rejected

12. **Invalid fontFamily**
    - Font not in explicit allowlist: rejected (soft failure - style ignored)
    - Allowed: "system-ui", "Arial", "Helvetica", "Times New Roman", "Georgia", "Courier New", "Verdana"

### Soft Failures (Partial Acceptance)

These conditions cause **partial acceptance with fixes**:

1. **Missing position**
   - ✅ Editor auto-positions blocks
   - Blocks stacked vertically with spacing

2. **Missing size**
   - ✅ Editor uses type-specific defaults
   - No error, operation continues

3. **Invalid style value**
   - ✅ Invalid style field is ignored
   - Other valid styles are applied
   - Example: `fontSize: 200` → ignored (max is 72)

4. **Text too long**
   - ✅ Text truncated to 10,000 characters
   - Warning logged

5. **Missing alt text**
   - ✅ Default alt text applied: "Image"
   - Warning logged

---

## 7. Versioning Strategy

### Current Version: `1.0.0`

### Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (incompatible with previous versions)
- **MINOR**: New optional fields (backward compatible)
- **PATCH**: Bug fixes, clarifications (backward compatible)

### Forward Compatibility Rules

- Editor must reject unknown major versions
- Editor must accept known major versions with unknown minor/patch
- Unknown optional fields are ignored (soft failure)
- Unknown required fields cause hard failure

### Backward Compatibility Expectations

- Old schema versions must be supported via migration
- Migration logic converts old format to current format
- If migration fails, output is rejected

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Phase 2.5 | Initial frozen schema |

---

## 8. Safety Constraints

### Explicitly Forbidden

1. **HTML**
   - No HTML tags in text content
   - No HTML attributes
   - No HTML entities (use plain text)

2. **Scripts**
   - No `<script>` tags
   - No `javascript:` URLs
   - No event handlers
   - No inline JavaScript

3. **Markdown**
   - No Markdown syntax
   - No `#` headings
   - No `**bold**` or `*italic*`
   - Plain text only

4. **Inline Styling Beyond Allowed Fields**
   - No `style` attributes
   - No custom CSS properties
   - Only fields listed in `AIBlockStyles` interface

5. **Arbitrary Layout Instructions**
   - No flexbox directives
   - No grid instructions
   - No positioning hints beyond `position` field
   - Editor handles layout

6. **External URLs Except Image Placeholders**
   - Image `src` must be valid image URL
   - No links in text content
   - No iframes
   - No embedded content

### Security Considerations

- All URLs validated before use
- No data URIs (XSS risk)
- No protocol handlers except HTTP/HTTPS
- Text content sanitized (HTML stripped)
- No executable code paths

---

## 9. Example Outputs

### Valid Example

```json
{
  "schemaVersion": "1.0.0",
  "blocks": [
    {
      "type": "text",
      "tempId": "heading-1",
      "content": {
        "text": "Welcome to Our Newsletter",
        "role": "heading"
      },
      "position": { "x": 50, "y": 50 },
      "size": { "width": 500, "height": 60 },
      "styles": {
        "fontSize": 32,
        "fontWeight": "bold",
        "color": "#000000",
        "textAlign": "center",
        "fontFamily": "Arial"
      }
    },
    {
      "type": "text",
      "tempId": "paragraph-1",
      "content": {
        "text": "This is a paragraph of text that will be displayed in the newsletter.",
        "role": "paragraph"
      },
      "position": { "x": 50, "y": 130 },
      "size": { "width": 500, "height": 100 },
      "styles": {
        "fontSize": 16,
        "color": "#333333",
        "textAlign": "left",
        "fontFamily": "system-ui"
      }
    },
    {
      "type": "image",
      "tempId": "image-1",
      "content": {
        "src": "https://via.placeholder.com/500x300",
        "alt": "Newsletter image"
      },
      "position": { "x": 50, "y": 250 },
      "size": { "width": 500, "height": 300 },
      "styles": {
        "borderRadius": 8
      }
    },
    {
      "type": "container",
      "tempId": "section-1",
      "content": {
        "children": ["heading-1", "paragraph-1", "image-1"]
      },
      "position": { "x": 50, "y": 50 },
      "size": { "width": 500, "height": 500 }
    }
  ],
  "metadata": {
    "operation": "generate_content",
    "description": "Generated newsletter header section with container"
  }
}
```

**Why this is valid:**
- ✅ Correct schema version
- ✅ Valid block types
- ✅ Positions within canvas bounds
- ✅ Sizes within allowed range
- ✅ No overflow (x + width = 550 <= 600, y + height = 750 <= 800)
- ✅ All tempIds are unique
- ✅ Container children reference valid tempIds
- ✅ Plain text only (no HTML/Markdown)
- ✅ Valid image URL
- ✅ All styles are allowed fields
- ✅ fontFamily values are from allowlist
- ✅ Style values within constraints

### Invalid Example

```json
{
  "schemaVersion": "1.0.0",
  "blocks": [
    {
      "type": "text",
      "content": {
        "text": "<h1>Welcome</h1><script>alert('xss')</script>"
      },
      "position": { "x": 1000, "y": 1000 },
      "size": { "width": 10, "height": 10 },
      "styles": {
        "fontSize": 200,
        "fontFamily": "Comic Sans",
        "customCSS": "display: flex"
      }
    },
    {
      "type": "text",
      "content": {
        "text": "This block overflows"
      },
      "position": { "x": 550, "y": 50 },
      "size": { "width": 100, "height": 50 }
    },
    {
      "type": "custom",
      "content": {}
    },
    {
      "type": "image",
      "content": {
        "src": "javascript:alert('xss')"
      }
    },
    {
      "type": "container",
      "content": {
        "children": ["missing-block"]
      }
    }
  ]
}
```

**Why this is invalid:**

1. **HTML and Scripts in text** ❌
   - Contains `<h1>` tag
   - Contains `<script>` tag
   - **HARD FAIL** - Security risk

2. **Position out of bounds** ❌
   - `x: 1000` exceeds canvas width (600)
   - `y: 1000` exceeds canvas height (800)
   - **HARD FAIL** - Blocks would be invisible

3. **Size below minimum** ❌
   - `width: 10` below minimum (50)
   - `height: 10` below minimum (50)
   - **HARD FAIL** - Blocks too small to interact

4. **Block overflows canvas** ❌
   - `x: 550` + `width: 100` = 650 > CANVAS_WIDTH (600)
   - **HARD FAIL** - Block would be partially invisible

5. **Invalid font size** ❌
   - `fontSize: 200` exceeds maximum (72)
   - **SOFT FAIL** - Style ignored, but block still rejected due to other errors

6. **Invalid font family** ❌
   - `fontFamily: "Comic Sans"` not in allowlist
   - **SOFT FAIL** - Style ignored, but block still rejected

7. **Custom CSS property** ❌
   - `customCSS` not in allowed styles
   - **SOFT FAIL** - Ignored, but block still rejected

8. **Invalid block type** ❌
   - `type: "custom"` not allowed
   - **HARD FAIL** - Editor doesn't support this type

9. **Dangerous URL** ❌
   - `javascript:` protocol is security risk
   - **HARD FAIL** - Could execute code

10. **Invalid container children** ❌
    - References non-existent tempId "missing-block"
    - **HARD FAIL** - Cannot resolve container relationships

**Result:** Entire output rejected due to multiple hard failures.

---

## 10. Validation Checklist

Before accepting any AI output, validate:

- [ ] `schemaVersion` is `"1.0.0"`
- [ ] `blocks` array exists and has 1-50 items
- [ ] Each block has valid `type`
- [ ] Each block has valid `content` for its type
- [ ] All positions are within canvas bounds (0-600 x, 0-800 y)
- [ ] All sizes are within range (50-600 width, 50-800 height)
- [ ] No blocks overflow canvas (x + width <= 600, y + height <= 800) when both position and size are present
- [ ] All tempIds are unique within the response
- [ ] No HTML tags in text content
- [ ] No scripts or dangerous URLs
- [ ] No Markdown syntax
- [ ] All style fields are allowed
- [ ] All style values are within constraints
- [ ] fontFamily is from explicit allowlist (if provided)
- [ ] Container children reference valid tempIds from same response
- [ ] No circular container references

---

## 11. Implementation Notes

### Translation Layer

The AI output must be translated to editor `Block` format:

1. Validate schema (including tempId uniqueness and container references)
2. Generate unique real IDs for all blocks
3. Build tempId → real ID mapping
4. Remap container.children from tempIds to real IDs
5. Discard all tempIds (never persist to editor)
6. Apply defaults for missing fields
7. Convert to `Block[]` format
8. Insert using `insertBlocksFromAI()` (groups as one undo operation)

**Critical:** tempId must never leave the translation layer. Editor only works with real block IDs.

### Error Handling

- Hard failures: Reject entire output, return error to user
- Soft failures: Log warnings, apply fixes, continue
- Always log validation results for debugging

### Testing

- Test with valid examples
- Test with invalid examples (must be rejected)
- Test edge cases (boundary values, empty strings, etc.)
- Test version compatibility

---

## 12. Future Considerations

### Potential Schema Evolution

Future versions may add:
- New optional block types (with migration)
- New optional style fields
- New optional metadata fields

**Never:**
- Remove required fields
- Change field types
- Break backward compatibility without migration

---

## Document Status

**This schema is FROZEN for Phase 3.**

Any changes require:
1. Version increment
2. Migration logic
3. Updated validation
4. Backward compatibility testing
5. Documentation update

**Do not modify this schema without explicit approval.**

---

End of Specification
