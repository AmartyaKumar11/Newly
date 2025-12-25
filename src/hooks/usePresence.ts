/**
 * usePresence Hook
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * Client-side hook for real-time presence awareness.
 * 
 * This hook is isolated from editor state and does not mutate content.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { AccessRole } from "@/types/access";
import type { PresenceSession } from "@/lib/presence/presenceStore";

interface UsePresenceOptions {
  newsletterId: string;
  userId?: string | null;
  role: AccessRole;
  userDisplayName?: string;
  enabled?: boolean; // Allow disabling presence (e.g., in viewer mode)
}

interface PresenceState {
  sessions: PresenceSession[];
  isConnected: boolean;
  sessionId: string | null;
  stats: {
    owners: number;
    editors: number;
    viewers: number;
    total: number;
  };
}

/**
 * Hook for real-time presence awareness.
 * 
 * Features:
 * - Automatic connection/disconnection
 * - Heartbeat management
 * - Cursor position broadcasting
 * - Presence updates from other users
 * 
 * Safety:
 * - Does not mutate editor state
 * - Does not affect autosave
 * - Does not affect undo/redo
 * - Fully optional and non-blocking
 */
export function usePresence({
  newsletterId,
  userId,
  role,
  userDisplayName,
  enabled = true,
}: UsePresenceOptions) {
  const [presence, setPresence] = useState<PresenceState>({
    sessions: [],
    isConnected: false,
    sessionId: null,
    stats: {
      owners: 0,
      editors: 0,
      viewers: 0,
      total: 0,
    },
  });

  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cursorBroadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Generate anonymous ID for viewers without userId
  const anonymousIdRef = useRef<string>(
    typeof window !== "undefined" 
      ? localStorage.getItem("anonymousId") || crypto.randomUUID()
      : crypto.randomUUID()
  );

  // Save anonymous ID to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && !userId) {
      localStorage.setItem("anonymousId", anonymousIdRef.current);
    }
  }, [userId]);

  // Connect to presence server
  useEffect(() => {
    if (!enabled || !newsletterId) {
      return;
    }

    // Initialize socket connection
    // Default to current origin if env var not set
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== "undefined" ? window.location.origin : "");
    
    const socket = io(socketUrl, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Handle connection
    socket.on("connect", () => {
      setPresence((prev) => ({ ...prev, isConnected: true }));

      // Join presence room
      socket.emit("presence:join", {
        newsletterId,
        userId: userId || undefined,
        anonymousId: !userId ? anonymousIdRef.current : undefined,
        role,
        userDisplayName: userDisplayName || undefined,
      });
    });

    // Handle joined event (receive session ID)
    socket.on("presence:joined", (data: { sessionId: string }) => {
      sessionIdRef.current = data.sessionId;
      setPresence((prev) => ({ ...prev, sessionId: data.sessionId }));
    });

    // Handle presence updates
    socket.on("presence:update", (data: { sessions: PresenceSession[] }) => {
      // Filter sessions based on role visibility rules
      // Owners/editors see all, viewers see nothing (or optionally just counts)
      const visibleSessions = data.sessions.filter((session) => {
        // Don't show own session
        if (session.sessionId === sessionIdRef.current) {
          return false;
        }

        // Owners and editors see all other sessions
        if (role === "owner" || role === "editor") {
          return true;
        }

        // Viewers don't see other viewers
        return false;
      });

      // Calculate stats
      const stats = {
        owners: data.sessions.filter((s) => s.role === "owner").length,
        editors: data.sessions.filter((s) => s.role === "editor").length,
        viewers: data.sessions.filter((s) => s.role === "viewer").length,
        total: data.sessions.length,
      };

      setPresence((prev) => ({
        ...prev,
        sessions: visibleSessions,
        stats,
      }));
    });

    // Handle cursor updates from others
    socket.on("presence:cursor-update", (data: {
      sessionId: string;
      cursorPosition: { x: number; y: number } | null;
    }) => {
      // Update cursor position in sessions (visual only, no editor state mutation)
      setPresence((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.sessionId === data.sessionId
            ? { ...session, cursorPosition: data.cursorPosition || undefined }
            : session
        ),
      }));
    });

    // Handle errors
    socket.on("presence:error", (error: { message: string }) => {
      console.error("Presence error:", error.message);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      setPresence((prev) => ({ ...prev, isConnected: false, sessionId: null }));
    });

    // Handle connection errors gracefully (degrade silently)
    socket.on("connect_error", (error) => {
      console.warn("Presence connection error (degrading gracefully):", error.message);
      // Presence failures should not affect editor functionality
    });

    // Setup heartbeat (send every 10 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected && sessionIdRef.current) {
        socket.emit("presence:heartbeat", {
          newsletterId,
          sessionId: sessionIdRef.current,
        });
      }
    }, 10000);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (cursorBroadcastTimeoutRef.current) {
        clearTimeout(cursorBroadcastTimeoutRef.current);
      }
      if (socket.connected && sessionIdRef.current) {
        socket.emit("presence:leave", {
          newsletterId,
          sessionId: sessionIdRef.current,
        });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [newsletterId, userId, role, userDisplayName, enabled]);

  /**
   * Broadcast cursor position (throttled).
   * 
   * This is visual-only and does not affect editor state.
   */
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!socketRef.current?.connected || !sessionIdRef.current || !enabled) {
      return;
    }

    // Throttle cursor updates (every 100ms)
    if (cursorBroadcastTimeoutRef.current) {
      clearTimeout(cursorBroadcastTimeoutRef.current);
    }

    cursorBroadcastTimeoutRef.current = setTimeout(() => {
      // Only broadcast if position changed significantly (reduces network traffic)
      const last = lastCursorPositionRef.current;
      if (!last || Math.abs(last.x - x) > 5 || Math.abs(last.y - y) > 5) {
        lastCursorPositionRef.current = { x, y };
        socketRef.current?.emit("presence:cursor", {
          newsletterId,
          sessionId: sessionIdRef.current,
          cursorPosition: { x, y },
        });
      }
    }, 100);
  }, [newsletterId, enabled]);

  /**
   * Clear cursor (when mouse leaves canvas).
   */
  const clearCursor = useCallback(() => {
    if (!socketRef.current?.connected || !sessionIdRef.current || !enabled) {
      return;
    }

    lastCursorPositionRef.current = null;
    socketRef.current?.emit("presence:cursor", {
      newsletterId,
      sessionId: sessionIdRef.current,
      cursorPosition: null,
    });
  }, [newsletterId, enabled]);

  return {
    ...presence,
    broadcastCursor,
    clearCursor,
  };
}
