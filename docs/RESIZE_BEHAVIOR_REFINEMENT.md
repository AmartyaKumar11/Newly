# Phase 3.3.6 — Editing Behavior Refinement (Canva-Grade)

## Overview

Refined resize and manipulation behavior to match professional design tools like Canva, with block-type-specific rules and proper undo/redo safety.

## Implementation Summary

### 1. Block-Type-Specific Resize Logic (`src/utils/blockResize.ts`)

**Purpose**: Pure utility functions for calculating resize results based on block type.

**Key Functions**:
- `calculateResize(params)`: Main entry point, routes to block-type-specific logic
- `resizeImageBlock(params)`: Image-specific resize with aspect ratio preservation
- `resizeTextBlock(params)`: Text-specific resize (free, no aspect ratio)
- `resizeShapeBlock(params)`: Shape-specific resize (free, no aspect ratio)

**Block-Type Rules**:

#### Text Blocks
- ✅ Free horizontal resize
- ✅ Free vertical resize
- ✅ No aspect ratio logic
- ✅ **Font size NEVER changes** (only container size)
- ✅ Text reflows naturally within container

#### Image Blocks
- ✅ Corner handles: Preserve aspect ratio by default
- ✅ Edge handles: Free resize (one axis only)
- ✅ Modifier key (Shift): Allows free resize on corners
- ✅ Aspect ratio calculated from current block size
- ✅ Image content scales/crops, not container text logic

#### Shape Blocks
- ✅ Free resize in both directions
- ✅ No aspect ratio lock by default
- ✅ Border radius preserved proportionally (if applicable)

### 2. Resize Handle Semantics

**Corner Handles** (`nw`, `ne`, `sw`, `se`):
- Resize both width and height
- For images: Preserve aspect ratio (unless Shift pressed)
- For text/shapes: Free resize

**Edge Handles** (`n`, `s`, `e`, `w`):
- Resize one axis only
- Always free resize (no aspect ratio)

**Cursor Icons**: Match intent (e.g., `e-resize`, `nw-resize`)

### 3. Constraints and Safety

**Minimum Size**:
- All blocks: 50px minimum width and height
- Enforced in all resize calculations

**Canvas Bounds**:
- Blocks never exceed canvas boundaries
- Position adjusted to keep block fully visible

**No Negative Dimensions**:
- All dimensions clamped to minimum
- No block flipping

**No Font Size Mutation**:
- Text resize NEVER touches `block.styles.fontSize`
- Only `block.size.width` and `block.size.height` change
- Text reflows within new container size

### 4. Undo/Redo Safety

**Implementation**:
- Resize operations use action grouping
- `startActionGroup()` called on resize start (mousedown)
- `endActionGroup()` called on resize end (mouseup)
- All resize updates during drag are batched into one undo step

**Result**:
- ✅ One undo entry per resize interaction
- ✅ Undo fully restores previous geometry
- ✅ Redo restores resized state
- ✅ No intermediate states in history

### 5. Visual Feedback

**Live Preview**:
- Resize updates happen on every mouse move
- Smooth updates via React state
- No flicker or jumps
- Bounding box always matches final state

**Overflow Detection** (Text blocks):
- Visual indication when text overflows container
- Purely visual, not persisted
- Updates reactively during resize

## Architecture

### Separation of Concerns

**Pure Utilities** (`blockResize.ts`):
- No React dependencies
- No editor store dependencies
- Deterministic calculations
- Block-type-specific logic isolated

**Component Logic** (`DraggableBlock.tsx`):
- Handles mouse events
- Calls pure utilities for calculations
- Updates editor store via existing APIs
- Manages action grouping for undo safety

### No Breaking Changes

**Unchanged**:
- ✅ AI systems (no modifications)
- ✅ Asset systems (no modifications)
- ✅ Collaboration foundations (no modifications)
- ✅ Block schema (no new fields)
- ✅ Autosave flow (works with existing debounce)
- ✅ Undo/redo infrastructure (uses existing action grouping)

## Security & Stability

### Value Clamping
- All numeric values clamped to safe ranges
- No negative dimensions
- No dimensions exceeding canvas bounds

### No Style Injection
- Resize only modifies `block.size`
- No arbitrary style injection
- Font size changes only via explicit controls

### No Schema Violations
- All blocks conform to existing interfaces
- No new required fields
- Backward compatible with existing blocks

## Testing Verification

- [x] Text resize: Container changes, font size unchanged
- [x] Image corner resize: Aspect ratio preserved
- [x] Image edge resize: Free resize (one axis)
- [x] Image with Shift: Free resize on corners
- [x] Shape resize: Free resize in both directions
- [x] Undo: One step per resize interaction
- [x] Redo: Restores resized state
- [x] Autosave: Persists correct geometry
- [x] Reload: Reproduces layout exactly
- [x] No editor regressions

## Files Modified

1. **New**: `src/utils/blockResize.ts` - Block-type-specific resize utilities
2. **Modified**: `src/components/editor/blocks/DraggableBlock.tsx` - Uses new resize logic, action grouping for undo
3. **New**: `docs/RESIZE_BEHAVIOR_REFINEMENT.md` - This documentation

## Summary

✅ All requirements met:
- Text resize: Container-only, font size unchanged
- Image resize: Aspect ratio on corners, free on edges
- Shape resize: Free resize
- Undo safety: One step per resize interaction
- Visual feedback: Smooth live preview
- No breaking changes: AI, assets, collaboration untouched
- Security: Value clamping, no style injection

Implementation is production-ready and matches Canva-level editing quality.
