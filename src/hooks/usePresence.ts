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
  // Track own session separately for optimistic local cursor updates
  const ownSessionRef = useRef<PresenceSession | null>(null);
  
  // Store pending cursor positions for sessions not yet in the array (race condition handling)
  const pendingCursorPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
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
  const cursorBroadcastTimeoutRef = useRef<number | null>(null); // Changed to number for requestAnimationFrame
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

    // IMPORTANT: Register ALL event handlers BEFORE emitting connect/join
    // This ensures we catch presence:update events that are sent immediately after join

    // Handle presence updates (register FIRST to catch initial update)
    socket.on("presence:update", (data: { sessions: PresenceSession[] }) => {
      // Debug: Log received sessions
      if (process.env.NODE_ENV === "development") {
        console.log("[usePresence] presence:update received from server:", {
          totalSessions: data.sessions.length,
          myRole: role,
          mySessionId: sessionIdRef.current?.substring(0, 8),
          sessions: data.sessions.map(s => ({
            sessionId: s.sessionId.substring(0, 8),
            role: s.role,
            hasCursor: !!s.cursorPosition,
          }))
        });
      }

      // Filter sessions based on role visibility rules
      // Owners/editors see all, viewers see nothing (or optionally just counts)
      const visibleSessions = data.sessions.filter((session) => {
        // Don't show own session (we handle own cursor optimistically)
        if (session.sessionId === sessionIdRef.current) {
          if (process.env.NODE_ENV === "development") {
            console.log("[usePresence] Filtering out own session:", session.sessionId.substring(0, 8));
          }
          return false;
        }

        // Owners and editors see all other sessions
        if (role === "owner" || role === "editor") {
          return true;
        }

        // Viewers don't see other viewers (they can only see owners/editors)
        if (role === "viewer") {
          const visible = session.role === "owner" || session.role === "editor";
          if (process.env.NODE_ENV === "development" && !visible) {
            console.log("[usePresence] Viewer filtering out session:", {
              sessionId: session.sessionId.substring(0, 8),
              sessionRole: session.role,
              reason: "Viewers can't see other viewers"
            });
          }
          return visible;
        }

        return false;
      });

      // Calculate stats
      const stats = {
        owners: data.sessions.filter((s) => s.role === "owner").length,
        editors: data.sessions.filter((s) => s.role === "editor").length,
        viewers: data.sessions.filter((s) => s.role === "viewer").length,
        total: data.sessions.length,
      };

      // Update sessions (don't include own session - we only show OTHER users' cursors)
      // IMPORTANT: Merge cursor positions from previous state AND pending positions
      // to avoid losing them when presence:update arrives between cursor updates
      setPresence((prev) => {
        // Create a map of existing cursor positions to preserve them
        const previousCursorPositions = new Map<string, { x: number; y: number }>();
        prev.sessions.forEach((s) => {
          if (s.cursorPosition) {
            previousCursorPositions.set(s.sessionId, s.cursorPosition);
          }
        });

        // Merge cursor positions: prioritize server's, then pending, then previous
        const mergedSessions = visibleSessions.map((session) => {
          // Priority 1: Server-provided cursor position (most up-to-date)
          if (session.cursorPosition) {
            // Clear pending position if server has it
            pendingCursorPositionsRef.current.delete(session.sessionId);
            return session;
          }
          
          // Priority 2: Pending cursor position (received before session was in array)
          const pendingCursor = pendingCursorPositionsRef.current.get(session.sessionId);
          if (pendingCursor) {
            pendingCursorPositionsRef.current.delete(session.sessionId);
            return { ...session, cursorPosition: pendingCursor };
          }
          
          // Priority 3: Previous cursor position (preserve during updates)
          const previousCursor = previousCursorPositions.get(session.sessionId);
          if (previousCursor) {
            return { ...session, cursorPosition: previousCursor };
          }
          
          return session;
        });

        // Debug logging
        if (process.env.NODE_ENV === "development") {
          const sessionsWithCursors = mergedSessions.filter(s => s.cursorPosition);
          if (sessionsWithCursors.length > 0 || visibleSessions.length > 0) {
            console.log("[usePresence] presence:update processed:", {
              totalSessions: visibleSessions.length,
              sessionsWithCursors: sessionsWithCursors.length,
              mergedWithPending: pendingCursorPositionsRef.current.size,
              mergedWithPrevious: previousCursorPositions.size,
              cursors: sessionsWithCursors.map(s => ({
                sessionId: s.sessionId.substring(0, 8),
                position: s.cursorPosition,
              }))
            });
          }
        }
        
        return {
          ...prev,
          sessions: mergedSessions,
          stats,
        };
      });
    });

    // Handle joined event (receive session ID) - register early to catch the event
    socket.on("presence:joined", (data: { sessionId: string }) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[usePresence] Received presence:joined:", {
          sessionId: data.sessionId.substring(0, 8),
          role
        });
      }

      sessionIdRef.current = data.sessionId;
      
      // Store own session for optimistic local cursor updates
      ownSessionRef.current = {
        sessionId: data.sessionId,
        newsletterId,
        userId: userId || null,
        anonymousId: !userId ? anonymousIdRef.current : undefined,
        role,
        lastHeartbeat: Date.now(),
        userDisplayName: userDisplayName || undefined,
      };
      
      setPresence((prev) => ({ 
        ...prev, 
        sessionId: data.sessionId,
        // Don't add own session to sessions array - we only show OTHER users' cursors
      }));
    });

    // Handle cursor updates from others
    socket.on("presence:cursor-update", (data: {
      sessionId: string;
      cursorPosition: { x: number; y: number } | null;
    }) => {
      // Don't process own cursor updates (we only show OTHER users' cursors)
      if (data.sessionId === sessionIdRef.current) {
        return;
      }

      // Update cursor position in sessions (visual only, no editor state mutation)
      // Update immediately for lowest latency
      setPresence((prev) => {
        // Check if session exists in array
        const existingSessionIndex = prev.sessions.findIndex(
          (s) => s.sessionId === data.sessionId
        );

        if (existingSessionIndex >= 0) {
          // Update existing session's cursor position
          const updatedSessions = prev.sessions.map((session) =>
            session.sessionId === data.sessionId
              ? { ...session, cursorPosition: data.cursorPosition || undefined }
              : session
          );

          // Debug logging
          if (process.env.NODE_ENV === "development" && data.cursorPosition) {
            console.log("[usePresence] Cursor update received and applied:", {
              sessionId: data.sessionId.substring(0, 8),
              position: data.cursorPosition,
              totalSessions: prev.sessions.length,
              sessionsWithCursors: updatedSessions.filter(s => s.cursorPosition).length
            });
          }

          return {
            ...prev,
            sessions: updatedSessions,
          };
        }

        // Session not in array - this can happen due to race condition:
        // cursor update arrives before presence:update includes the session
        // Store it as pending so it can be merged when the session appears
        if (data.cursorPosition) {
          pendingCursorPositionsRef.current.set(data.sessionId, data.cursorPosition);
          
          if (process.env.NODE_ENV === "development") {
            console.log("[usePresence] Storing pending cursor position for session:", {
              sessionId: data.sessionId.substring(0, 8),
              position: data.cursorPosition,
              availableSessions: prev.sessions.length,
              pendingCount: pendingCursorPositionsRef.current.size
            });
          }
        }
        return prev;
      });
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

    // Now register the connect handler (after all other handlers are ready)
    socket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[usePresence] Socket connected, joining presence room:", {
          newsletterId,
          role,
          userId: userId?.substring(0, 8) || "anonymous"
        });
      }

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
      if (cursorBroadcastTimeoutRef.current !== null) {
        cancelAnimationFrame(cursorBroadcastTimeoutRef.current);
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
   * Broadcast cursor position (throttled to ~16ms for 60fps).
   * 
   * This is visual-only and does not affect editor state.
   * 
   * Optimization: Uses requestAnimationFrame for smooth 60fps updates
   * while still throttling network broadcasts to reduce traffic.
   */
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!socketRef.current?.connected || !sessionIdRef.current || !enabled) {
      return;
    }

    // Throttle network broadcasts using requestAnimationFrame for smooth, frame-aligned updates
    // Note: We don't show own cursor (design decision - only show OTHER users' cursors)
    if (cursorBroadcastTimeoutRef.current !== null) {
      cancelAnimationFrame(cursorBroadcastTimeoutRef.current);
    }

    cursorBroadcastTimeoutRef.current = requestAnimationFrame(() => {
      // Only broadcast if position changed significantly (reduces network traffic)
      const last = lastCursorPositionRef.current;
      if (!last || Math.abs(last.x - x) > 2 || Math.abs(last.y - y) > 2) {
        lastCursorPositionRef.current = { x, y };
        
        // Debug logging
        if (process.env.NODE_ENV === "development") {
          console.log("[usePresence] Broadcasting cursor:", { x, y, sessionId: sessionIdRef.current?.substring(0, 8) });
        }
        
        socketRef.current?.emit("presence:cursor", {
          newsletterId,
          sessionId: sessionIdRef.current,
          cursorPosition: { x, y },
        });
      }
    });
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
