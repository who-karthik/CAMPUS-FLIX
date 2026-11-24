import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Item from "../models/Item.js";
import UserPreferences from "../models/UserPreferences.js";

// In-memory store fallback for notifications and preferences
export const memoryNotifications = [];
export const memoryUserPreferences = new Map();

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Get notification preferences for a user
 */
export async function getUserPreferences(email = "") {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail) {
    return {
      potentialMatches: true,
      unresolvedReminders: true,
      adminAnnouncements: true,
      claimUpdates: true,
      securityAlerts: true
    };
  }

  if (isDbConnected()) {
    try {
      let pref = await UserPreferences.findOne({ userEmail: cleanEmail });
      if (!pref) {
        pref = await UserPreferences.create({ userEmail: cleanEmail });
      }
      return {
        potentialMatches: pref.potentialMatches,
        unresolvedReminders: pref.unresolvedReminders,
        adminAnnouncements: pref.adminAnnouncements,
        claimUpdates: true, // Mandatory
        securityAlerts: true // Mandatory
      };
    } catch (err) {
      console.warn("Preferences DB read error, using memory fallback:", err.message);
    }
  }

  if (!memoryUserPreferences.has(cleanEmail)) {
    memoryUserPreferences.set(cleanEmail, {
      potentialMatches: true,
      unresolvedReminders: true,
      adminAnnouncements: true,
      claimUpdates: true,
      securityAlerts: true
    });
  }

  return { ...memoryUserPreferences.get(cleanEmail), claimUpdates: true, securityAlerts: true };
}

/**
 * Update notification preferences for a user
 */
export async function updateUserPreferences(email = "", updates = {}) {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail) throw new Error("User email is required to update notification preferences.");

  const allowedUpdates = {
    potentialMatches: typeof updates.potentialMatches === "boolean" ? updates.potentialMatches : true,
    unresolvedReminders: typeof updates.unresolvedReminders === "boolean" ? updates.unresolvedReminders : true,
    adminAnnouncements: typeof updates.adminAnnouncements === "boolean" ? updates.adminAnnouncements : true,
    claimUpdates: true, // mandatory - cannot be disabled
    securityAlerts: true // mandatory - cannot be disabled
  };

  if (isDbConnected()) {
    try {
      const saved = await UserPreferences.findOneAndUpdate(
        { userEmail: cleanEmail },
        { ...allowedUpdates, userEmail: cleanEmail },
        { upsert: true, new: true }
      );
      return {
        potentialMatches: saved.potentialMatches,
        unresolvedReminders: saved.unresolvedReminders,
        adminAnnouncements: saved.adminAnnouncements,
        claimUpdates: true,
        securityAlerts: true
      };
    } catch (err) {
      console.warn("Preferences DB save error, using memory fallback:", err.message);
    }
  }

  memoryUserPreferences.set(cleanEmail, allowedUpdates);
  return allowedUpdates;
}

/**
 * Send an in-app notification to a user
 */
export async function sendNotification({
  userId,
  userEmail = "",
  title,
  message,
  type,
  relatedItemId = null,
  matchId = null,
  claimId = null,
  data = {}
}) {
  const recipient = (userId || userEmail || "").trim().toLowerCase();
  if (!recipient) return null;

  // Check user preferences for optional notification types
  // Mandatory types: claim_request, claim_status, item_returned, admin_alert
  const prefs = await getUserPreferences(recipient);

  if (
    (type === "possible_match" || type === "matching_lost_report") &&
    prefs.potentialMatches === false
  ) {
    return null; // User opted out of potential match notifications
  }

  if (type === "unresolved_reminder" && prefs.unresolvedReminders === false) {
    return null; // User opted out of unresolved reminders
  }

  if (type === "admin_announcement" && prefs.adminAnnouncements === false) {
    return null; // User opted out of administrative announcements
  }

  // Check for duplicate recent notification of same type and item to prevent spam
  if (isDbConnected()) {
    try {
      const existing = await Notification.findOne({
        $or: [{ userId: recipient }, { userEmail: recipient }],
        type,
        relatedItemId: relatedItemId ? String(relatedItemId) : null,
        createdAt: { $gte: new Date(Date.now() - 3600000) } // within 1 hour
      });
      if (existing) return existing;

      const notif = await Notification.create({
        userId: recipient,
        userEmail: userEmail || recipient,
        title,
        message,
        type,
        relatedItemId,
        matchId,
        claimId,
        isRead: false,
        data
      });
      return notif;
    } catch (err) {
      console.warn("Notification DB write error, using memory fallback:", err.message);
    }
  }

  // Memory fallback
  const existingMem = memoryNotifications.find(
    (n) =>
      (n.userId === recipient || n.userEmail === recipient) &&
      n.type === type &&
      String(n.relatedItemId) === String(relatedItemId) &&
      Date.now() - new Date(n.createdAt).getTime() < 3600000
  );
  if (existingMem) return existingMem;

  const notif = {
    _id: new mongoose.Types.ObjectId().toString(),
    userId: recipient,
    userEmail: userEmail || recipient,
    title,
    message,
    type,
    relatedItemId,
    matchId,
    claimId,
    isRead: false,
    data,
    createdAt: new Date().toISOString()
  };
  memoryNotifications.unshift(notif);
  return notif;
}

/**
 * Broadcast notifications for matching reports
 */
export async function notifyPotentialMatches(targetItem, matches = []) {
  if (!targetItem || !matches.length) return;

  for (const match of matches) {
    if (match.confidenceScore < 60) continue; // Only notify if >= 60% confidence

    const counterpart = match.item;
    const isTargetFound = targetItem.type === "Found";
    const lostItem = isTargetFound ? counterpart : targetItem;
    const foundItem = isTargetFound ? targetItem : counterpart;

    // Identify owner recipient (contact email or userId)
    const lostOwner = (lostItem.contact || lostItem.userId || "").toLowerCase().trim();
    if (lostOwner) {
      await sendNotification({
        userId: lostOwner,
        userEmail: lostOwner,
        title: "Possible Match Found!",
        message: `Someone has reported finding an item ("${foundItem.itemName}") that may match your lost ${lostItem.itemName} report.`,
        type: "possible_match",
        relatedItemId: foundItem._id,
        data: {
          lostItemId: lostItem._id,
          foundItemId: foundItem._id,
          lostItemName: lostItem.itemName,
          foundItemName: foundItem.itemName,
          confidenceScore: match.confidenceScore,
          foundLocation: foundItem.location,
          foundDate: foundItem.date,
          tier: match.tier
        }
      });
    }

    // Also notify Found reporter if Lost was reported afterwards
    if (!isTargetFound) {
      const foundReporter = (foundItem.contact || foundItem.userId || "").toLowerCase().trim();
      if (foundReporter && foundReporter !== lostOwner) {
        await sendNotification({
          userId: foundReporter,
          userEmail: foundReporter,
          title: "Matching Lost Report Found!",
          message: `A student has just reported losing a "${lostItem.itemName}" matching your found item report.`,
          type: "matching_lost_report",
          relatedItemId: lostItem._id,
          data: {
            lostItemId: lostItem._id,
            foundItemId: foundItem._id,
            confidenceScore: match.confidenceScore,
            tier: match.tier
          }
        });
      }
    }
  }
}

/**
 * Notify all admins
 */
export async function notifyAdmins(title, message, relatedItemId = null, data = {}) {
  const adminRecipient = "admin@mitaoe.ac.in";
  await sendNotification({
    userId: adminRecipient,
    userEmail: adminRecipient,
    title,
    message,
    type: "admin_alert",
    relatedItemId,
    data
  });
}
