import express from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { memoryNotifications } from "../services/notificationService.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Helper to determine user identifier
 */
function getUserIdentifier(req) {
  if (req.user && req.user.email) return req.user.email.toLowerCase().trim();
  const queryUser = req.query.userId || req.query.userEmail;
  if (queryUser) return String(queryUser).toLowerCase().trim();
  return "student@mitaoe.ac.in"; // Fallback demo default
}

/**
 * GET /api/notifications
 * Get notifications for current user
 */
router.get("/", async (req, res, next) => {
  try {
    const userIdentifier = getUserIdentifier(req);
    const { unreadOnly } = req.query;

    if (isDbConnected()) {
      const filter = {
        $or: [{ userId: userIdentifier }, { userEmail: userIdentifier }]
      };
      if (unreadOnly === "true") filter.isRead = false;

      // Also include admin alerts if user is admin
      if (req.user?.role === "admin" || userIdentifier.includes("admin")) {
        filter.$or.push({ type: "admin_alert" });
      }

      const notifs = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, count: notifs.length, data: notifs });
    }

    // Memory fallback
    let list = memoryNotifications.filter((n) => {
      const isOwner = n.userId === userIdentifier || n.userEmail === userIdentifier;
      const isAdminAlert =
        (req.user?.role === "admin" || userIdentifier.includes("admin")) &&
        n.type === "admin_alert";
      return isOwner || isAdminAlert;
    });

    if (unreadOnly === "true") {
      list = list.filter((n) => !n.isRead);
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/unread-count
 */
router.get("/unread-count", async (req, res, next) => {
  try {
    const userIdentifier = getUserIdentifier(req);

    if (isDbConnected()) {
      const filter = {
        $or: [{ userId: userIdentifier }, { userEmail: userIdentifier }],
        isRead: false
      };
      if (req.user?.role === "admin" || userIdentifier.includes("admin")) {
        filter.$or.push({ type: "admin_alert", isRead: false });
      }
      const count = await Notification.countDocuments(filter);
      return res.json({ success: true, unreadCount: count });
    }

    const count = memoryNotifications.filter((n) => {
      const isOwner = n.userId === userIdentifier || n.userEmail === userIdentifier;
      const isAdminAlert =
        (req.user?.role === "admin" || userIdentifier.includes("admin")) &&
        n.type === "admin_alert";
      return (isOwner || isAdminAlert) && !n.isRead;
    }).length;

    res.json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const updated = await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: "Notification not found" });
      return res.json({ success: true, data: updated });
    }

    const item = memoryNotifications.find((n) => String(n._id) === id);
    if (!item) return res.status(404).json({ success: false, message: "Notification not found" });
    item.isRead = true;
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/notifications/read-all
 */
router.patch("/read-all", async (req, res, next) => {
  try {
    const userIdentifier = getUserIdentifier(req);

    if (isDbConnected()) {
      await Notification.updateMany(
        {
          $or: [
            { userId: userIdentifier },
            { userEmail: userIdentifier },
            { type: "admin_alert" }
          ]
        },
        { isRead: true }
      );
      return res.json({ success: true, message: "All notifications marked as read" });
    }

    memoryNotifications.forEach((n) => {
      if (
        n.userId === userIdentifier ||
        n.userEmail === userIdentifier ||
        n.type === "admin_alert"
      ) {
        n.isRead = true;
      }
    });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/notifications/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      await Notification.findByIdAndDelete(id);
      return res.json({ success: true, message: "Notification deleted" });
    }

    const idx = memoryNotifications.findIndex((n) => String(n._id) === id);
    if (idx !== -1) {
      memoryNotifications.splice(idx, 1);
    }
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
