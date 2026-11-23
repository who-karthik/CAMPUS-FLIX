import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import itemRoutes, { memoryItems } from "./routes/items.js";
import authRoutes from "./routes/auth.js";
import matchRoutes from "./routes/matches.js";
import notificationRoutes from "./routes/notifications.js";
import claimRoutes from "./routes/claims.js";
import reminderRoutes from "./routes/reminders.js";
import { initReminderScheduler } from "./services/reminderScheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: "CampusFlix Intelligent Lost & Found API is running",
    database: isMongoConnected ? "MongoDB" : "In-Memory Fallback",
    features: [
      "Mandatory Found Item Image Upload",
      "Intelligent Multi-Factor Matching Engine",
      "Real-Time In-App Notification Center",
      "Automated Day 1/3/7/14 Unresolved Reminders",
      "Claim Verification Workflow",
      "Admin Unresolved Case Management"
    ]
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin/reminders", reminderRoutes);

// Error Handling Middleware
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const start = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lost_found";
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB at", mongoUri.replace(/:([^:@]+)@/, ":****@"));
  } catch (error) {
    console.warn("⚠️ MongoDB connection not available:", error.message);
    console.warn("ℹ️ Running in resilient memory-fallback mode with full Intelligent Matching & Notification capabilities.");
  }

  // Start background reminder scheduler
  initReminderScheduler(() => memoryItems);

  app.listen(PORT, () => console.log(`CampusFlix Server running on http://localhost:${PORT}`));
};

start();
