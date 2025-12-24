# Asset Insertion & Layout Intelligence - Implementation Summary

## Overview

Phase 3.3.5 implements asset insertion with intelligent layout positioning, drag-and-drop support, and full undo/redo safety.

## Architecture

### 1. Pure Utility Functions (`src/utils/assetToBlock.ts`)

**Purpose**: Convert Asset records to ImageBlock instances without side effects.

**Key Functions**:
- `calculateAssetSize(asset)`: Computes intelligent default size (60% canvas width, maintains aspect ratio, clamps to canvas height)
- `calculateCenterPosition(size)`: Positions block center at canvas center
- `calculateDropPosition(dropX, dropY, size)`: Converts drop coordinates to canvas-relative position
- `assetToImageBlock(asset, position?, size?)`: Pure conversion function

**Safety**:
- No React dependencies
- No editor store dependencies
- No side effects
- Deterministic output
- URL validation

### 2. Click Insertion (`EditorSidebar.handleInsertAsset`)

**Flow**:
1. User clicks asset thumbnail in UploadsSidebar
2. `onInsertAsset` callback fires
3. `handleInsertAsset` converts asset to block using `assetToImageBlock`
4. Sets zIndex using `getNextZIndex` (max existing + 1)
5. Calls `addBlock` (creates one undo step automatically)

**Undo Safety**: ✅ Single undo step per insertion (handled by `addBlock`)

### 3. Drag-and-Drop Insertion (`EditorCanvasWrapper`)

**Flow**:
1. User drags asset thumbnail from UploadsSidebar
2. `onDragStart` sets drag data and dispatches custom event
3. Canvas `handleDragOver` checks for asset drag type
4. Canvas `handleDrop` calculates drop position (accounting for zoom)
5. Converts asset to block with drop position
6. Sets zIndex and calls `addBlock`

**Undo Safety**: ✅ Single undo step per insertion (handled by `addBlock`)

**Zoom Handling**: Drop coordinates are divided by `zoomLevel` to get correct canvas-relative position.

## Sizing Rules

### Default Width
- **60% of canvas width** (360px for 600px canvas)
- Defined in `calculateAssetSize` as `CANVAS_WIDTH * 0.6`

### Height Calculation
- Computed from aspect ratio: `height = width / aspectRatio`
- Clamped to canvas height if exceeds

### Fallback Behavior
- If asset dimensions unknown: Uses 200x200 fallback
- Maintains 1:1 aspect ratio for fallback

## Placement Logic

### Center Placement
- Block center aligns with canvas center
- Formula: `x = (CANVAS_WIDTH - width) / 2`, `y = (CANVAS_HEIGHT - height) / 2`
- Constrained to ensure block never exceeds canvas bounds

### Drop Placement
- Block center aligns with drop point
- Formula: `x = dropX - width/2`, `y = dropY - height/2`
- Constrained to canvas bounds

## zIndex Policy

- New blocks always appear above existing blocks
- Formula: `max(existing zIndex) + 1`
- Implemented via `getNextZIndex(blocks)` utility
- Never hardcoded

## Undo/Redo Safety

### Current Implementation
- `addBlock` automatically pushes to history (one undo step per call)
- Each insertion (click or drag) calls `addBlock` exactly once
- ✅ **Result**: One undo step per insertion

### Verification
- Undo removes inserted block completely
- Redo restores inserted block
- No partial states or corruption

## Autosave Safety

### Current Flow
- Block changes trigger `useEffect` in `EditorLayout`
- Debounced autosave (2 seconds) persists full block state
- Reload restores exact layout including inserted assets

### Verification
- ✅ No premature autosave (debounced)
- ✅ Full block geometry persisted
- ✅ Reload restores exact layout

## Security Checks

### URL Validation
- Basic validation in `assetToImageBlock`: checks URL is non-empty string
- Asset URLs come from trusted Supabase storage (validated at upload)

### No XSS Vectors
- URLs are used only in `<img src>` (browser-sanitized)
- No `innerHTML` or `dangerouslySetInnerHTML`
- No script execution

### No Schema Violations
- All blocks conform to `ImageBlock` interface
- All positions/sizes within canvas bounds
- zIndex values are positive integers

## Component Boundaries

### UploadsSidebar
- ✅ Does NOT import editor stores
- ✅ Does NOT import block factories
- ✅ Does NOT import autosave logic
- ✅ Does NOT import AI logic
- ✅ Only emits intent via callbacks

### EditorSidebar
- ✅ Performs insertion via editor store APIs
- ✅ Uses pure utility functions
- ✅ No direct DOM manipulation

### EditorCanvasWrapper
- ✅ Handles drop events
- ✅ Uses pure utility functions
- ✅ No side effects outside editor store

## Testing Checklist

- [x] Click insertion works at canvas center
- [x] Drag-and-drop insertion works at drop position
- [x] Undo removes inserted block
- [x] Redo restores inserted block
- [x] Reload preserves layout
- [x] No editor regressions
- [x] zIndex correct (above existing blocks)
- [x] Sizing respects aspect ratio
- [x] Blocks never exceed canvas bounds

## Future Considerations

### Potential Enhancements
1. Multi-asset drag-and-drop (batch insertion)
2. Smart spacing when dropping multiple assets
3. Visual feedback during drag (preview at drop position)

### Constraints Maintained
- No breaking changes to existing editor behavior
- No new persistence logic outside autosave flow
- No global side effects
- No direct DOM manipulation

## Files Modified

1. **New**: `src/utils/assetToBlock.ts` - Pure utility functions
2. **Modified**: `src/components/editor/EditorSidebar.tsx` - Refactored insertion logic
3. **Modified**: `src/components/editor/EditorCanvasWrapper.tsx` - Added drag-and-drop handlers
4. **Modified**: `src/components/editor/UploadsSidebar.tsx` - Added drag support
5. **Modified**: `src/utils/blockFactory.ts` - Removed debug logs

## Summary

✅ All requirements met:
- Pure utility functions for Asset → Block translation
- Intelligent default sizing (60% width, aspect ratio preserved)
- Center placement algorithm
- zIndex policy (max + 1)
- Click insertion
- Drag-and-drop insertion
- Undo/redo safety (one step per insertion)
- Autosave safety (debounced, full state)
- Security checks (URL validation, no XSS)
- Component boundaries respected
- No editor regressions

Implementation is production-ready and follows all architectural constraints.
