import { Router } from "express";
import rateLimit from "express-rate-limit";
import { adminLogin, getMe, adminLogout, updateCredentials } from "../controllers/authController.js";
import {
  getActiveQueue,
  generateToken,
  completeHaircut,
  cancelToken,
  callNext,
  getStats,
  getPastBookings,
} from "../controllers/queueController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Rate limiter for token generation: max 5 tokens per 15 minutes per IP to prevent spamming
const tokenGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 tokens per IP window
  message: {
    success: false,
    message: "Too many token requests from this IP. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
});

// --- AUTHENTICATION ROUTES ---
router.post("/auth/login", adminLogin);
router.get("/auth/me", authMiddleware, getMe);
router.post("/auth/logout", adminLogout);
router.post("/auth/update-credentials", authMiddleware, updateCredentials);

// --- QUEUE ROUTES (PUBLIC) ---
router.get("/queue", getActiveQueue);
router.get("/queue/stats", getStats);
router.post("/queue/generate", tokenGenerationLimiter, generateToken);
router.post("/queue/cancel/:id", cancelToken); // Cancel endpoint (accessible to users to cancel their own token)

// --- QUEUE ROUTES (ADMIN SECURED) ---
router.post("/queue/complete/:id", authMiddleware, completeHaircut);
router.post("/queue/call-next", authMiddleware, callNext);
router.post("/queue/reset", authMiddleware, async (req, res) => {
  try {
    const { dbService } = await import("../services/dbService.js");
    const { broadcastQueueUpdate } = await import("../sockets/socketHandler.js");
    await dbService.resetQueueDaily();
    const queue = await dbService.getQueue();
    const stats = await dbService.getStats();
    broadcastQueueUpdate(queue, stats);
    res.status(200).json({ success: true, message: "Queue has been manually reset successfully.", queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to reset queue." });
  }
});
router.get("/queue/past", authMiddleware, getPastBookings);

export default router;
