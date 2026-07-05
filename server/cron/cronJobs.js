import cron from "node-cron";
import { dbService } from "../services/dbService.js";
import { broadcastQueueUpdate } from "../sockets/socketHandler.js";

export function initCronJobs() {
  // Run daily at midnight: "0 0 * * *"
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("⏰ Midnight cron triggered! Starting queue reset...");
      await dbService.resetQueueDaily();
      
      const updatedQueue = await dbService.getQueue();
      const stats = await dbService.getStats();
      broadcastQueueUpdate(updatedQueue, stats);
      
      console.log("✅ Midnight cron reset completed successfully.");
    } catch (error) {
      console.error("❌ Error running midnight queue reset cron job:", error);
    }
  });

  console.log("📅 Cron scheduler loaded: Daily reset active at midnight.");
}
