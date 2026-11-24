import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Item from "../models/Item.js";
import { findMatches, calculateMatch, findDuplicates } from "../services/matcher.js";
import { notifyPotentialMatches, sendNotification } from "../services/notificationService.js";
import { authenticate } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `item-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP image formats are supported."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

const router = express.Router();
router.use(authenticate);
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const isDbConnected = () => mongoose.connection.readyState === 1;

export let memoryItems = [
  {
    _id: "672465e1d71cb30012340001",
    itemName: "Scientific Calculator (Casio fx-991EX)",
    type: "Lost",
    category: "Electronics",
    description: "Casio ClassWiz fx-991EX with white sliding cover. Left in Computer Lab 304 after Practical Exam.",
    location: "Computer Lab 304 (Desk 12)",
    date: new Date().toISOString().slice(0, 10),
    contact: "priya.sharma@mitaoe.ac.in",
    imageUrl: "/images/calculator.jpg",
    imageRequired: false,
    status: "Open",
    matchCount: 0,
    needsAttention: false,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: "672465e1d71cb30012340002",
    itemName: "Black Leather Bi-Fold Wallet",
    type: "Lost",
    category: "Accessories",
    description: "Black Tommy Hilfiger leather wallet with student ID card and college bus pass inside.",
    location: "Central Library 2nd Floor",
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    contact: "rahul.patil@mitaoe.ac.in",
    imageUrl: "/images/wallet.jpg",
    imageRequired: false,
    status: "Open",
    matchCount: 0,
    needsAttention: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: "672465e1d71cb30012340003",
    itemName: "Stainless Steel Thermal Water Bottle",
    type: "Found",
    category: "Other",
    description: "Milton blue metallic insulated flask found on the cafeteria bench after lunch.",
    location: "Campus Cafeteria Courtyard",
    date: new Date().toISOString().slice(0, 10),
    contact: "security@mitaoe.ac.in",
    imageUrl: "/images/bottle.jpg",
    imageRequired: true,
    status: "Open",
    matchCount: 1,
    needsAttention: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: "672465e1d71cb30012340004",
    itemName: "Sony Wireless Over-Ear Headphones",
    type: "Found",
    category: "Electronics",
    description: "Matte black noise-cancelling headphones in a protective zip case. Handed in to Security Desk.",
    location: "Audi-2 Lecture Hall",
    date: new Date().toISOString().slice(0, 10),
    contact: "security@mitaoe.ac.in",
    imageUrl: "/images/headphones.jpg",
    imageRequired: true,
    status: "Open",
    matchCount: 0,
    needsAttention: false,
    createdAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    _id: "672465e1d71cb30012340005",
    itemName: "Campus Hostel Room Keys with MITAOE Lanyard",
    type: "Found",
    category: "Keys",
    description: "Set of two Godrej brass keys on a red campus lanyard with room tag #B-312.",
    location: "Boys Hostel Block B Entry",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    contact: "hostel.warden@mitaoe.ac.in",
    imageUrl: "/images/keys.jpg",
    imageRequired: true,
    status: "Claimed",
    matchCount: 0,
    needsAttention: false,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: "672465e1d71cb30012340006",
    itemName: "Waterproof Laptop Backpack (Charcoal Gray)",
    type: "Lost",
    category: "Bags",
    description: "American Tourister gray backpack containing a 15-inch laptop sleeve and notes binder.",
    location: "Sports Ground Bleachers",
    date: new Date(Date.now() - 86400000 * 8).toISOString().slice(0, 10),
    contact: "amit.kulkarni@mitaoe.ac.in",
    imageUrl: "/images/backpack.jpg",
    imageRequired: false,
    status: "Open",
    matchCount: 0,
    needsAttention: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    _id: "672465e1d71cb30012340007",
    itemName: "Advanced Engineering Mathematics (Erwin Kreyszig)",
    type: "Found",
    category: "Books",
    description: "10th Edition Wiley textbook with green bookmark and name penciled on first page.",
    location: "Library Reading Hall #3",
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    contact: "library.desk@mitaoe.ac.in",
    imageUrl: "/images/book.jpg",
    imageRequired: true,
    status: "Returned",
    matchCount: 0,
    needsAttention: false,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    _id: "672465e1d71cb30012340008",
    itemName: "Fitness Smart Watch with Black Silicone Band",
    type: "Lost",
    category: "Electronics",
    description: "Black digital fitness tracker with cracked screen protector. Lost during gym workout.",
    location: "Campus Gymnasium",
    date: new Date(Date.now() - 86400000 * 15).toISOString().slice(0, 10),
    contact: "rohan.deshmukh@mitaoe.ac.in",
    imageUrl: "/images/watch.jpg",
    imageRequired: false,
    status: "Returned",
    matchCount: 0,
    needsAttention: false,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  }
];

/**
 * POST /api/items/upload-image
 * Mandatory Found item and optional Lost item image upload
 */
router.post("/upload-image", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image file exceeds maximum allowed size of 5 MB."
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please choose a JPG, PNG, or WEBP file."
      });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

/**
 * GET /api/items
 */
router.get("/", async (req, res, next) => {
  try {
    const { type, q, status } = req.query;
    if (isDbConnected()) {
      const filter = {};
      if (["Lost", "Found"].includes(type)) filter.type = type;
      if (["Open", "Claimed", "Returned"].includes(status)) filter.status = status;
      if (q?.trim()) {
        const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ itemName: regex }, { category: regex }, { location: regex }, { description: regex }];
      }
      const items = await Item.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: items.length, data: items });
    }

    let items = [...memoryItems];
    if (["Lost", "Found"].includes(type)) {
      items = items.filter((i) => i.type === type);
    }
    if (["Open", "Claimed", "Returned"].includes(status)) {
      items = items.filter((i) => i.status === status);
    }
    if (q?.trim()) {
      const term = q.trim().toLowerCase();
      items = items.filter((i) =>
        (i.itemName && i.itemName.toLowerCase().includes(term)) ||
        (i.category && i.category.toLowerCase().includes(term)) ||
        (i.location && i.location.toLowerCase().includes(term)) ||
        (i.description && i.description.toLowerCase().includes(term))
      );
    }
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: items.length, data: items });
  } catch (error) { next(error); }
});

/**
 * GET /api/items/:id
 */
router.get("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id) && !memoryItems.some((i) => String(i._id) === req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }
    if (isDbConnected() && validId(req.params.id)) {
      const item = await Item.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Item not found" });
      return res.json({ success: true, data: item });
    }

    const item = memoryItems.find((i) => String(i._id) === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
});

/**
 * POST /api/items
 * Reports a new Lost or Found item with image requirement validation and matching
 */
router.post("/", async (req, res, next) => {
  try {
    const required = ["itemName", "type", "category", "description", "location", "date", "contact"];
    const missing = required.filter((key) => !String(req.body[key] ?? "").trim());
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Required fields: ${missing.join(", ")}` });
    }
    if (!["Lost", "Found"].includes(req.body.type)) {
      return res.status(400).json({ success: false, message: "Type must be Lost or Found" });
    }

    // MANDATORY IMAGE CHECK FOR FOUND ITEMS
    if (req.body.type === "Found") {
      const imageGiven = req.body.imageUrl && String(req.body.imageUrl).trim().length > 0;
      if (!imageGiven) {
        return res.status(400).json({
          success: false,
          message: "Uploading a photograph is mandatory when reporting a found item. This helps the rightful owner identify their belongings."
        });
      }
    }

    const itemData = {
      itemName: req.body.itemName.trim(),
      type: req.body.type,
      category: req.body.category.trim(),
      description: req.body.description.trim(),
      location: req.body.location.trim(),
      date: req.body.date,
      contact: req.body.contact.trim(),
      imageUrl: req.body.imageUrl?.trim() || "",
      imageRequired: req.body.type === "Found",
      status: req.body.status && ["Open", "Claimed", "Returned"].includes(req.body.status) ? req.body.status : "Open",
      userId: req.body.userId || req.body.contact.trim().toLowerCase(),
      reporterName: req.body.reporterName || "",
      matchCount: 0,
      needsAttention: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let createdItem = null;

    if (isDbConnected()) {
      createdItem = await Item.create(itemData);
    } else {
      createdItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...itemData
      };
      memoryItems.unshift(createdItem);
    }

    // TRIGGER INTELLIGENT MATCHING & REAL-TIME NOTIFICATIONS
    try {
      let candidateItems = [];
      const oppositeType = createdItem.type === "Lost" ? "Found" : "Lost";

      if (isDbConnected()) {
        candidateItems = await Item.find({ type: oppositeType, status: { $ne: "Returned" } });
      } else {
        candidateItems = memoryItems.filter((i) => i.type === oppositeType && i.status !== "Returned");
      }

      const matches = findMatches(createdItem, candidateItems);
      const significantMatches = matches.filter((m) => m.confidenceScore >= 60);

      if (significantMatches.length > 0) {
        createdItem.matchCount = significantMatches.length;
        if (isDbConnected()) {
          await Item.findByIdAndUpdate(createdItem._id, { matchCount: significantMatches.length });
        }

        // Notify matching users in background
        await notifyPotentialMatches(createdItem, significantMatches);
      }
    } catch (matchErr) {
      console.warn("Matching check error:", matchErr.message);
    }

    res.status(201).json({
      success: true,
      data: createdItem,
      matchCount: createdItem.matchCount || 0
    });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
});

