import express from "express";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import { findMatches, calculateMatch, explainMatchFactors } from "../services/matcher.js";
import { memoryItems } from "./items.js";

const router = express.Router();
const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * POST /api/matches/check
 * Explicit manual match query for in-progress report form (Phase 1)
 * Does NOT send notifications or persist matches.
 */
router.post("/check", async (req, res, next) => {
  try {
    const {
      itemName = "",
      type = "Found",
      category = "Other",
      description = "",
      location = "",
      date = new Date(),
      imageUrl = ""
    } = req.body;

    if (!itemName.trim()) {
      return res.status(400).json({ success: false, message: "Item title is required to find matches." });
    }

    if (type === "Found" && (!imageUrl || !String(imageUrl).trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid photograph must be uploaded before finding potential matches for a found item."
      });
    }

    const oppositeType = type === "Lost" ? "Found" : "Lost";
    let candidateItems = [];

    if (isDbConnected()) {
      candidateItems = await Item.find({
        type: oppositeType,
        status: { $ne: "Returned" }
      });
    } else {
      candidateItems = memoryItems.filter(
        (i) => i.type === oppositeType && i.status !== "Returned"
      );
    }

    const tempItem = {
      itemName: itemName.trim(),
      type,
      category: category.trim() || "Other",
      description: description.trim(),
      location: location.trim(),
      date: date || new Date(),
      imageUrl: imageUrl.trim()
    };

    const matches = findMatches(tempItem, candidateItems, false);
    const enrichedMatches = matches.map((m) => ({
      ...m,
      explanation: explainMatchFactors(m.matchingFactors)
    }));

    res.json({
      success: true,
      count: enrichedMatches.length,
      potentialMatchesCount: enrichedMatches.length,
      matches: enrichedMatches,
      data: enrichedMatches
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/matches/suggestions?q=bottle&type=Found
 * Smart suggestions while the user queries in the report form
 */
router.get("/suggestions", async (req, res, next) => {
  try {
    const { q = "", type = "Found", category = "", location = "" } = req.query;
    if (!q.trim() && !category.trim()) {
      return res.json({ success: true, count: 0, suggestions: [], matches: [] });
    }

    const oppositeType = type === "Lost" ? "Found" : "Lost";
    let candidateItems = [];

    if (isDbConnected()) {
      candidateItems = await Item.find({
        type: oppositeType,
        status: { $ne: "Returned" }
      }).limit(50);
    } else {
      candidateItems = memoryItems.filter(
        (i) => i.type === oppositeType && i.status !== "Returned"
      );
    }

    const mockItem = {
      itemName: q.trim(),
      type,
      category: category.trim() || "Other",
      description: q.trim(),
      location: location.trim(),
      date: new Date()
    };

    const matches = findMatches(mockItem, candidateItems, true);
    const enrichedMatches = matches.map((m) => ({
      ...m,
      explanation: explainMatchFactors(m.matchingFactors)
    }));

    // Form suggestions (autocomplete pills)
    const suggestions = candidateItems
      .filter((i) => i.itemName.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map((i) => ({
        id: i._id,
        itemName: i.itemName,
        type: i.type,
        category: i.category,
        location: i.location,
        date: i.date
      }));

    res.json({
      success: true,
      count: enrichedMatches.length,
      potentialMatchesCount: enrichedMatches.length,
      matches: enrichedMatches.slice(0, 6),
      suggestions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/matches/item/:id
 * Get calculated matches for a specific item
 */
router.get("/item/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let targetItem = null;
    let candidates = [];

    if (isDbConnected()) {
      targetItem = await Item.findById(id);
      if (!targetItem) return res.status(404).json({ success: false, message: "Item not found" });
      const oppositeType = targetItem.type === "Lost" ? "Found" : "Lost";
      candidates = await Item.find({ type: oppositeType, status: { $ne: "Returned" } });
    } else {
      targetItem = memoryItems.find((i) => String(i._id) === id);
      if (!targetItem) return res.status(404).json({ success: false, message: "Item not found" });
      const oppositeType = targetItem.type === "Lost" ? "Found" : "Lost";
      candidates = memoryItems.filter((i) => i.type === oppositeType && i.status !== "Returned");
    }

    const matches = findMatches(targetItem, candidates);
    const enrichedMatches = matches.map((m) => ({
      ...m,
      explanation: explainMatchFactors(m.matchingFactors)
    }));

    res.json({
      success: true,
      count: enrichedMatches.length,
      item: targetItem,
      data: enrichedMatches
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/matches/recalculate
 * Bulk calculate and persist matches in DB
 */
router.post("/recalculate", async (req, res, next) => {
  try {
    let lostItems = [];
    let foundItems = [];

    if (isDbConnected()) {
      lostItems = await Item.find({ type: "Lost", status: { $ne: "Returned" } });
      foundItems = await Item.find({ type: "Found", status: { $ne: "Returned" } });
    } else {
      lostItems = memoryItems.filter((i) => i.type === "Lost" && i.status !== "Returned");
      foundItems = memoryItems.filter((i) => i.type === "Found" && i.status !== "Returned");
    }

    let matchCount = 0;
    for (const lost of lostItems) {
      for (const found of foundItems) {
        const result = calculateMatch(lost, found);
        if (result.confidenceScore >= 60) {
          matchCount++;
          if (isDbConnected()) {
            await Match.findOneAndUpdate(
              { lostItemId: lost._id, foundItemId: found._id },
              {
                lostItemId: lost._id,
                foundItemId: found._id,
                confidenceScore: result.confidenceScore,
                matchingFactors: result.matchingFactors,
                status: "suggested"
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Recalculated matches. Found ${matchCount} potential matches.`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
