import express from "express";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import ReminderLog from "../models/ReminderLog.js";
import { memoryItems } from "./items.js";
import { memoryReminderLogs, sendManualAdminReminder } from "../services/reminderScheduler.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Helper to calculate priority based on days unresolved
 * Day 0-2: Normal
 * Day 3-6: Needs Attention
 * Day 7-13: High Priority
 * Day 14+: Critical Follow-up
 */
function calculatePriority(days) {
  if (days >= 14) return { priority: "Critical Follow-up", badgeClass: "badge-critical", level: 4 };
  if (days >= 7) return { priority: "High Priority", badgeClass: "badge-high", level: 3 };
  if (days >= 3) return { priority: "Needs Attention", badgeClass: "badge-attention", level: 2 };
  return { priority: "Normal", badgeClass: "badge-normal", level: 1 };
}

/**
 * GET /api/admin/reminders
 * List all unresolved lost items for admin management
 */
router.get("/", async (req, res, next) => {
  try {
    const { filter = "all" } = req.query; // all, attention, high, critical, recent
    let items = [];

    if (isDbConnected()) {
      items = await Item.find({ type: "Lost", status: { $ne: "Returned" } }).sort({ createdAt: -1 });
    } else {
      items = memoryItems.filter((i) => i.type === "Lost" && i.status !== "Returned");
    }

    const now = Date.now();
    const enriched = items.map((raw) => {
      const item = raw.toObject ? raw.toObject() : { ...raw };
      const reportDate = new Date(item.date || item.createdAt).getTime();
      const diffMs = Math.max(0, now - reportDate);
      const daysUnresolved = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const { priority, badgeClass, level } = calculatePriority(daysUnresolved);

      return {
        ...item,
        daysUnresolved,
        priority,
        badgeClass,
        priorityLevel: level
      };
    });

    let filtered = enriched;
    if (filter === "attention") filtered = enriched.filter((i) => i.priorityLevel === 2);
    else if (filter === "high") filtered = enriched.filter((i) => i.priorityLevel === 3);
    else if (filter === "critical") filtered = enriched.filter((i) => i.priorityLevel === 4);
    else if (filter === "recent") filtered = enriched.filter((i) => i.priorityLevel === 1);

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
      summary: {
        total: enriched.length,
        critical: enriched.filter((i) => i.priorityLevel === 4).length,
        high: enriched.filter((i) => i.priorityLevel === 3).length,
        attention: enriched.filter((i) => i.priorityLevel === 2).length,
        normal: enriched.filter((i) => i.priorityLevel === 1).length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/reminders/:itemId/send
 * Trigger manual admin reminder for an item
 */
router.post("/:itemId/send", async (req, res, next) => {
  try {
    const { itemId } = req.params;
    let item = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(itemId)) {
      item = await Item.findById(itemId);
    } else {
      item = memoryItems.find((i) => String(i._id) === itemId);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: "Lost item not found." });
    }

    const result = await sendManualAdminReminder(item, req.user?.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/reminders/history
 * Full reminder history log
 */
router.get("/history", async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const logs = await ReminderLog.find().sort({ sentAt: -1 }).limit(100);
      return res.json({ success: true, count: logs.length, data: logs });
    }
    res.json({ success: true, count: memoryReminderLogs.length, data: memoryReminderLogs });
  } catch (error) {
    next(error);
  }
});

export default router;
