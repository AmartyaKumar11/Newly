/**
 * GhostCursor Component
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * Renders ghost cursors for other users' mouse positions.
 * 
 * These cursors are visual-only and non-interactive.
 */

"use client";

import type { PresenceSession } from "@/lib/presence/presenceStore";

interface GhostCursorProps {
  session: PresenceSession;
  canvasOffset?: { x: number; y: number }; // Canvas position on screen
  zoom?: number; // Current zoom level
}

/**
 * Ghost cursor for another user's mouse position.
 * 
 * Rules:
 * - Non-interactive (pointer-events: none)
 * - Ghosted appearance (opacity, styling)
 * - Shows user's name if available
 */
export function GhostCursor({
  session,
  canvasOffset = { x: 0, y: 0 },
  zoom = 1,
}: GhostCursorProps) {
  if (!session.cursorPosition) {
    return null;
  }

  const { x, y } = session.cursorPosition;

  // Calculate on-screen position (accounting for canvas offset and zoom)
  const screenX = canvasOffset.x + x * zoom;
  const screenY = canvasOffset.y + y * zoom;

  // Determine color based on role
  const roleColors = {
    owner: "#3b82f6", // Blue
    editor: "#8b5cf6", // Purple
    viewer: "#10b981", // Green
  };

  const color = roleColors[session.role] || "#6b7280";

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Cursor */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        }}
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={color}
          opacity={0.8}
        />
      </svg>

      {/* User name label (if available) */}
      {session.userDisplayName && (
        <div
          className="absolute left-6 top-0 rounded px-2 py-0.5 text-xs text-white shadow-sm"
          style={{
            backgroundColor: color,
          }}
        >
          {session.userDisplayName}
        </div>
      )}
    </div>
  );
}
