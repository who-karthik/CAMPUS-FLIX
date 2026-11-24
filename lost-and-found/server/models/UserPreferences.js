import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  potentialMatches: { type: Boolean, default: true },
  unresolvedReminders: { type: Boolean, default: true },
  adminAnnouncements: { type: Boolean, default: true },
  // Mandatory alerts - cannot be disabled by user
  claimUpdates: { type: Boolean, default: true },
  securityAlerts: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("UserPreferences", userPreferencesSchema);
