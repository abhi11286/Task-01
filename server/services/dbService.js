import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  initMongooseModels,
  AdminModel,
  QueueModel,
  PastBookingModel,
} from "../models/schemas.js";

// Path for local file storage fallback
const LOCAL_DB_PATH = path.resolve(process.cwd(), "local_db.json");

class DbService {
  isConnectedToMongo = false;
  localDB = {
    admins: [],
    queue: [],
    pastBookings: [],
    tokenCounter: 0,
  };

  constructor() {
    this.loadLocalDB();
  }

  // Load local file fallback database
  loadLocalDB() {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
        this.localDB = JSON.parse(data);
      } else {
        this.saveLocalDB();
      }
    } catch (error) {
      console.error("Failed to load local fallback DB:", error);
    }
  }

  // Save local file fallback database
  saveLocalDB() {
    try {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(this.localDB, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save local fallback DB:", error);
    }
  }

  // Connect to MongoDB Atlas or fallback
  async connect() {
    const mongoUri = process.env.MONGODB_URI || "";

    if (!mongoUri || mongoUri.includes("MY_MONGODB_URI") || mongoUri === "") {
      console.log("------------------------------------------------------------------");
      console.log("⚠️  No valid MONGODB_URI found in environment variables.");
      console.log("👉 Using local JSON file storage fallback (local_db.json).");
      console.log("👉 The application is fully functional and data is persistent!");
      console.log("------------------------------------------------------------------");
      this.isConnectedToMongo = false;
      await this.seedDefaultAdmin();
      return false;
    }

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      initMongooseModels(mongoose.connection);
      this.isConnectedToMongo = true;
      console.log("------------------------------------------------------------------");
      console.log("✅ Successfully connected to MongoDB Atlas!");
      console.log("------------------------------------------------------------------");
      await this.seedDefaultAdmin();
      return true;
    } catch (error) {
      console.error("❌ MongoDB connection failed. Falling back to local JSON storage:", error);
      this.isConnectedToMongo = false;
      await this.seedDefaultAdmin();
      return false;
    }
  }

  // Seed default admin account if none exists
  async seedDefaultAdmin() {
    const defaultEmail = (process.env.ADMIN_EMAIL || "admin@happyhappy.com").trim();
    const defaultPassword = process.env.ADMIN_PASSWORD || "adminpassword";
    const defaultName = "Salon Owner";

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    if (this.isConnectedToMongo) {
      try {
        const existing = await AdminModel.findOne({ email: { $regex: new RegExp(`^${defaultEmail}$`, "i") } });
        if (!existing) {
          await AdminModel.create({
            email: defaultEmail,
            passwordHash,
            name: defaultName,
            createdAt: new Date(),
          });
          console.log(`👤 Seeded MongoDB Admin: ${defaultEmail}`);
        }
      } catch (error) {
        console.error("Failed to seed MongoDB Admin:", error);
      }
    } else {
      const existing = this.localDB.admins.find((a) => a.email.toLowerCase() === defaultEmail.toLowerCase());
      if (!existing) {
        this.localDB.admins.push({
          email: defaultEmail,
          passwordHash,
          name: defaultName,
          createdAt: new Date(),
        });
        this.saveLocalDB();
        console.log(`👤 Seeded Local Admin: ${defaultEmail}`);
      }
    }
  }

  // --- ADMIN METHODS ---

  async getAdminByEmail(email) {
    if (this.isConnectedToMongo) {
      const escapedEmail = email.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      return await AdminModel.findOne({ email: { $regex: new RegExp("^" + escapedEmail + "$", "i") } }).lean();
    } else {
      const admin = this.localDB.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
      return admin || null;
    }
  }

  async createAdmin(email, passwordHash, name) {
    if (this.isConnectedToMongo) {
      return await AdminModel.create({ email, passwordHash, name, createdAt: new Date() });
    } else {
      const newAdmin = {
        email,
        passwordHash,
        name,
        createdAt: new Date(),
      };
      this.localDB.admins.push(newAdmin);
      this.saveLocalDB();
      return newAdmin;
    }
  }

  async updateAdmin(oldEmail, newEmail, passwordHash, name) {
    if (this.isConnectedToMongo) {
      const updateData = { email: newEmail, name };
      if (passwordHash) {
        updateData.passwordHash = passwordHash;
      }
      const result = await AdminModel.updateOne({ email: oldEmail }, { $set: updateData });
      return result.modifiedCount > 0;
    } else {
      const admin = this.localDB.admins.find((a) => a.email.toLowerCase() === oldEmail.toLowerCase());
      if (admin) {
        admin.email = newEmail;
        admin.name = name;
        if (passwordHash) {
          admin.passwordHash = passwordHash;
        }
        this.saveLocalDB();
        return true;
      }
      return false;
    }
  }

  // --- QUEUE METHODS ---

  async getQueue() {
    if (this.isConnectedToMongo) {
      return await QueueModel.find().sort({ tokenNumber: 1 }).lean();
    } else {
      return [...this.localDB.queue].sort((a, b) => a.tokenNumber - b.tokenNumber);
    }
  }

  async addToQueue(name, phone, service) {
    // Normalization and validation
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      throw new Error("Mobile number must be exactly 10 digits.");
    }

    // Check duplicate active tokens
    const activeQueue = await this.getQueue();
    const duplicate = activeQueue.find((item) => item.phone.replace(/\D/g, "") === digitsOnly);
    if (duplicate) {
      throw new Error(`You already have an active token (Token #${duplicate.tokenNumber}). Please wait for your turn.`);
    }

    // Determine Token Number
    const nextToken = activeQueue.length + 1;

    if (!this.isConnectedToMongo) {
      this.localDB.tokenCounter = nextToken;
      this.saveLocalDB();
    }

    // Determine status and position
    const servingCount = activeQueue.filter((q) => q.status === "Serving").length;
    const status = servingCount < 2 ? "Serving" : "Waiting";
    const queuePosition = activeQueue.length + 1;

    const newQueueItem = {
      _id: this.isConnectedToMongo ? new mongoose.Types.ObjectId().toString() : Math.random().toString(36).substring(2, 9),
      name,
      phone: digitsOnly,
      service,
      tokenNumber: nextToken,
      queuePosition,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.isConnectedToMongo) {
      await QueueModel.create(newQueueItem);
    } else {
      this.localDB.queue.push(newQueueItem);
      this.saveLocalDB();
    }

    return newQueueItem;
  }

  // Recalculates remaining customer's positions, status, and token numbers sequentially.
  async recalculatePositions(activeList) {
    const sorted = [...activeList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const targetStatus = i < 2 ? "Serving" : "Waiting";
      const targetPosition = i + 1;
      const targetTokenNumber = i + 1;

      if (
        item.status !== targetStatus || 
        item.queuePosition !== targetPosition || 
        item.tokenNumber !== targetTokenNumber
      ) {
        item.status = targetStatus;
        item.queuePosition = targetPosition;
        item.tokenNumber = targetTokenNumber;
        item.updatedAt = new Date();

        if (this.isConnectedToMongo) {
          await QueueModel.updateOne(
            { _id: item._id },
            { 
              $set: { 
                status: targetStatus, 
                queuePosition: targetPosition, 
                tokenNumber: targetTokenNumber, 
                updatedAt: item.updatedAt 
              } 
            }
          );
        }
      }
    }

    if (!this.isConnectedToMongo) {
      this.localDB.queue = sorted;
      this.localDB.tokenCounter = sorted.length;
      this.saveLocalDB();
    }

    return sorted;
  }

  async completeHaircut(idOrIds) {
    const ids = idOrIds.split(",");
    const completedBookings = [];

    for (const id of ids) {
      if (!id.trim()) continue;
      
      let itemToComplete;

      if (this.isConnectedToMongo) {
        const doc = await QueueModel.findById(id).lean();
        if (doc) itemToComplete = doc;
      } else {
        itemToComplete = this.localDB.queue.find((q) => q._id === id);
      }

      if (!itemToComplete) {
        continue;
      }

      const pastBooking = {
        _id: itemToComplete._id,
        name: itemToComplete.name,
        phone: itemToComplete.phone,
        service: itemToComplete.service,
        tokenNumber: itemToComplete.tokenNumber,
        status: "Completed",
        createdAt: itemToComplete.createdAt,
        processedAt: new Date(),
      };

      completedBookings.push(pastBooking);

      if (this.isConnectedToMongo) {
        await PastBookingModel.create(pastBooking);
        await QueueModel.deleteOne({ _id: id });
      } else {
        this.localDB.queue = this.localDB.queue.filter((q) => q._id !== id);
        this.localDB.pastBookings.push(pastBooking);
      }
    }

    if (completedBookings.length === 0) {
      throw new Error("No valid customers found to complete.");
    }

    if (!this.isConnectedToMongo) {
      this.saveLocalDB();
    }

    // Refresh active queue and recalculate positions once for all
    const remainingQueue = await this.getQueue();
    const updatedQueue = await this.recalculatePositions(remainingQueue);

    return { 
      completed: completedBookings.length === 1 ? completedBookings[0] : completedBookings, 
      queue: updatedQueue 
    };
  }

  async cancelToken(id) {
    let itemToCancel;

    if (this.isConnectedToMongo) {
      const doc = await QueueModel.findById(id).lean();
      if (doc) itemToCancel = doc;
    } else {
      itemToCancel = this.localDB.queue.find((q) => q._id === id);
    }

    if (!itemToCancel) {
      throw new Error("Customer not found in the active queue.");
    }

    const pastBooking = {
      _id: itemToCancel._id,
      name: itemToCancel.name,
      phone: itemToCancel.phone,
      service: itemToCancel.service,
      tokenNumber: itemToCancel.tokenNumber,
      status: "Cancelled",
      createdAt: itemToCancel.createdAt,
      processedAt: new Date(),
    };

    if (this.isConnectedToMongo) {
      await PastBookingModel.create(pastBooking);
      await QueueModel.deleteOne({ _id: id });
    } else {
      this.localDB.queue = this.localDB.queue.filter((q) => q._id !== id);
      this.localDB.pastBookings.push(pastBooking);
      this.saveLocalDB();
    }

    // Refresh active queue and recalculate positions
    const remainingQueue = await this.getQueue();
    const updatedQueue = await this.recalculatePositions(remainingQueue);

    return { cancelled: pastBooking, queue: updatedQueue };
  }

  // Call Next Customer pulls the next waiting customer to "Serving" status if there's space
  async callNext() {
    const queue = await this.getQueue();
    const waitingList = queue.filter((q) => q.status === "Waiting");

    if (waitingList.length === 0) {
      return { queue };
    }

    const nextItem = waitingList[0];
    const servingCount = queue.filter((q) => q.status === "Serving").length;

    // If there's space to serve, set to Serving
    if (servingCount < 2) {
      nextItem.status = "Serving";
      nextItem.updatedAt = new Date();

      if (this.isConnectedToMongo) {
        await QueueModel.updateOne({ _id: nextItem._id }, { $set: { status: "Serving", updatedAt: nextItem.updatedAt } });
      } else {
        const item = this.localDB.queue.find((q) => q._id === nextItem._id);
        if (item) {
          item.status = "Serving";
          item.updatedAt = nextItem.updatedAt;
        }
        this.saveLocalDB();
      }
    }

    const updatedQueue = await this.getQueue();
    return { nextItem, queue: updatedQueue };
  }

  // --- PAST BOOKINGS ---

  async getPastBookings() {
    if (this.isConnectedToMongo) {
      return await PastBookingModel.find().sort({ processedAt: -1 }).lean();
    } else {
      return [...this.localDB.pastBookings].sort(
        (a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
      );
    }
  }

  // --- STATS METHOD ---

  async getStats() {
    const active = await this.getQueue();
    const past = await this.getPastBookings();

    const servingCount = active.filter((q) => q.status === "Serving").length;
    const waitingCount = active.filter((q) => q.status === "Waiting").length;
    const completedCount = past.filter((p) => p.status === "Completed").length;
    const cancelledCount = past.filter((p) => p.status === "Cancelled").length;

    // Total appointments today = active queue size + past bookings completed/cancelled today
    const totalAppointments = active.length + past.length;

    return {
      totalAppointments,
      remainingCustomers: active.length,
      completedCustomers: completedCount,
      cancelledCustomers: cancelledCount,
      servingCustomers: servingCount,
      waitingCustomers: waitingCount,
    };
  }

  // --- DAILY RESET METHOD ---

  async resetQueueDaily() {
    console.log("⏰ Executing daily queue automatic reset...");
    
    const activeList = await this.getQueue();
    for (const item of activeList) {
      const pastBooking = {
        _id: item._id,
        name: item.name,
        phone: item.phone,
        service: item.service,
        tokenNumber: item.tokenNumber,
        status: "Cancelled",
        createdAt: item.createdAt,
        processedAt: new Date(),
      };

      if (this.isConnectedToMongo) {
        await PastBookingModel.create(pastBooking);
      } else {
        this.localDB.pastBookings.push(pastBooking);
      }
    }

    if (this.isConnectedToMongo) {
      await QueueModel.deleteMany({});
    } else {
      this.localDB.queue = [];
      this.localDB.tokenCounter = 0; // reset token counter
      this.saveLocalDB();
    }
    
    console.log("✅ Daily queue reset completed successfully.");
  }
}

export const dbService = new DbService();
