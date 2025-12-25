/**
 * Socket.IO Server Setup
 * 
 * Phase 4.0: Collaboration Foundations (Presence)
 * Phase 4.1: Live Editing (Mutations)
 * 
 * WebSocket server for real-time presence awareness and live editing.
 * 
 * This handles:
 * - Presence (Phase 4.0): Visual-only, does not mutate content
 * - Mutations (Phase 4.1): Real-time collaborative editing
 */

import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import {
  upsertSession,
  removeSession,
  updateHeartbeat,
  updateCursor,
  updateViewport,
  getSessions,
  generateSessionId,
  type PresenceSession,
} from "./presenceStore";
import type { AccessRole } from "@/types/access";
import type { Mutation, MutationBroadcast } from "@/types/mutations";
import {
  processMutation,
  initializeAuthoritativeState,
  getAuthoritativeState,
} from "../live-editing/mutationEngine";
import {
  initializeDocumentVersion,
  getDocumentVersion,
} from "../live-editing/mutationStore";

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server.
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*", // In production, restrict to your domain
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    let currentSession: PresenceSession | null = null;

    // Handle join: Client connects to a newsletter room
    socket.on("presence:join", (data: {
      newsletterId: string;
      userId?: string;
      anonymousId?: string;
      role: AccessRole;
      userDisplayName?: string;
    }) => {
      try {
        const sessionId = generateSessionId();
        
        currentSession = {
          sessionId,
          newsletterId: data.newsletterId,
          userId: data.userId || null,
          anonymousId: data.anonymousId,
          role: data.role,
          lastHeartbeat: Date.now(),
          userDisplayName: data.userDisplayName,
        };

        // Join newsletter room
        socket.join(`newsletter:${data.newsletterId}`);
        
        // Store session
        upsertSession(currentSession);

        // Send session ID to client
        socket.emit("presence:joined", { sessionId });

        // Broadcast presence update to others in the room
        const allSessions = getSessions(data.newsletterId);
        socket.to(`newsletter:${data.newsletterId}`).emit("presence:update", {
          sessions: allSessions,
        });

        // Send current presence to new client (includes all active sessions)
        socket.emit("presence:update", {
          sessions: allSessions,
        });

        // Debug logging
        if (process.env.NODE_ENV === "development") {
          console.log("[socketServer] presence:join - Sent presence:update to new client:", {
            sessionId: sessionId.substring(0, 8),
            totalSessions: allSessions.length,
            sessions: allSessions.map(s => ({
              sessionId: s.sessionId.substring(0, 8),
              role: s.role,
              hasCursor: !!s.cursorPosition,
            }))
          });
        }
      } catch (error) {
        console.error("Error in presence:join:", error);
        socket.emit("presence:error", { message: "Failed to join presence" });
      }
    });

    // Handle heartbeat
    socket.on("presence:heartbeat", (data: { newsletterId: string; sessionId: string }) => {
      try {
        if (updateHeartbeat(data.newsletterId, data.sessionId)) {
          // Broadcast updated presence
          const allSessions = getSessions(data.newsletterId);
          socket.to(`newsletter:${data.newsletterId}`).emit("presence:update", {
            sessions: allSessions,
          });
        }
      } catch (error) {
        console.error("Error in presence:heartbeat:", error);
      }
    });

    // Handle cursor update
    socket.on("presence:cursor", (data: {
      newsletterId: string;
      sessionId: string;
      cursorPosition: { x: number; y: number } | null;
    }) => {
      try {
        if (updateCursor(data.newsletterId, data.sessionId, data.cursorPosition)) {
          // Broadcast cursor to others (not back to sender)
          const session = getSessions(data.newsletterId).find(
            (s) => s.sessionId === data.sessionId
          );
          if (session) {
            socket.to(`newsletter:${data.newsletterId}`).emit("presence:cursor-update", {
              sessionId: data.sessionId,
              cursorPosition: data.cursorPosition,
            });
          }
        }
      } catch (error) {
        console.error("Error in presence:cursor:", error);
      }
    });

    // Handle viewport update
    socket.on("presence:viewport", (data: {
      newsletterId: string;
      sessionId: string;
      viewport: { width: number; height: number; zoom: number } | null;
    }) => {
      try {
        updateViewport(data.newsletterId, data.sessionId, data.viewport);
        // Viewport updates are less critical, no broadcast needed
      } catch (error) {
        console.error("Error in presence:viewport:", error);
      }
    });

    // Handle explicit leave event
    socket.on("presence:leave", (data: { newsletterId: string; sessionId: string }) => {
      removeSession(data.newsletterId, data.sessionId);
      const allSessions = getSessions(data.newsletterId);
      socket.to(`newsletter:${data.newsletterId}`).emit("presence:update", {
        sessions: allSessions,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (currentSession) {
        removeSession(currentSession.newsletterId, currentSession.sessionId);
        
        // Broadcast presence update to others
        const allSessions = getSessions(currentSession.newsletterId);
        socket.to(`newsletter:${currentSession.newsletterId}`).emit("presence:update", {
          sessions: allSessions,
        });
      }
    });

    // ========================================
    // Phase 4.1: Live Editing Mutations
    // ========================================

    // Handle mutation submission
    socket.on("mutation:submit", (data: { mutation: Mutation }) => {
      try {
        if (!currentSession) {
          socket.emit("mutation:ack", {
            mutationId: data.mutation.mutationId,
            accepted: false,
            appliedVersion: 0,
            reason: "Not connected to a newsletter",
          });
          return;
        }

        // Get user role from session
        const role: AccessRole = currentSession.role;

        // Process mutation
        const result = processMutation(data.mutation, role);

        // Send acknowledgement
        socket.emit("mutation:ack", result.ack);

        // Broadcast to other editors if accepted
        if (result.shouldBroadcast) {
          const broadcast: MutationBroadcast = {
            mutation: data.mutation,
            appliedVersion: result.ack.appliedVersion!,
            appliedBy: currentSession.userId || currentSession.anonymousId || "unknown",
          };

          // Broadcast to all others in the room
          socket.to(`newsletter:${data.mutation.newsletterId}`).emit("mutation:broadcast", broadcast);

          // Also send updated blocks to all clients (for reconciliation)
          if (result.blocks && io) {
            io.to(`newsletter:${data.mutation.newsletterId}`).emit("mutation:state-update", {
              newsletterId: data.mutation.newsletterId,
              blocks: result.blocks,
              version: result.ack.appliedVersion!,
            });
          }
        }

        // Debug logging
        if (process.env.NODE_ENV === "development") {
          console.log("[socketServer] mutation:submit", {
            mutationId: data.mutation.mutationId.substring(0, 8),
            type: data.mutation.type,
            accepted: result.ack.accepted,
            version: result.ack.appliedVersion,
            reason: result.ack.reason,
          });
        }
      } catch (error) {
        console.error("Error in mutation:submit:", error);
        socket.emit("mutation:ack", {
          mutationId: data.mutation.mutationId,
          accepted: false,
          appliedVersion: getDocumentVersion(data.mutation.newsletterId).version,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    // Handle document state initialization request
    socket.on("mutation:init", (data: { newsletterId: string; blocks: any[]; version?: number }) => {
      try {
        // Validate input
        if (!data.newsletterId) {
          console.error("[socketServer] mutation:init: Missing newsletterId");
          return;
        }

        // Ensure blocks is an array
        const blocks = Array.isArray(data.blocks) ? data.blocks : [];
        
        // Initialize authoritative state
        initializeAuthoritativeState(data.newsletterId, blocks);
        
        // Initialize document version
        if (data.version !== undefined && typeof data.version === "number") {
          initializeDocumentVersion(data.newsletterId, data.version);
        } else {
          initializeDocumentVersion(data.newsletterId, 0);
        }

        // Send current state back
        socket.emit("mutation:init-ack", {
          newsletterId: data.newsletterId,
          version: getDocumentVersion(data.newsletterId).version,
          blocks: getAuthoritativeState(data.newsletterId),
        });

        if (process.env.NODE_ENV === "development") {
          console.log("[socketServer] mutation:init", {
            newsletterId: data.newsletterId,
            version: getDocumentVersion(data.newsletterId).version,
            blockCount: blocks.length,
          });
        }
      } catch (error) {
        console.error("[socketServer] Error in mutation:init:", error);
        // Send error response
        socket.emit("mutation:init-ack", {
          newsletterId: data?.newsletterId || "",
          version: 0,
          blocks: [],
        });
      }
    });
  });

  return io;
}

/**
 * Get Socket.IO server instance.
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}
