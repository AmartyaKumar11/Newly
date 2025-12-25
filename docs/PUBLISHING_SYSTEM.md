# Phase 3.5 — Publishing System

## Overview

Implemented a publishing system that converts newsletters from editable drafts into immutable, publicly consumable artifacts.

**Key Principle**: Publishing never mutates the draft. Drafts remain fully editable even after publication.

## Implementation Summary

### 1. Data Model Changes

**Newsletter Model** (updated):
- `status: "draft" | "published"` (already existed, now properly used)
- `publishedAt: Date | null` (already existed)
- `publishedSnapshotId: ObjectId | null` (new) - Reference to current published snapshot
- `slug: string | null` (new) - Human-readable URL slug (globally unique, locked when published)

**PublishedSnapshot Model** (new):
- `newsletterId`: Reference to Newsletter
- `snapshotVersion`: Version number (increments with republish)
- `serializedBlocks`: Immutable block tree snapshot
- `assetReferences`: Array of asset IDs referenced in blocks
- `slug`: Slug at time of publication (locked, never changes)
- `newsletterTitle`: Title at time of publication
- `newsletterDescription`: Description at time of publication
- `integrityHash`: SHA-256 hash for tamper detection
- `createdBy`: User who created the snapshot
- `createdAt`, `updatedAt`: Timestamps

**Key Rules**:
- Snapshots are append-only (never modified)
- Republish always creates a new snapshot
- Existing snapshots are never overwritten
- Snapshots are immutable by design

### 2. Slug Management

**Slug Utilities** (`src/utils/slugUtils.ts`):
- `generateSlug(text)`: Converts text to URL-safe slug (kebab-case)
- `isValidSlugFormat(slug)`: Validates slug format
- `generateUniqueSlug(baseSlug, checkExists)`: Generates unique slug with collision handling

**Rules**:
- Slugs must be globally unique
- Human-readable (kebab-case)
- Collisions handled explicitly (appends number suffix)
- Locked when published (cannot change)

### 3. API Endpoints

**POST `/api/newsletters/:id/publish`**:
- Owner only (server-side validation)
- Validates or generates slug (ensures uniqueness)
- Creates new immutable snapshot (never modifies existing)
- Marks newsletter as published
- Stores snapshot reference
- Republish: Always creates new snapshot (increments version)

**POST `/api/newsletters/:id/unpublish`**:
- Owner only (server-side validation)
- Removes public visibility (status -> "draft")
- Does NOT delete snapshots (preserves history)
- Draft remains fully editable
- Slug remains (locked, but newsletter not publicly accessible)

### 4. Public Consumption Route

**Route**: `/p/[slug]`

**Characteristics**:
- No authentication required
- No editor code
- No editor stores
- No autosave
- No undo/redo
- No AI
- No mutation paths
- Deterministic, read-only rendering only

**SEO & Indexing**:
- Indexable (published content)
- Canonical URLs
- Open Graph metadata
- Twitter card metadata
- Generated from snapshot data

**Implementation**:
- Server-side snapshot lookup
- Renders using `PublicNewsletterRenderer` component
- Pure read-only rendering (no interaction)

### 5. Read-Only Renderer

**Component**: `PublicNewsletterRenderer` (`src/components/public/PublicNewsletterRenderer.tsx`)

**Rules**:
- No selection state
- No interaction handlers
- No editor stores or hooks
- No side effects
- Deterministic rendering only
- Handles all block types: text, image, shape, container
- Supports text effects, SVG shapes, nested containers

**Architecture**:
- Separate from editor components
- No dependencies on editor state
- Pure React component
- Renders blocks deterministically from snapshot data

### 6. Integrity & Security

**Integrity Hash**:
- SHA-256 hash of serialized blocks
- Calculated at snapshot creation
- Stored for tamper detection
- Allows verification of snapshot integrity

**Security Guarantees**:
- Owner permissions enforced server-side
- No privilege escalation possible
- Published content is immutable
- Drafts remain editable even after publication
- No mutation paths in public routes

## Safety Guarantees

✅ **Undo determinism remains intact**: No changes to undo/redo system
✅ **Autosave behavior unchanged**: Publishing does not affect autosave
✅ **AI preview-first contract untouched**: No changes to AI systems
✅ **Viewer mode behavior unchanged**: Sharing/viewer mode unaffected
✅ **No editor JS shipped to public routes**: Public renderer is separate
✅ **No new mutation paths introduced**: Public routes are read-only

## Acceptance Criteria

✅ Newsletters can be published to `/p/[slug]`
✅ Published content does not change when drafts are edited
✅ Republish creates a new immutable snapshot
✅ Unpublish removes public access without data loss
✅ Editor behavior is unchanged
✅ AI implementation is untouched
✅ Security boundaries are preserved

## Files Created

1. **`src/models/PublishedSnapshot.ts`** - Immutable snapshot model
2. **`src/utils/slugUtils.ts`** - Slug generation and validation
3. **`src/app/api/newsletters/[id]/publish/route.ts`** - Publish endpoint
4. **`src/app/api/newsletters/[id]/unpublish/route.ts`** - Unpublish endpoint
5. **`src/components/public/PublicNewsletterRenderer.tsx`** - Read-only renderer
6. **`src/components/public/PublicBlockRenderer.tsx`** - Block renderer helper (unused but kept for reference)
7. **`src/app/p/[slug]/page.tsx`** - Public consumption route
8. **`docs/PUBLISHING_SYSTEM.md`** - This documentation

## Files Modified

1. **`src/models/Newsletter.ts`** - Added `publishedSnapshotId` and `slug` fields

## Usage

### Publishing a Newsletter

```typescript
// Client-side
const response = await fetch(`/api/newsletters/${newsletterId}/publish`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ slug: "my-newsletter" }), // Optional: provide custom slug
});
```

### Unpublishing a Newsletter

```typescript
const response = await fetch(`/api/newsletters/${newsletterId}/unpublish`, {
  method: "POST",
});
```

### Accessing Published Newsletter

Navigate to `/p/[slug]` in a browser. No authentication required.

## Summary

✅ All requirements met:
- Draft vs Published state separation
- Immutable published snapshots (append-only)
- Public consumption route (`/p/[slug]`)
- Slug management (unique, locked when published)
- Read-only renderer (separate from editor)
- SEO optimization (metadata, canonical URLs)
- Integrity hashing (SHA-256)
- Security guarantees preserved
- Editor behavior unchanged
- AI implementation untouched

Implementation is production-ready, secure, and follows all architectural constraints.
