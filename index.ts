import { config } from "dotenv";
import http from "http";
import { createApp } from "./src/app";
import socketService from "./services/socket-service";

// 1. Initialize Environment
config();

// 2. Initialize App & Server
const app = createApp();
const server = http.createServer(app);

// 3. Initialize Socket Service
socketService.initialize(server);

// 4. Start Listener
const port = process.env.PORT || 6969;

server.listen(port, () => {
  console.log(`[ERP Portal] Server stabilized and running at port : ${port}`);
});

// 5. Graceful Shutdown — ensures in-flight requests finish before the process exits.
//    Prevents abrupt Prisma connection drops on SIGTERM (Docker/PM2) or SIGINT (Ctrl+C).
function shutdown(signal: string) {
  console.log(`\n[ERP Portal] Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.log("[ERP Portal] HTTP server closed. Exiting.");
    process.exit(0);
  });
  // Force-kill after 10 s if requests are still pending
  setTimeout(() => {
    console.error("[ERP Portal] Forced exit after timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