/**
 * POST /api/items/check-duplicate
 * Checks if a potentially duplicate report already exists (Phase 3)
 */
router.post("/check-duplicate", async (req, res, next) => {
  try {
    const { itemName, type, category, description, location, date } = req.body;
    if (!itemName?.trim()) {
      return res.json({ success: true, isDuplicate: false, count: 0, duplicates: [] });
    }

    let candidates = [];
    if (isDbConnected()) {
      candidates = await Item.find({
        type: type || "Lost",
        status: { $ne: "Returned" }
      }).limit(100);
    } else {
      candidates = memoryItems.filter(
        (i) => i.type === (type || "Lost") && i.status !== "Returned"
      );
    }

    const tempItem = {
      itemName: itemName.trim(),
      type: type || "Lost",
      category: category?.trim() || "Other",
      description: description?.trim() || "",
      location: location?.trim() || "",
      date: date || new Date()
    };

    const duplicates = findDuplicates(tempItem, candidates);
    res.json({
      success: true,
      isDuplicate: duplicates.length > 0,
      hasDuplicate: duplicates.length > 0,
      count: duplicates.length,
      duplicates,
      existingItem: duplicates[0]?.item || null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/items/:id
 */
router.put("/:id", async (req, res, next) => {
  try {
    const allowed = ["itemName", "type", "category", "description", "location", "date", "contact", "imageUrl", "status"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

    // Fetch existing item for ownership check
    let existing = null;
    if (isDbConnected() && validId(req.params.id)) {
      existing = await Item.findById(req.params.id);
    } else {
      existing = memoryItems.find((i) => String(i._id) === req.params.id);
    }

    if (!existing) return res.status(404).json({ success: false, message: "Item not found" });

    // Strict ownership verification: students can only edit their own reports
    if (req.user && req.user.role !== "admin") {
      const userEmail = (req.user.email || "").toLowerCase().trim();
      const ownerEmail = (existing.contact || existing.userId || "").toLowerCase().trim();
      if (userEmail && ownerEmail && userEmail !== ownerEmail) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to edit reports belonging to other users."
        });
      }
    }

    if (isDbConnected() && validId(req.params.id)) {
      const item = await Item.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      return res.json({ success: true, data: item });
    }

    const index = memoryItems.findIndex((i) => String(i._id) === req.params.id);
    memoryItems[index] = { ...memoryItems[index], ...updates, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: memoryItems[index] });
  } catch (error) { next(error); }
});

/**
 * PATCH /api/items/:id/status
 */
router.patch("/:id/status", async (req, res, next) => {
  try {
    if (!["Open", "Claimed", "Returned"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    let updated = null;

    if (isDbConnected() && validId(req.params.id)) {
      updated = await Item.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );
    } else {
      const index = memoryItems.findIndex((i) => String(i._id) === req.params.id);
      if (index !== -1) {
        memoryItems[index].status = req.body.status;
        memoryItems[index].updatedAt = new Date().toISOString();
        updated = memoryItems[index];
      }
    }

    if (!updated) return res.status(404).json({ success: false, message: "Item not found" });

    // If marked as Returned, notify owner and conclude case
    if (req.body.status === "Returned") {
      const ownerEmail = (updated.contact || updated.userId || "").toLowerCase().trim();
      if (ownerEmail) {
        await sendNotification({
          userId: ownerEmail,
          userEmail: ownerEmail,
          title: "Item Case Resolved - Marked as Returned",
          message: `Great news! Your ${updated.type.toLowerCase()} item "${updated.itemName}" has been successfully marked as Returned. Thank you for using CampusFlix!`,
          type: "item_returned",
          relatedItemId: updated._id
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/items/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    // Fetch existing item for ownership check
    let existing = null;
    if (isDbConnected() && validId(req.params.id)) {
      existing = await Item.findById(req.params.id);
    } else {
      existing = memoryItems.find((i) => String(i._id) === req.params.id);
    }

    if (!existing) return res.status(404).json({ success: false, message: "Item not found" });

    // Strict ownership verification: students can only delete their own reports
    if (req.user && req.user.role !== "admin") {
      const userEmail = (req.user.email || "").toLowerCase().trim();
      const ownerEmail = (existing.contact || existing.userId || "").toLowerCase().trim();
      if (userEmail && ownerEmail && userEmail !== ownerEmail) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete reports belonging to other users."
        });
      }
    }

    if (isDbConnected() && validId(req.params.id)) {
      await Item.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: "Report deleted" });
    }

    const index = memoryItems.findIndex((i) => String(i._id) === req.params.id);
    if (index !== -1) {
      memoryItems.splice(index, 1);
    }
    res.json({ success: true, message: "Report deleted" });
  } catch (error) { next(error); }
});

export default router;
