# Phase 4.0 — Collaboration Foundations

## Overview

Implemented real-time presence and awareness system for newsletters.

**Key Principle**: Presence is visual-only and does not mutate content. This phase introduces awareness, not live editing.

## Implementation Summary

### 1. Presence Infrastructure

**In-Memory Presence Store** (`src/lib/presence/presenceStore.ts`):
- Ephemeral, memory-only storage
- No persistence to MongoDB
- Session timeout: 30 seconds of inactivity
- Automatic cleanup every 10 seconds

**Session Model**:
- `sessionId`: Unique session identifier
- `newsletterId`: Newsletter being viewed/edited
- `userId`: User ID (null for anonymous viewers)
- `anonymousId`: For anonymous viewers
- `role`: Access role (owner, editor, viewer)
- `lastHeartbeat`: Last activity timestamp
- `cursorPosition`: Optional cursor coordinates
- `viewport`: Optional viewport information
- `userDisplayName`: Optional display name

### 2. WebSocket Server

**Socket.IO Server** (`src/lib/presence/socketServer.ts`):
- Handles connection/disconnection
- Manages newsletter rooms
- Broadcasts presence updates
- Heartbeat management
- Cursor position broadcasting

**Custom Server** (`server.ts`):
- Wraps Next.js server with Socket.IO
- Enables WebSocket support
- Maintains backward compatibility

**Events**:
- `presence:join`: Join newsletter room
- `presence:joined`: Receive session ID
- `presence:heartbeat`: Update liveness
- `presence:cursor`: Broadcast cursor position
- `presence:viewport`: Update viewport
- `presence:leave`: Explicit disconnect
- `presence:update`: Receive presence updates
- `presence:cursor-update`: Receive cursor updates

### 3. Client-Side Presence Hook

**usePresence Hook** (`src/hooks/usePresence.ts`):
- Automatic connection/disconnection
- Heartbeat management (every 10 seconds)
- Cursor broadcasting (throttled to 100ms)
- Presence state management
- Graceful error handling

**Features**:
- Throttled cursor updates (reduces network traffic)
- Automatic reconnection
- Role-based visibility filtering
- Anonymous ID for viewers

### 4. Awareness UI Components

**PresenceIndicator** (`src/components/presence/PresenceIndicator.tsx`):
- Shows active viewer/editor counts
- Role-based visibility:
  - Owners/editors: See detailed counts
  - Viewers: See total count only (privacy)

**GhostCursor** (`src/components/presence/GhostCursor.tsx`):
- Renders other users' cursors
- Non-interactive (pointer-events: none)
- Color-coded by role (blue=owner, purple=editor, green=viewer)
- Shows user name if available

**PresenceCursors** (`src/components/presence/PresenceCursors.tsx`):
- Container for all ghost cursors
- Handles canvas offset calculation
- Accounts for zoom level

### 5. Editor Integration

**EditorLayout**:
- Determines user role (owner for edit mode, viewer for share mode)
- Initializes presence hook
- Passes presence to child components

**EditorTopBar**:
- Displays presence indicator
- Shows active counts based on role

**EditorCanvasWrapper**:
- Tracks mouse movement for cursor broadcasting
- Renders ghost cursors
- Clears cursor on mouse leave

### 6. Permission & Visibility Rules

**Role Visibility**:

| Role | Can see presence | Can broadcast cursor |
|------|------------------|---------------------|
| Owner | Yes (all) | Yes |
| Editor | Yes (all) | Yes |
| Viewer | No (optional total count) | Optional |

**Rules**:
- Owners/editors see all other sessions
- Viewers don't see other viewers (privacy)
- No privilege escalation allowed
- Presence is informational only

## Safety Guarantees

✅ **Presence cannot mutate content**: All presence data is read-only
✅ **Presence cannot affect undo or autosave**: Completely isolated
✅ **Presence cannot trigger AI**: No integration with AI systems
✅ **Presence is isolated from editor logic**: Separate state management
✅ **Disconnects are handled safely**: Graceful degradation
✅ **Viewer mode immutability intact**: Presence doesn't affect viewer restrictions

## Acceptance Criteria

✅ Opening the same newsletter in multiple windows shows presence
✅ Owner/editor can see viewer counts
✅ Ghost cursors move in real time
✅ Refreshing or closing a tab removes presence
✅ Viewers cannot edit or affect state
✅ Undo, autosave, AI, and publishing remain unchanged

## Files Created

1. **`src/lib/presence/presenceStore.ts`** - In-memory presence store
2. **`src/lib/presence/socketServer.ts`** - Socket.IO server setup
3. **`server.ts`** - Custom Next.js server with WebSocket support
4. **`src/hooks/usePresence.ts`** - Client-side presence hook
5. **`src/components/presence/PresenceIndicator.tsx`** - Presence counts UI
6. **`src/components/presence/GhostCursor.tsx`** - Ghost cursor component
7. **`src/components/presence/PresenceCursors.tsx`** - Cursor container
8. **`docs/COLLABORATION_FOUNDATIONS.md`** - This documentation

## Files Modified

1. **`package.json`** - Added socket.io, socket.io-client, tsx
2. **`src/components/editor/EditorLayout.tsx`** - Integrated presence
3. **`src/components/editor/EditorTopBar.tsx`** - Added presence indicator
4. **`src/components/editor/EditorCanvasWrapper.tsx`** - Added cursor tracking

## Usage

### Starting the Server

With WebSocket support:
```bash
npm run dev  # Uses custom server with Socket.IO
```

Without WebSocket (fallback):
```bash
npm run dev:next  # Standard Next.js dev server
```

### How It Works

1. **User opens newsletter**: Presence hook connects to WebSocket
2. **Join room**: Client emits `presence:join` with newsletter ID and role
3. **Receive session ID**: Server assigns unique session ID
4. **Broadcast presence**: Server broadcasts active sessions to room
5. **Mouse movement**: Client broadcasts cursor position (throttled)
6. **Heartbeat**: Client sends heartbeat every 10 seconds
7. **Disconnect**: Client leaves room, presence removed

## Security

- **Role validation**: Server validates roles from database
- **No privilege escalation**: Presence does not grant edit permissions
- **Isolated state**: Presence cannot affect editor state
- **Graceful degradation**: Failures don't break editor

## Performance

- **Throttled cursor updates**: 100ms throttle reduces network traffic
- **Automatic cleanup**: Stale sessions removed every 10 seconds
- **Memory-efficient**: In-memory store, no database overhead
- **Non-blocking**: Presence failures don't affect editor

## Summary

✅ All requirements met:
- Real-time presence infrastructure
- In-memory session store (no persistence)
- WebSocket server with Socket.IO
- Client-side presence hook
- Awareness UI components
- Role-based visibility rules
- Non-destructive integration
- Safety guarantees preserved

Implementation is production-ready, secure, and follows all architectural constraints.
