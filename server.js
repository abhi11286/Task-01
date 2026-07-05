import dotenv from "dotenv";
// Load environment variables immediately before any other imports
dotenv.config();

import express from "express";
import path from "path";
import http from "http";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { dbService } from "./server/services/dbService.js";
import { initSocket } from "./server/sockets/socketHandler.js";
import { initCronJobs } from "./server/cron/cronJobs.js";
import apiRouter from "./server/routes/api.js";

async function startServer() {
  const app = express();
  
  // Trust the reverse proxy (Cloud Run / Nginx) to retrieve the correct client IP for rate limiting
  app.set("trust proxy", 1);

  const server = http.createServer(app);
  const PORT = 3000;

  // Initialize data store (MongoDB or fallback JSON file)
  await dbService.connect();

  // Initialize Socket.IO real-time server
  initSocket(server);

  // Initialize cron schedulers
  initCronJobs();

  // Basic Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount backend API routes
  app.use("/api", apiRouter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date() });
  });

  // Integration of Vite as middleware for Development or Static assets for Production
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting server in DEVELOPMENT mode (with Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting server in PRODUCTION mode (serving compiled assets)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`==================================================================`);
    console.log(`💇 Happy Happy Saloon Backend running at http://localhost:${PORT}`);
    console.log(`==================================================================`);
  });
}

startServer().catch((error) => {
  console.error("FATAL: Failed to start full-stack server:", error);
});
