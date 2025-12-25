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

import { useRef, useEffect, useState } from "react";
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
      const rect = canvasElement.getBoundingClientRect();
      setCanvasOffset({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
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
  const sessionsWithCursors = sessions.filter((s) => s.cursorPosition);

  if (sessionsWithCursors.length === 0) {
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
