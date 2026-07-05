import { dbService } from "../services/dbService.js";
import { broadcastQueueUpdate } from "../sockets/socketHandler.js";

export async function getActiveQueue(req, res) {
  try {
    const queue = await dbService.getQueue();
    res.status(200).json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch active queue." });
  }
}

export async function generateToken(req, res) {
  try {
    const { name, phone, service } = req.body;

    if (!name || name.trim() === "") {
      res.status(400).json({ success: false, message: "Customer name is required." });
      return;
    }

    if (!phone) {
      res.status(400).json({ success: false, message: "Mobile number is required." });
      return;
    }

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits." });
      return;
    }

    if (!service || service.trim() === "") {
      res.status(400).json({ success: false, message: "Please select a service." });
      return;
    }

    const newQueueItem = await dbService.addToQueue(name.trim(), digitsOnly, service.trim());
    
    // Refresh stats and broadcast update to all connected clients
    const updatedQueue = await dbService.getQueue();
    const stats = await dbService.getStats();
    broadcastQueueUpdate(updatedQueue, stats);

    res.status(201).json({
      success: true,
      message: `Token #${newQueueItem.tokenNumber} generated successfully!`,
      token: newQueueItem,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to generate token." });
  }
}

export async function completeHaircut(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Customer ID is required." });
      return;
    }

    const { completed, queue } = await dbService.completeHaircut(id);
    const stats = await dbService.getStats();
    
    // Broadcast the update instantly
    broadcastQueueUpdate(queue, stats);

    const completedArray = Array.isArray(completed) ? completed : [completed];
    const tokensDisplay = completedArray.map(c => `#${c.tokenNumber}`).join(", ");

    res.status(200).json({
      success: true,
      message: `Haircut completed for Token ${tokensDisplay}.`,
      completed: completedArray[completedArray.length - 1], // Return last one for client backward compatibility
      queue,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to complete haircut." });
  }
}

export async function cancelToken(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Customer ID is required." });
      return;
    }

    const { cancelled, queue } = await dbService.cancelToken(id);
    const stats = await dbService.getStats();

    // Broadcast the update instantly
    broadcastQueueUpdate(queue, stats);

    res.status(200).json({
      success: true,
      message: `Token #${cancelled.tokenNumber} has been cancelled.`,
      cancelled,
      queue,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Failed to cancel token." });
  }
}

export async function callNext(req, res) {
  try {
    const { nextItem, queue } = await dbService.callNext();
    const stats = await dbService.getStats();

    // Broadcast the update instantly
    broadcastQueueUpdate(queue, stats);

    if (nextItem) {
      res.status(200).json({
        success: true,
        message: `Now calling Token #${nextItem.tokenNumber} (${nextItem.name}) to the chair!`,
        calledItem: nextItem,
        queue,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "No customers in waiting queue.",
        queue,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to call next customer." });
  }
}

export async function getStats(req, res) {
  try {
    const stats = await dbService.getStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch statistics." });
  }
}

export async function getPastBookings(req, res) {
  try {
    const pastBookings = await dbService.getPastBookings();
    res.status(200).json({ success: true, pastBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch past bookings." });
  }
}
