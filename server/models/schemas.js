import mongoose from "mongoose";

// Mongoose Schemas (Only instantiated when MongoDB is connected)
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const QueueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  queuePosition: { type: Number, required: true },
  status: { type: String, enum: ["Serving", "Waiting"], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PastBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  status: { type: String, enum: ["Completed", "Cancelled"], required: true },
  createdAt: { type: Date, required: true },
  processedAt: { type: Date, default: Date.now }
});

// Create Mongoose Models
export let AdminModel;
export let QueueModel;
export let PastBookingModel;

export function initMongooseModels(connection) {
  AdminModel = connection.model("Admin", AdminSchema);
  QueueModel = connection.model("Queue", QueueSchema);
  PastBookingModel = connection.model("PastBooking", PastBookingSchema);
}
