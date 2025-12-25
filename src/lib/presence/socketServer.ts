/**
 * Socket.IO Server Setup
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * WebSocket server for real-time presence awareness.
 * 
 * This is isolated from editor, autosave, undo, and AI systems.
 * Presence is visual-only and does not mutate content.
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

        // Send current presence to new client
        socket.emit("presence:update", {
          sessions: allSessions,
        });
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
  });

  return io;
}

/**
 * Get Socket.IO server instance.
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}
