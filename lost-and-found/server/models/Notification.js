import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, default: "" },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: [
      "possible_match",
      "matching_lost_report",
      "claim_request",
      "claim_status",
      "item_returned",
      "unresolved_reminder",
      "admin_alert",
      "admin_announcement"
    ]
  },
  relatedItemId: { type: mongoose.Schema.Types.Mixed, ref: "Item" },
  matchId: { type: mongoose.Schema.Types.Mixed, ref: "Match" },
  claimId: { type: mongoose.Schema.Types.Mixed, ref: "Claim" },
  isRead: { type: Boolean, default: false, index: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
