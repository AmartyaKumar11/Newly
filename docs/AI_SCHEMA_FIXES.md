# AI Output Schema Fixes - Phase 2.5

**Date:** Phase 2.5  
**Status:** Applied to v1.0.0

---

## Summary

Three critical fixes have been applied to the AI Output JSON Schema:

1. ✅ **P0 FIX:** Added tempId support for container blocks
2. ✅ **P0 FIX:** Enforced block overflow validation
3. ✅ **P1 FIX:** Restricted fontFamily to explicit allowlist

All fixes maintain backward compatibility and do not require schema version increment (they are clarifications and safety improvements to v1.0.0).

---

## Fix 1: tempId Support for Container Blocks (P0)

### Problem
Container blocks needed to reference child blocks, but AI blocks had no IDs, making references ambiguous and unsafe.

### Solution
- Added optional `tempId?: string` field to `AIBlockDefinition`
- Updated `AIContainerContent.children` to reference tempId values (not editor IDs)
- Documented that editor remaps tempId → real block ID during translation
- tempId is AI-scoped and never persisted

### Changes
- `AIBlockDefinition.tempId?: string` - Optional temporary identifier
- `AIContainerContent.children` - Now references tempIds, not editor IDs
- Validation rule: `duplicateTempId` - All tempIds must be unique within response
- Validation rule: `invalidContainerChildren` - Updated to check tempId references

### Example

**Before (Ambiguous):**
```json
{
  "type": "container",
  "content": {
    "children": ["???"]  // What ID? Blocks don't have IDs yet!
  }
}
```

**After (Clear):**
```json
{
  "type": "text",
  "tempId": "heading-1",
  "content": { "text": "Heading" }
},
{
  "type": "container",
  "content": {
    "children": ["heading-1"]  // References tempId
  }
}
```

**Translation Process:**
1. Editor validates tempIds exist
2. Editor generates real IDs: `heading-1` → `block-123`
3. Editor remaps container: `children: ["block-123"]`
4. tempId discarded, never persisted

---

## Fix 2: Block Overflow Validation (P0)

### Problem
Blocks could have valid position and size individually, but overflow the canvas when combined (e.g., x=550, width=100 → 650 > 600).

### Solution
- Added hard validation rule: `blockOverflowsCanvas`
- Validates: `x + width <= CANVAS_WIDTH` and `y + height <= CANVAS_HEIGHT`
- Only applies when both position AND size are present
- If either is missing, editor auto-resolves (existing behavior)

### Changes
- New validation rule in `ValidationRules.hardFailures.blockOverflowsCanvas`
- Updated documentation with overflow check requirements
- Added to validation checklist

### Example

**Invalid (Overflows):**
```json
{
  "position": { "x": 550, "y": 50 },  // Valid
  "size": { "width": 100, "height": 50 }  // Valid
  // But: 550 + 100 = 650 > 600 → REJECTED
}
```

**Valid (No Overflow):**
```json
{
  "position": { "x": 500, "y": 50 },
  "size": { "width": 100, "height": 50 }
  // 500 + 100 = 600 <= 600 → ACCEPTED
}
```

---

## Fix 3: fontFamily Allowlist (P1)

### Problem
`fontFamily?: string` with comment "system fonts only" was ambiguous and unenforceable, causing inconsistency.

### Solution
- Replaced `string` with explicit union type
- Defined strict allowlist: `"system-ui" | "Arial" | "Helvetica" | "Times New Roman" | "Georgia" | "Courier New" | "Verdana"`
- Any font not in allowlist is rejected (soft failure - style ignored)
- Documented that custom fonts will come in later phases

### Changes
- `AIBlockStyles.fontFamily` - Now union type instead of `string`
- Updated validation rules
- Updated documentation with explicit allowlist

### Example

**Invalid:**
```json
{
  "styles": {
    "fontFamily": "Comic Sans"  // Not in allowlist → IGNORED
  }
}
```

**Valid:**
```json
{
  "styles": {
    "fontFamily": "Arial"  // In allowlist → ACCEPTED
  }
}
```

---

## Validation Updates

### New Hard Failures
- `blockOverflowsCanvas` - Block exceeds canvas when position + size provided
- `duplicateTempId` - Multiple blocks with same tempId in response
- `invalidContainerChildren` - Updated to check tempId references (not editor IDs)

### Updated Soft Failures
- `invalidStyle` - Now includes invalid fontFamily (not in allowlist)

---

## Backward Compatibility

All fixes are backward compatible:
- `tempId` is optional - existing schemas without it still work
- Overflow check only applies when both position and size are present
- fontFamily restriction only affects validation, not existing data

No schema version increment required.

---

## Files Modified

1. `src/types/aiOutputSchema.ts` - TypeScript definitions
2. `docs/AI_OUTPUT_SCHEMA.md` - Specification document

---

## Testing Requirements

Before Phase 3, validate:
- [ ] Container blocks can reference children via tempId
- [ ] tempId uniqueness is enforced
- [ ] Overflow validation rejects blocks that exceed canvas
- [ ] fontFamily allowlist rejects invalid fonts
- [ ] Translation layer correctly remaps tempId → real ID
- [ ] tempId is never persisted to editor

---

End of Fixes Documentation
