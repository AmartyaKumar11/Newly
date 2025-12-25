/**
 * PresenceCursors Component
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * Container for rendering all ghost cursors.
 * 
 * This is visual-only and does not affect editor state.
 */

"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import type { PresenceSession } from "@/lib/presence/presenceStore";
import { GhostCursor } from "./GhostCursor";

interface PresenceCursorsProps {
  sessions: PresenceSession[];
  canvasElement?: HTMLElement | null; // Canvas DOM element for position calculation
  zoom?: number;
}

/**
 * Renders all ghost cursors for active sessions.
 */
export function PresenceCursors({
  sessions,
  canvasElement,
  zoom = 1,
}: PresenceCursorsProps) {
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Update canvas offset when canvas element position changes
  useEffect(() => {
    if (!canvasElement) {
      return;
    }

    const updateOffset = () => {
      if (!canvasElement) return;
      const rect = canvasElement.getBoundingClientRect();
      setCanvasOffset({
        x: rect.left + (window.scrollX || 0),
        y: rect.top + (window.scrollY || 0),
      });
    };

    updateOffset();

    // Update on scroll and resize
    window.addEventListener("scroll", updateOffset, true);
    window.addEventListener("resize", updateOffset);

    return () => {
      window.removeEventListener("scroll", updateOffset, true);
      window.removeEventListener("resize", updateOffset);
    };
  }, [canvasElement]);

  // Filter sessions with cursor positions
  // Use useMemo to avoid unnecessary recalculations
  const sessionsWithCursors = useMemo(
    () => {
      const filtered = sessions.filter((s) => s.cursorPosition);
      // Debug logging to diagnose cursor visibility
      if (process.env.NODE_ENV === "development" && filtered.length > 0) {
        console.log("[PresenceCursors] Rendering", filtered.length, "cursors:", filtered.map(s => ({
          sessionId: s.sessionId.substring(0, 8),
          role: s.role,
          cursor: s.cursorPosition,
          name: s.userDisplayName || "Anonymous"
        })));
      }
      return filtered;
    },
    [sessions]
  );

  if (sessionsWithCursors.length === 0) {
    // Debug: log when no cursors to render
    if (process.env.NODE_ENV === "development" && sessions.length > 0) {
      console.log("[PresenceCursors] No cursors to render. Sessions:", sessions.length, "but none have cursorPosition");
    }
    return null;
  }

  return (
    <>
      {sessionsWithCursors.map((session) => (
        <GhostCursor
          key={session.sessionId}
          session={session}
          canvasOffset={canvasOffset}
          zoom={zoom}
        />
      ))}
    </>
  );
}
