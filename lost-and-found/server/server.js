import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import itemRoutes from "./routes/items.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: "Lost & Found API is running",
    database: isMongoConnected ? "MongoDB" : "In-Memory Fallback"
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const start = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lost_found";
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log("Connected to MongoDB at", mongoUri);
  } catch (error) {
    console.warn("⚠️ MongoDB connection not available:", error.message);
    console.warn("ℹ️ Running in memory-fallback mode so the application runs immediately.");
    console.warn("ℹ️ To connect to MongoDB, start MongoDB locally or configure MONGO_URI in server/.env");
  }
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};
start();
