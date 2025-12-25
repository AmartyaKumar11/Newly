/**
 * Presence Store (In-Memory)
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * Ephemeral, in-memory store for presence sessions.
 * 
 * Rules:
 * - Presence data is NOT persisted to MongoDB
 * - Presence data is fully disposable
 * - Sessions timeout after inactivity
 * - No presence data affects editor state
 * 
 * This store is isolated from editor, autosave, undo, and AI systems.
 */

import type { AccessRole } from "@/types/access";
import crypto from "crypto";

export interface PresenceSession {
  sessionId: string;
  newsletterId: string;
  userId: string | null; // null for anonymous viewers
  anonymousId?: string; // For anonymous viewers
  role: AccessRole;
  lastHeartbeat: number;
  cursorPosition?: {
    x: number;
    y: number;
  };
  viewport?: {
    width: number;
    height: number;
    zoom: number;
  };
  userDisplayName?: string; // Optional display name
}

/**
 * In-memory presence store.
 * 
 * Key: newsletterId -> Map<sessionId, PresenceSession>
 */
const presenceStore = new Map<string, Map<string, PresenceSession>>();

/**
 * Heartbeat timeout: sessions expire after 30 seconds of inactivity
 */
const HEARTBEAT_TIMEOUT_MS = 30000;

/**
 * Cleanup interval: runs every 10 seconds to remove stale sessions
 */
const CLEANUP_INTERVAL_MS = 10000;

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Get or create presence room for a newsletter.
 */
function getRoom(newsletterId: string): Map<string, PresenceSession> {
  if (!presenceStore.has(newsletterId)) {
    presenceStore.set(newsletterId, new Map());
  }
  return presenceStore.get(newsletterId)!;
}

/**
 * Add or update a presence session.
 */
export function upsertSession(session: PresenceSession): void {
  const room = getRoom(session.newsletterId);
  room.set(session.sessionId, {
    ...session,
    lastHeartbeat: Date.now(),
  });
}

/**
 * Remove a presence session.
 */
export function removeSession(newsletterId: string, sessionId: string): void {
  const room = presenceStore.get(newsletterId);
  if (room) {
    room.delete(sessionId);
    // Clean up empty rooms
    if (room.size === 0) {
      presenceStore.delete(newsletterId);
    }
  }
}

/**
 * Get all active sessions for a newsletter.
 */
export function getSessions(newsletterId: string): PresenceSession[] {
  const room = presenceStore.get(newsletterId);
  if (!room) {
    return [];
  }
  
  const now = Date.now();
  const activeSessions: PresenceSession[] = [];
  
  // Filter out stale sessions
  for (const [sessionId, session] of room.entries()) {
    if (now - session.lastHeartbeat < HEARTBEAT_TIMEOUT_MS) {
      activeSessions.push(session);
    } else {
      // Remove stale session
      room.delete(sessionId);
    }
  }
  
  // Clean up empty rooms
  if (room.size === 0) {
    presenceStore.delete(newsletterId);
  }
  
  return activeSessions;
}

/**
 * Update heartbeat for a session.
 */
export function updateHeartbeat(newsletterId: string, sessionId: string): boolean {
  const room = presenceStore.get(newsletterId);
  if (!room) {
    return false;
  }
  
  const session = room.get(sessionId);
  if (!session) {
    return false;
  }
  
  session.lastHeartbeat = Date.now();
  return true;
}

/**
 * Update cursor position for a session.
 */
export function updateCursor(
  newsletterId: string,
  sessionId: string,
  cursorPosition: { x: number; y: number } | null
): boolean {
  const room = presenceStore.get(newsletterId);
  if (!room) {
    return false;
  }
  
  const session = room.get(sessionId);
  if (!session) {
    return false;
  }
  
  if (cursorPosition) {
    session.cursorPosition = cursorPosition;
  } else {
    delete session.cursorPosition;
  }
  session.lastHeartbeat = Date.now();
  return true;
}

/**
 * Update viewport for a session.
 */
export function updateViewport(
  newsletterId: string,
  sessionId: string,
  viewport: { width: number; height: number; zoom: number } | null
): boolean {
  const room = presenceStore.get(newsletterId);
  if (!room) {
    return false;
  }
  
  const session = room.get(sessionId);
  if (!session) {
    return false;
  }
  
  if (viewport) {
    session.viewport = viewport;
  } else {
    delete session.viewport;
  }
  session.lastHeartbeat = Date.now();
  return true;
}

/**
 * Get presence stats for a newsletter (counts by role).
 */
export function getPresenceStats(newsletterId: string): {
  owners: number;
  editors: number;
  viewers: number;
  total: number;
} {
  const sessions = getSessions(newsletterId);
  
  const stats = {
    owners: 0,
    editors: 0,
    viewers: 0,
    total: sessions.length,
  };
  
  for (const session of sessions) {
    switch (session.role) {
      case "owner":
        stats.owners++;
        break;
      case "editor":
        stats.editors++;
        break;
      case "viewer":
        stats.viewers++;
        break;
    }
  }
  
  return stats;
}

/**
 * Cleanup stale sessions (runs periodically).
 */
function cleanupStaleSessions(): void {
  const now = Date.now();
  
  for (const [newsletterId, room] of presenceStore.entries()) {
    for (const [sessionId, session] of room.entries()) {
      if (now - session.lastHeartbeat >= HEARTBEAT_TIMEOUT_MS) {
        room.delete(sessionId);
      }
    }
    
    // Remove empty rooms
    if (room.size === 0) {
      presenceStore.delete(newsletterId);
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== "undefined") {
  setInterval(cleanupStaleSessions, CLEANUP_INTERVAL_MS);
}
