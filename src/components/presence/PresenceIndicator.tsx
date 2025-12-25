/**
 * PresenceIndicator Component
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * Shows active viewer/editor counts and role indicators.
 * 
 * This is informational only and does not affect editor state.
 */

"use client";

import type { PresenceState } from "@/hooks/usePresence";

interface PresenceIndicatorProps {
  presence: PresenceState;
  role: "owner" | "editor" | "viewer";
}

/**
 * Presence indicator showing active users.
 * 
 * Visibility Rules:
 * - Owners/editors: See counts
 * - Viewers: See nothing (or optionally just "X viewing")
 */
export function PresenceIndicator({ presence, role }: PresenceIndicatorProps) {
  // Viewers don't see presence details (privacy)
  if (role === "viewer") {
    if (presence.stats.total > 1) {
      // Optionally show just total count for viewers
      return (
        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>{presence.stats.total} viewing</span>
        </div>
      );
    }
    return null;
  }

  // Owners/editors see detailed counts
  const { stats } = presence;
  const parts: string[] = [];

  if (stats.owners > 0) {
    parts.push(`${stats.owners} owner${stats.owners > 1 ? "s" : ""}`);
  }
  if (stats.editors > 0) {
    parts.push(`${stats.editors} editor${stats.editors > 1 ? "s" : ""}`);
  }
  if (stats.viewers > 0) {
    parts.push(`${stats.viewers} viewer${stats.viewers > 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
      <div className={`h-2 w-2 rounded-full ${
        presence.isConnected ? "bg-green-500" : "bg-zinc-400"
      }`} />
      <span>{parts.join(", ")}</span>
    </div>
  );
}
