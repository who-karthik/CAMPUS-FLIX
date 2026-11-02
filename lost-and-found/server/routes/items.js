import express from "express";
import mongoose from "mongoose";
import Item from "../models/Item.js";

const router = express.Router();
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

let memoryItems = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Scientific Calculator (Casio fx-991EX)",
    type: "Lost",
    category: "Electronics",
    description: "Casio ClassWiz fx-991EX with white sliding cover. Left in Computer Lab 304 after Practical Exam.",
    location: "Computer Lab 304 (Desk 12)",
    date: new Date().toISOString().slice(0, 10),
    contact: "priya.sharma@mitaoe.ac.in",
    imageUrl: "/images/calculator.jpg",
    status: "Open",
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Black Leather Bi-Fold Wallet",
    type: "Lost",
    category: "Accessories",
    description: "Black Tommy Hilfiger leather wallet with student ID card and college bus pass inside.",
    location: "Central Library 2nd Floor",
    date: new Date().toISOString().slice(0, 10),
    contact: "rahul.patil@mitaoe.ac.in",
    imageUrl: "/images/wallet.jpg",
    status: "Open",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Stainless Steel Thermal Water Bottle",
    type: "Found",
    category: "Other",
    description: "Milton blue metallic insulated flask found on the cafeteria bench after lunch.",
    location: "Campus Cafeteria Courtyard",
    date: new Date().toISOString().slice(0, 10),
    contact: "security@mitaoe.ac.in",
    imageUrl: "/images/bottle.jpg",
    status: "Open",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Sony Wireless Over-Ear Headphones",
    type: "Found",
    category: "Electronics",
    description: "Matte black noise-cancelling headphones in a protective zip case. Handed in to Security Desk.",
    location: "Audi-2 Lecture Hall",
    date: new Date().toISOString().slice(0, 10),
    contact: "security@mitaoe.ac.in",
    imageUrl: "/images/headphones.jpg",
    status: "Open",
    createdAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Campus Hostel Room Keys with MITAOE Lanyard",
    type: "Found",
    category: "Keys",
    description: "Set of two Godrej brass keys on a red campus lanyard with room tag #B-312.",
    location: "Boys Hostel Block B Entry",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    contact: "hostel.warden@mitaoe.ac.in",
    imageUrl: "/images/keys.jpg",
    status: "Claimed",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Waterproof Laptop Backpack (Charcoal Gray)",
    type: "Lost",
    category: "Bags",
    description: "American Tourister gray backpack containing a 15-inch laptop sleeve and notes binder.",
    location: "Sports Ground Bleachers",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    contact: "amit.kulkarni@mitaoe.ac.in",
    imageUrl: "/images/backpack.jpg",
    status: "Open",
    createdAt: new Date(Date.now() - 90000000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Advanced Engineering Mathematics (Erwin Kreyszig)",
    type: "Found",
    category: "Books",
    description: "10th Edition Wiley textbook with green bookmark and name penciled on first page.",
    location: "Library Reading Hall #3",
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    contact: "library.desk@mitaoe.ac.in",
    imageUrl: "/images/book.jpg",
    status: "Returned",
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    itemName: "Fitness Smart Watch with Black Silicone Band",
    type: "Lost",
    category: "Electronics",
    description: "Black digital fitness tracker with cracked screen protector. Lost during gym workout.",
    location: "Campus Gymnasium",
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    contact: "rohan.deshmukh@mitaoe.ac.in",
    imageUrl: "/images/watch.jpg",
    status: "Returned",
    createdAt: new Date(Date.now() - 180000000).toISOString()
  }
];

const isDbConnected = () => mongoose.connection.readyState === 1;

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

router.get("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid item ID" });
    if (isDbConnected()) {
      const item = await Item.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Item not found" });
      return res.json({ success: true, data: item });
    }

    const item = memoryItems.find((i) => String(i._id) === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const required = ["itemName", "type", "category", "description", "location", "date", "contact"];
    const missing = required.filter((key) => !String(req.body[key] ?? "").trim());
    if (missing.length) return res.status(400).json({ success: false, message: `Required fields: ${missing.join(", ")}` });
    if (!["Lost", "Found"].includes(req.body.type)) return res.status(400).json({ success: false, message: "Type must be Lost or Found" });

    if (isDbConnected()) {
      const item = await Item.create(req.body);
      return res.status(201).json({ success: true, data: item });
    }

    const newItem = {
      _id: new mongoose.Types.ObjectId().toString(),
      itemName: req.body.itemName.trim(),
      type: req.body.type,
      category: req.body.category.trim(),
      description: req.body.description.trim(),
      location: req.body.location.trim(),
      date: req.body.date,
      contact: req.body.contact.trim(),
      imageUrl: req.body.imageUrl?.trim() || "",
      status: req.body.status && ["Open", "Claimed", "Returned"].includes(req.body.status) ? req.body.status : "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryItems.unshift(newItem);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: error.message });
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid item ID" });
    const allowed = ["itemName", "type", "category", "description", "location", "date", "contact", "imageUrl", "status"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

    if (isDbConnected()) {
      const item = await Item.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: "Item not found" });
      return res.json({ success: true, data: item });
    }

    const index = memoryItems.findIndex((i) => String(i._id) === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Item not found" });
    memoryItems[index] = { ...memoryItems[index], ...updates, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: memoryItems[index] });
  } catch (error) { next(error); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid item ID" });
    if (!["Open", "Claimed", "Returned"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid status" });

    if (isDbConnected()) {
      const item = await Item.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: "Item not found" });
      return res.json({ success: true, data: item });
    }

    const index = memoryItems.findIndex((i) => String(i._id) === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Item not found" });
    memoryItems[index].status = req.body.status;
    memoryItems[index].updatedAt = new Date().toISOString();
    res.json({ success: true, data: memoryItems[index] });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid item ID" });

    if (isDbConnected()) {
      const item = await Item.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Item not found" });
      return res.json({ success: true, message: "Report deleted" });
    }

    const index = memoryItems.findIndex((i) => String(i._id) === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: "Item not found" });
    memoryItems.splice(index, 1);
    res.json({ success: true, message: "Report deleted" });
  } catch (error) { next(error); }
});

export default router;
