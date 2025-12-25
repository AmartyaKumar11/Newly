# Phase 3.4 — Newsletter Sharing & Access Control

## Overview

Implemented secure newsletter sharing with access control, viewer mode, and share link management.

## Implementation Summary

### 1. Access Role Definitions (`src/types/access.ts`)

**Purpose**: Shared type definitions for access roles.

**Roles**:
- `owner`: Newsletter creator, full control
- `viewer`: Read-only access via share link
- `editor`: Write access via share link (defined but not behaviorally enabled in v1)

**Helper Functions**:
- `canEdit(role)`: Returns true for owner and editor
- `canView(role)`: Returns true for all roles

**Architecture**: No editor, AI, or UI imports - pure type definitions.

### 2. ShareToken Data Model (`src/models/ShareToken.ts`)

**Purpose**: Mongoose model for shareable access links.

**Schema**:
- `token`: Cryptographically secure, URL-safe token (32 bytes, base64url encoded)
- `newsletterId`: ObjectId reference to Newsletter
- `role`: "viewer" | "editor" (default: "viewer")
- `createdBy`: ObjectId reference to User (newsletter owner)
- `revoked`: Boolean (soft delete, keeps audit trail)
- `expiresAt`: Date | null (optional expiration)

**Indexes**:
- `token` (unique)
- `newsletterId`
- `revoked`
- Compound: `newsletterId + revoked`

**Security**:
- Token generation uses `crypto.randomBytes(32)` for 256 bits of entropy
- Base64url encoding ensures URL safety (no +, /, or = padding)
- Tokens are unguessable and cryptographically secure

**Helper Functions**:
- `generateShareToken()`: Creates secure, URL-safe token
- `isTokenValid(token)`: Checks if token is not revoked and not expired

### 3. Read-Only Viewer Mode

**Implementation**: Added `editorMode: "edit" | "view"` prop to `EditorLayout`.

**Viewer Mode Behavior**:
- ✅ Canvas renders blocks normally
- ✅ NO block selection (selection handlers disabled)
- ✅ NO dragging or resizing (mouse handlers disabled)
- ✅ NO keyboard shortcuts (event listeners disabled)
- ✅ NO autosave (autosave effects disabled)
- ✅ NO undo/redo (buttons hidden)
- ✅ NO AI panels (hidden)
- ✅ NO uploads sidebar (hidden)
- ✅ NO property panels (hidden)

**Enforcement Points**:
- `EditorLayout`: Disables autosave, hides mutation UI
- `EditorTopBar`: Hides undo/redo, disables title editing
- `EditorCanvasWrapper`: Disables keyboard shortcuts, drag-and-drop
- `DraggableBlock`: Disables drag/resize handlers, hides resize handles
- `EditorSidebar`: Hidden entirely
- `EditorPropertiesPanel`: Hidden entirely

**Comments**: All viewer mode checks are clearly commented explaining why viewer mode exists (security boundary).

### 4. Share Management APIs

**POST `/api/newsletters/:id/share`**:
- Creates a new share token
- **Security**: Only newsletter owner can create shares (server-side ownership check)
- Default role: "viewer" (v1)
- Returns: token, role, expiresAt, createdAt

**GET `/api/newsletters/:id/shares`**:
- Lists all active (non-revoked, non-expired) share tokens
- **Security**: Only newsletter owner can list shares (server-side ownership check)
- Filters out revoked and expired tokens automatically

**DELETE `/api/shares/:token`**:
- Revokes a share token (soft delete)
- **Security**: Only newsletter owner can revoke (validates ownership via ShareToken -> Newsletter -> User)
- Sets `revoked: true` (keeps audit trail)

**Security Enforcement**:
- All endpoints validate ownership server-side (no client-side trust)
- Clean error messages (no internal leaks)
- Proper HTTP status codes (401, 403, 404, 410)

### 5. Share Link Resolution (`/share/[token]`)

**Route**: `/share/[token]` - Public share link page

**Behavior**:
1. Extracts token from URL
2. Validates token server-side:
   - Token exists in database
   - Token is not revoked
   - Token is not expired
3. Fetches associated newsletter
4. Loads editor in viewer mode with pre-loaded newsletter data

