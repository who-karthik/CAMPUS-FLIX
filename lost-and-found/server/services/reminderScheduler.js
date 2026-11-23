import mongoose from "mongoose";
import cron from "node-cron";
import Item from "../models/Item.js";
import ReminderLog from "../models/ReminderLog.js";
import { sendNotification, notifyAdmins } from "./notificationService.js";

const isDbConnected = () => mongoose.connection.readyState === 1;

// Memory fallback store for reminder logs
export const memoryReminderLogs = [];

/**
 * Check if a reminder for this scheduled day has already been sent
 */
async function hasReminderBeenSent(itemId, scheduledDay) {
  if (isDbConnected()) {
    try {
      const existing = await ReminderLog.findOne({
        itemId: String(itemId),
        scheduledDay
      });
      return !!existing;
    } catch {
      // fallback
    }
  }
  return memoryReminderLogs.some(
    (log) => String(log.itemId) === String(itemId) && log.scheduledDay === scheduledDay
  );
}

/**
 * Record a reminder log
 */
async function logReminder(itemId, userEmail, reminderType, scheduledDay) {
  const logEntry = {
    itemId: String(itemId),
    userId: userEmail,
    userEmail,
    reminderType,
    scheduledDay,
    sentAt: new Date(),
    deliveryStatus: "sent"
  };

  if (isDbConnected()) {
    try {
      await ReminderLog.create(logEntry);
      await Item.findByIdAndUpdate(itemId, {
        lastReminderAt: new Date(),
        $push: {
          reminderHistory: {
            scheduledDay,
            sentAt: new Date(),
            reminderType
          }
        }
      });
      return;
    } catch (err) {
      console.warn("DB log error, logging to memory:", err.message);
    }
  }

  memoryReminderLogs.push(logEntry);
}

/**
 * Process unresolved lost-item reminders
 */
export async function runReminderCheck(inMemoryItemList = []) {
  try {
    let itemsToCheck = [];

    if (isDbConnected()) {
      itemsToCheck = await Item.find({
        type: "Lost",
        status: "Open"
      });
    } else {
      itemsToCheck = inMemoryItemList.filter((i) => i.type === "Lost" && i.status === "Open");
    }

    const now = Date.now();

    for (const item of itemsToCheck) {
      const reportDate = new Date(item.createdAt || item.date).getTime();
      const diffHours = (now - reportDate) / (1000 * 60 * 60);
      const ownerEmail = (item.contact || item.userId || "").trim().toLowerCase();

      if (!ownerEmail) continue;

      // DAY 1 REMINDER (>= 24 hours)
      if (diffHours >= 24 && !(await hasReminderBeenSent(item._id, 1))) {
        await sendNotification({
          userId: ownerEmail,
          userEmail: ownerEmail,
          title: "Unresolved Lost Item Reminder (Day 1)",
          message:
            "Your lost item is still marked as missing. No potential match has been confirmed yet. Your report remains active on CampusFlix.",
          type: "unresolved_reminder",
          relatedItemId: item._id,
          data: { scheduledDay: 1, itemName: item.itemName }
        });
        await logReminder(item._id, ownerEmail, "day1", 1);
      }

      // DAY 3 REMINDER (>= 72 hours)
      if (diffHours >= 72 && !(await hasReminderBeenSent(item._id, 3))) {
        await sendNotification({
          userId: ownerEmail,
          userEmail: ownerEmail,
          title: "Unresolved Lost Item Reminder (Day 3)",
          message:
            "Your missing item is still unresolved. CampusFlix is keeping your report active so the campus community can continue looking for it.",
          type: "unresolved_reminder",
          relatedItemId: item._id,
          data: { scheduledDay: 3, itemName: item.itemName }
        });

        await notifyAdmins(
          "Unresolved Lost Item Alert (Day 3)",
          `Unresolved Lost Item Alert: Student is still waiting for their missing "${item.itemName}". Please review the report.`,
          item._id,
          { scheduledDay: 3, itemName: item.itemName, ownerEmail }
        );

        await logReminder(item._id, ownerEmail, "day3", 3);
      }

      // DAY 7 REMINDER (>= 168 hours)
      if (diffHours >= 168 && !(await hasReminderBeenSent(item._id, 7))) {
        await sendNotification({
          userId: ownerEmail,
          userEmail: ownerEmail,
          title: "Unresolved Lost Item Reminder (Day 7)",
          message:
            "Your missing item report has reached Day 7. It has been highlighted in the Campus Admin Dashboard for special attention.",
          type: "unresolved_reminder",
          relatedItemId: item._id,
          data: { scheduledDay: 7, itemName: item.itemName }
        });

        await notifyAdmins(
          "High Priority Unresolved Case (Day 7)",
          `High Priority Alert: "${item.itemName}" reported by ${ownerEmail} has been open for 7 days. Action required.`,
          item._id,
          { scheduledDay: 7, itemName: item.itemName, ownerEmail }
        );

        if (isDbConnected()) {
          await Item.findByIdAndUpdate(item._id, { needsAttention: true });
        } else {
          item.needsAttention = true;
        }

        await logReminder(item._id, ownerEmail, "day7", 7);
      }

      // DAY 14 REMINDER (>= 336 hours)
      if (diffHours >= 336 && !(await hasReminderBeenSent(item._id, 14))) {
        await sendNotification({
          userId: ownerEmail,
          userEmail: ownerEmail,
          title: "Final Scheduled Reminder (Day 14)",
          message:
            "Your missing item report is 14 days old. CampusFlix will continue displaying it in the campus registry for security audits.",
          type: "unresolved_reminder",
          relatedItemId: item._id,
          data: { scheduledDay: 14, itemName: item.itemName }
        });

        await notifyAdmins(
          "Critical Unresolved Case (Day 14+)",
          `Critical Alert: "${item.itemName}" has been unresolved for 14+ days. Recommended for security desk investigation.`,
          item._id,
          { scheduledDay: 14, itemName: item.itemName, ownerEmail }
        );

        await logReminder(item._id, ownerEmail, "day14", 14);
      }
    }
  } catch (error) {
    console.error("Error running reminder check:", error);
  }
}

/**
 * Send a manual reminder triggered by campus administrator
 */
export async function sendManualAdminReminder(item, adminEmail = "admin@mitaoe.ac.in") {
  const ownerEmail = (item.contact || item.userId || "").trim().toLowerCase();
  if (!ownerEmail) throw new Error("No contact email found for this item's owner.");

  await sendNotification({
    userId: ownerEmail,
    userEmail: ownerEmail,
    title: "Campus Administrator Case Follow-Up",
    message: `Campus Administration is actively following up on your lost "${item.itemName}" report. If you have any new information or found the item, please update the portal.`,
    type: "admin_announcement",
    relatedItemId: item._id,
    data: { manual: true, adminEmail }
  });

  await logReminder(item._id, ownerEmail, "manual", 0);
  return { success: true, message: `Manual reminder sent to ${ownerEmail}` };
}

/**
 * Initialize background cron scheduler
 */
export function initReminderScheduler(getMemoryItems = () => []) {
  // Run every hour
  cron.schedule("0 * * * *", () => {
    console.log("⏰ Running hourly automated lost-item reminder check...");
    runReminderCheck(getMemoryItems());
  });

  // Run on startup after 8 seconds delay
  setTimeout(() => {
    console.log("⏰ Running initial reminder scan...");
    runReminderCheck(getMemoryItems());
  }, 8000);
}
