import express from "express";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import Claim from "../models/Claim.js";
import Match from "../models/Match.js";
import { memoryItems } from "./items.js";
import { memoryClaims } from "./claims.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);
router.use(requireAdmin);

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Helper to get month label "MMM YYYY"
 */
function getMonthLabel(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * GET /api/admin/analytics
 * Real analytics based on actual database records (Phase 9)
 */
router.get("/", async (_req, res, next) => {
  try {
    let items = [];
    let claims = [];
    let matchCount = 0;

    if (isDbConnected()) {
      items = await Item.find().sort({ createdAt: -1 });
      claims = await Claim.find().sort({ createdAt: -1 });
      matchCount = await Match.countDocuments();
    } else {
      items = [...memoryItems];
      claims = [...memoryClaims];
      matchCount = items.reduce((acc, it) => acc + (it.matchCount || 0), 0);
    }

    const totalReports = items.length;
    const totalLost = items.filter((i) => i.type === "Lost").length;
    const totalFound = items.filter((i) => i.type === "Found").length;
    const totalReturned = items.filter((i) => i.status === "Returned").length;
    const activeUnresolved = items.filter((i) => i.type === "Lost" && i.status !== "Returned").length;
    const pendingClaims = claims.filter((c) => c.status === "pending").length;
    const totalApprovedClaims = claims.filter((c) => c.status === "approved").length;

    // Average resolution time (in days) for items with status 'Returned'
    const returnedItems = items.filter((i) => i.status === "Returned" && i.updatedAt && i.createdAt);
    let avgResolutionDays = 0;
    if (returnedItems.length > 0) {
      const totalDurationMs = returnedItems.reduce((acc, it) => {
        const start = new Date(it.createdAt).getTime();
        const end = new Date(it.updatedAt).getTime();
        const diff = Math.max(0, end - start);
        return acc + diff;
      }, 0);
      avgResolutionDays = parseFloat((totalDurationMs / (returnedItems.length * 1000 * 60 * 60 * 24)).toFixed(1));
    }

    // Monthly recovery rate (percentage of items returned)
    const monthlyRecoveryRate = totalReports > 0
      ? Math.round((totalReturned / totalReports) * 100)
      : 0;

    // Match-to-claim conversion rate
    const effectiveMatchCount = Math.max(matchCount, items.filter((i) => i.matchCount > 0).length, claims.length);
    const matchToClaimConversionRate = effectiveMatchCount > 0
      ? Math.min(100, Math.round((claims.length / effectiveMatchCount) * 100))
      : 0;

    // Most frequently lost categories
    const lostCatCounts = {};
    items.filter((i) => i.type === "Lost").forEach((it) => {
      const cat = it.category || "Other";
      lostCatCounts[cat] = (lostCatCounts[cat] || 0) + 1;
    });
    const mostFrequentlyLostCategories = Object.entries(lostCatCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Most frequently reported campus locations
    const locCounts = {};
    items.forEach((it) => {
      const loc = it.location ? it.location.split("(")[0].trim() : "Unknown";
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });
    const mostFrequentlyReportedLocations = Object.entries(locCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    // Category distribution across all items
    const allCatCounts = {};
    items.forEach((it) => {
      const cat = it.category || "Other";
      allCatCounts[cat] = (allCatCounts[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(allCatCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Monthly Lost vs Found comparison (last 6 months)
    const monthsMap = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      monthsMap.set(label, { month: label, lost: 0, found: 0, returned: 0 });
    }

    items.forEach((it) => {
      const d = new Date(it.createdAt || it.date);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      if (monthsMap.has(label)) {
        const m = monthsMap.get(label);
        if (it.type === "Lost") m.lost++;
        if (it.type === "Found") m.found++;
        if (it.status === "Returned") m.returned++;
      }
    });
    const monthlyComparison = Array.from(monthsMap.values());

    // Recovery trend
    const recoveryTrend = monthlyComparison.map((m) => ({
      month: m.month,
      returned: m.returned,
      total: m.lost + m.found,
      rate: (m.lost + m.found) > 0 ? Math.round((m.returned / (m.lost + m.found)) * 100) : 0
    }));

    // Campus Hotspot Distribution
    const hotspotMap = {};
    items.forEach((it) => {
      const loc = it.location ? it.location.split("(")[0].trim() : "Campus";
      if (!hotspotMap[loc]) {
        hotspotMap[loc] = { location: loc, lostCount: 0, foundCount: 0, total: 0 };
      }
      if (it.type === "Lost") hotspotMap[loc].lostCount++;
      if (it.type === "Found") hotspotMap[loc].foundCount++;
      hotspotMap[loc].total++;
    });
    const campusHotspots = Object.values(hotspotMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Unresolved cases by priority
    const unresolvedByPriority = {
      critical: 0, // Day 14+
      high: 0,     // Day 7-13
      attention: 0,// Day 3-6
      normal: 0    // Day 0-2
    };

    const currentTime = Date.now();
    items
      .filter((i) => i.type === "Lost" && i.status !== "Returned")
      .forEach((it) => {
        const reportDate = new Date(it.date || it.createdAt).getTime();
        const days = Math.floor(Math.max(0, currentTime - reportDate) / (1000 * 60 * 60 * 24));
        if (days >= 14) unresolvedByPriority.critical++;
        else if (days >= 7) unresolvedByPriority.high++;
        else if (days >= 3) unresolvedByPriority.attention++;
        else unresolvedByPriority.normal++;
      });

    res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          totalLost,
          totalFound,
          totalReturned,
          activeUnresolved,
          pendingClaims,
          totalApprovedClaims,
          avgResolutionDays,
          monthlyRecoveryRate,
          matchToClaimConversionRate
        },
        mostFrequentlyLostCategories,
        mostFrequentlyReportedLocations,
        categoryDistribution,
        monthlyComparison,
        recoveryTrend,
        campusHotspots,
        unresolvedByPriority
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
