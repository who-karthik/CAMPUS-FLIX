import mongoose from "mongoose";

const reminderLogSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.Mixed, ref: "Item", required: true },
  userId: { type: String, default: "" },
  userEmail: { type: String, default: "" },
  reminderType: { type: String, required: true }, // "day1", "day3", "day7", "day14", "manual"
  scheduledDay: { type: Number, required: true }, // 1, 3, 7, 14, or 0 for manual
  sentAt: { type: Date, default: Date.now },
  deliveryStatus: { type: String, enum: ["sent", "skipped", "failed"], default: "sent" }
}, { timestamps: true });

reminderLogSchema.index({ itemId: 1, scheduledDay: 1 });

export default mongoose.model("ReminderLog", reminderLogSchema);
