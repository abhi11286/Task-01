import { Server as SocketIOServer } from "socket.io";

let io = null;

export function initSocket(server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Allow all origins for developers
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Allow clients to join specialized rooms if needed
    socket.on("join:queue", () => {
      socket.join("queue_updates");
      console.log(`👤 Client ${socket.id} joined queue updates channel`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized. Call initSocket(server) first.");
  }
  return io;
}

// Broadcasts updated active queue and stats to all connected clients
export function broadcastQueueUpdate(queue, stats) {
  if (io) {
    io.emit("queue:updated", { queue, stats });
    console.log("📢 Broadcasted queue update to all connected clients");
  }
}
