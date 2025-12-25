/**
 * Custom Next.js Server with Socket.IO
 * 
 * Phase 4.0: Collaboration Foundations
 * 
 * This custom server enables WebSocket support for real-time presence.
 * 
 * To run: node server.ts (or update package.json scripts)
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeSocketServer } from "./src/lib/presence/socketServer";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO server
  initializeSocketServer(httpServer);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
