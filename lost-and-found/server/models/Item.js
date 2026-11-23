import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, required: true, enum: ["Lost", "Found"] },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  contact: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: "" },
  imageRequired: { type: Boolean, default: false },
  status: { type: String, enum: ["Open", "Claimed", "Returned"], default: "Open" },
  userId: { type: String, default: "" },
  reporterName: { type: String, default: "" },
  matchCount: { type: Number, default: 0 },
  needsAttention: { type: Boolean, default: false },
  lastReminderAt: { type: Date, default: null },
  reminderHistory: [{
    scheduledDay: { type: Number },
    sentAt: { type: Date, default: Date.now },
    reminderType: { type: String }
  }],
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Optimize query indexes
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ itemName: "text", description: "text", location: "text" });

export default mongoose.model("Item", itemSchema);
