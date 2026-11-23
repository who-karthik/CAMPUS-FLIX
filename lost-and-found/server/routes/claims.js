import express from "express";
import mongoose from "mongoose";
import Claim from "../models/Claim.js";
import Item from "../models/Item.js";
import { memoryItems } from "./items.js";
import { sendNotification, notifyAdmins } from "../services/notificationService.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

const isDbConnected = () => mongoose.connection.readyState === 1;

// In-memory claims fallback
export const memoryClaims = [];

/**
 * POST /api/claims
 * Submit claim request with private verification details
 */
router.post("/", async (req, res, next) => {
  try {
    const { foundItemId, lostItemId, verificationDetails } = req.body;

    if (!foundItemId || !verificationDetails?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Found item ID and verification details are required."
      });
    }

    if (verificationDetails.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide detailed identifying characteristics (at least 5 characters)."
      });
    }

    const claimantEmail = (req.user?.email || req.body.claimantEmail || "").trim().toLowerCase();
    const claimantName = req.user?.name || req.body.claimantName || "Student Claimant";

    if (!claimantEmail) {
      return res.status(400).json({ success: false, message: "Claimant contact email is required." });
    }

    // Find the found item
    let foundItem = null;
    if (isDbConnected()) {
      foundItem = await Item.findById(foundItemId);
    } else {
      foundItem = memoryItems.find((i) => String(i._id) === String(foundItemId));
    }

    if (!foundItem) {
      return res.status(404).json({ success: false, message: "Found item not found." });
    }

    const claimData = {
      foundItemId: String(foundItemId),
      lostItemId: lostItemId ? String(lostItemId) : null,
      claimantId: req.user?.id || `user-${claimantEmail}`,
      claimantName,
      claimantEmail,
      verificationDetails: verificationDetails.trim(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let createdClaim = null;

    if (isDbConnected()) {
      createdClaim = await Claim.create(claimData);
    } else {
      createdClaim = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...claimData
      };
      memoryClaims.unshift(createdClaim);
    }

    // Notify the found item reporter
    const reporterEmail = (foundItem.contact || foundItem.userId || "").toLowerCase().trim();
    if (reporterEmail) {
      await sendNotification({
        userId: reporterEmail,
        userEmail: reporterEmail,
        title: "New Claim Request Received",
        message: `A student (${claimantName}) has requested to claim "${foundItem.itemName}". Click to review their verification details.`,
        type: "claim_request",
        relatedItemId: foundItem._id,
        claimId: createdClaim._id,
        data: {
          claimId: createdClaim._id,
          itemName: foundItem.itemName,
          claimantEmail
        }
      });
    }

    // Also notify admins
    await notifyAdmins(
      "New Item Claim Pending Verification",
      `Student ${claimantEmail} submitted a claim verification request for "${foundItem.itemName}".`,
      foundItem._id,
      { claimId: createdClaim._id, claimantEmail }
    );

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully. The finder and campus administration have been notified.",
      data: createdClaim
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/claims
 * Retrieve claims (role-aware: admins see all, students see their claims and claims on their reported items)
 */
router.get("/", async (req, res, next) => {
  try {
    const userEmail = (req.user?.email || req.query.userEmail || "").toLowerCase().trim();
    const isAdmin = req.user?.role === "admin" || userEmail.includes("admin");

    if (isDbConnected()) {
      let filter = {};
      if (!isAdmin) {
        filter = { claimantEmail: userEmail };
      }
      const claims = await Claim.find(filter).sort({ createdAt: -1 });
      return res.json({ success: true, count: claims.length, data: claims });
    }

    let results = memoryClaims;
    if (!isAdmin) {
      results = memoryClaims.filter((c) => c.claimantEmail === userEmail);
    }
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/claims/:id/status
 * Approve or Reject claim
 */
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
    }

    const reviewer = req.user?.name || req.user?.email || "Campus Administrator";
    let claim = null;

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      claim = await Claim.findByIdAndUpdate(
        id,
        {
          status,
          reviewNotes: reviewNotes || "",
          reviewedBy: reviewer,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      claim = memoryClaims.find((c) => String(c._id) === id);
      if (claim) {
        claim.status = status;
        claim.reviewNotes = reviewNotes || "";
        claim.reviewedBy = reviewer;
        claim.updatedAt = new Date();
      }
    }

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim record not found." });
    }

    // Send notification to claimant about status update
    if (claim.claimantEmail) {
      const isApproved = status === "approved";
      await sendNotification({
        userId: claim.claimantEmail,
        userEmail: claim.claimantEmail,
        title: isApproved ? "Claim Approved! 🎉" : "Claim Verification Update",
        message: isApproved
          ? "Your claim has been APPROVED! Please visit the Campus Security Desk with your student ID for physical item handover."
          : `Your claim could not be verified: ${reviewNotes || "Information did not match the item specifications."}`,
        type: "claim_status",
        relatedItemId: claim.foundItemId,
        claimId: claim._id,
        data: { status, reviewNotes }
      });
    }

    res.json({
      success: true,
      message: `Claim successfully ${status}.`,
      data: claim
    });
  } catch (error) {
    next(error);
  }
});

export default router;