**Security**:
- No authentication required (public access for viewers)
- Token validation happens server-side
- Viewer mode enforced even if user is logged in
- Invalid tokens return 404 (safe error state)

**Implementation**:
- Server component (direct database access)
- Passes newsletter data directly to EditorLayout (avoids authenticated API call)
- Viewer mode prevents all mutations

### 6. Share Modal UI (`ShareModal.tsx`)

**Features**:
- Create share link button
- List active share links
- Copy share link to clipboard
- Revoke share links
- Shows access level (viewer/editor)
- Shows expiration date (if set)

**UI Behavior**:
- Opens from "Share" button in top bar
- Clean, minimal, enterprise-style UX
- Works on localhost (uses `window.location.origin`)

**Architecture**:
- Pure UI + API calls
- No editor logic
- No AI logic
- Decoupled from editor state

## Security & Quality Checks

### Token Security
- ✅ Tokens are cryptographically secure (32 bytes random)
- ✅ Tokens are URL-safe (base64url encoding)
- ✅ Tokens are unguessable (256 bits of entropy)

### Viewer Mode Enforcement
- ✅ No block selection (handlers disabled)
- ✅ No dragging or resizing (mouse handlers disabled)
- ✅ No keyboard shortcuts (event listeners disabled)
- ✅ No autosave (effects disabled)
- ✅ No undo/redo (buttons hidden)
- ✅ No AI panels (hidden)
- ✅ No uploads (sidebar hidden)
- ✅ No property panels (hidden)

### Access Control
- ✅ Owner permissions enforced server-side
- ✅ No privilege escalation possible
- ✅ Share token validation server-side
- ✅ Revoked tokens cannot be used
- ✅ Expired tokens cannot be used

### Data Integrity
- ✅ No editor state corruption
- ✅ No mutations in viewer mode
- ✅ Autosave never triggers in viewer mode
- ✅ Undo stack remains untouched in viewer mode

## Files Created

1. **`src/types/access.ts`** - Access role definitions
2. **`src/models/ShareToken.ts`** - ShareToken Mongoose model
3. **`src/app/api/newsletters/[id]/share/route.ts`** - Create share token API
4. **`src/app/api/newsletters/[id]/shares/route.ts`** - List share tokens API
5. **`src/app/api/shares/[token]/route.ts`** - Revoke share token API
6. **`src/app/api/shares/[token]/resolve/route.ts`** - Resolve share token API
7. **`src/app/share/[token]/page.tsx`** - Public share link page
8. **`src/components/editor/ShareModal.tsx`** - Share management modal UI
9. **`docs/SHARING_ACCESS_CONTROL.md`** - This documentation

## Files Modified

1. **`src/components/editor/EditorLayout.tsx`** - Added viewer mode support, disabled autosave in viewer mode
2. **`src/components/editor/EditorTopBar.tsx`** - Added Share button, disabled features in viewer mode
3. **`src/components/editor/EditorCanvasWrapper.tsx`** - Disabled interactions in viewer mode
4. **`src/components/editor/blocks/DraggableBlock.tsx`** - Disabled drag/resize in viewer mode

## Testing Verification

- [x] Share token creation: Only owner can create
- [x] Share token listing: Only owner can list
- [x] Share token revocation: Only owner can revoke
- [x] Share link resolution: Valid tokens work, invalid tokens return 404
- [x] Viewer mode: No mutations possible
- [x] Viewer mode: No autosave
- [x] Viewer mode: No undo/redo
- [x] Viewer mode: No AI panels
- [x] Viewer mode: No uploads
- [x] Viewer mode: No property panels
- [x] Security: Owner permissions enforced server-side
- [x] Security: Tokens are cryptographically secure

## Summary

✅ All requirements met:
- Access role definitions (owner, viewer, editor)
- ShareToken data model (secure, revocable, auditable)
- Read-only viewer mode (no mutations)
- Share management APIs (create, list, revoke)
- Share link resolution (public access, viewer mode)
- Share modal UI (Canva-like, enterprise-style)
- Security: Server-side enforcement, no privilege escalation
- No breaking changes: AI, autosave, undo untouched

Implementation is production-ready, secure, and follows all architectural constraints.
