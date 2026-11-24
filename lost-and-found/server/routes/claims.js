import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import Claim from "../models/Claim.js";
import Item from "../models/Item.js";
import { memoryItems } from "./items.js";
import { sendNotification, notifyAdmins } from "../services/notificationService.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

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
 * GET /api/claims/verify-ref/:claimRef
 * Check and verify a unique claim reference (Phase 7: Security Handover)
 */
router.get("/verify-ref/:claimRef", async (req, res, next) => {
  try {
    const { claimRef } = req.params;
    if (!claimRef?.trim()) {
      return res.status(400).json({ success: false, message: "Claim reference is required." });
    }

    const cleanRef = claimRef.trim().toUpperCase();
    let claim = null;

    if (isDbConnected()) {
      claim = await Claim.findOne({ claimReference: cleanRef });
    } else {
      claim = memoryClaims.find((c) => c.claimReference === cleanRef);
    }

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unrecognized claim reference."
      });
    }

    // Fetch associated found item
    let foundItem = null;
    if (isDbConnected()) {
      foundItem = await Item.findById(claim.foundItemId);
    } else {
      foundItem = memoryItems.find((i) => String(i._id) === String(claim.foundItemId));
    }

    // Do not reveal private verification answers in public scanning payload
    const safeClaim = {
      _id: claim._id,
      claimReference: claim.claimReference,
      status: claim.status,
      handoverStatus: claim.handoverStatus || "pending_handover",
      handoverBy: claim.handoverBy || "",
      handoverAt: claim.handoverAt || null,
      claimantName: claim.claimantName,
      claimantEmail: claim.claimantEmail,
      foundItemId: claim.foundItemId,
      createdAt: claim.createdAt
    };

    res.json({
      success: true,
      data: {
        claim: safeClaim,
        item: foundItem ? {
          _id: foundItem._id,
          itemName: foundItem.itemName,
          type: foundItem.type,
          category: foundItem.category,
          location: foundItem.location,
          status: foundItem.status,
          imageUrl: foundItem.imageUrl
        } : null,
        isHandoverCompleted: claim.handoverStatus === "handed_over"
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/claims/complete-handover
 * Confirms physical handover by Campus Security staff and marks item Returned (Phase 7)
 */
router.post("/complete-handover", async (req, res, next) => {
  try {
    const { claimReference } = req.body;
    if (!claimReference?.trim()) {
      return res.status(400).json({ success: false, message: "Claim reference code is required." });
    }

    const cleanRef = claimReference.trim().toUpperCase();
    let claim = null;

    if (isDbConnected()) {
      claim = await Claim.findOne({ claimReference: cleanRef });
    } else {
      claim = memoryClaims.find((c) => c.claimReference === cleanRef);
    }

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim reference not found." });
    }

    if (claim.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Claim cannot be handed over because its current status is '${claim.status}'. Must be approved.`
      });
    }

    // Prevent reuse of completed claim references
    if (claim.handoverStatus === "handed_over") {
      return res.status(400).json({
        success: false,
        message: `This claim reference has already been verified and item handed over on ${new Date(claim.handoverAt).toLocaleString()} by ${claim.handoverBy}. Cannot reuse.`
      });
    }

    const staffEmail = req.user?.email || "campus.security@mitaoe.ac.in";
    const staffName = req.user?.name || "Campus Security Officer";
    const handoverTime = new Date();

    if (isDbConnected()) {
      claim = await Claim.findByIdAndUpdate(
        claim._id,
        {
          handoverStatus: "handed_over",
          handoverBy: `${staffName} (${staffEmail})`,
          handoverAt: handoverTime,
          updatedAt: handoverTime
        },
        { new: true }
      );

      // Now mark the found item as Returned
      await Item.findByIdAndUpdate(claim.foundItemId, {
        status: "Returned",
        updatedAt: handoverTime
      });

      if (claim.lostItemId) {
        await Item.findByIdAndUpdate(claim.lostItemId, {
          status: "Returned",
          updatedAt: handoverTime
        });
      }
    } else {
      claim.handoverStatus = "handed_over";
      claim.handoverBy = `${staffName} (${staffEmail})`;
      claim.handoverAt = handoverTime;
      claim.updatedAt = handoverTime;

      const fItem = memoryItems.find((i) => String(i._id) === String(claim.foundItemId));
      if (fItem) fItem.status = "Returned";
      if (claim.lostItemId) {
        const lItem = memoryItems.find((i) => String(i._id) === String(claim.lostItemId));
        if (lItem) lItem.status = "Returned";
      }
    }

    // Notify claimant about completed handover
    if (claim.claimantEmail) {
      await sendNotification({
        userId: claim.claimantEmail,
        userEmail: claim.claimantEmail,
        title: "Item Handover Completed! 🤝",
        message: `Physical handover verified by ${staffName}. Your item has been successfully returned and the case is closed. Thank you!`,
        type: "item_returned",
        relatedItemId: claim.foundItemId,
        claimId: claim._id
      });
    }

    res.json({
      success: true,
      message: "Physical handover successfully verified and confirmed. Item marked as Returned.",
      data: {
        claimReference: claim.claimReference,
        handoverStatus: claim.handoverStatus,
        handoverBy: claim.handoverBy,
        handoverAt: claim.handoverAt
      }
    });
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

    const isApproved = status === "approved";
    const generatedRef = isApproved ? ("CLM-" + crypto.randomBytes(4).toString("hex").toUpperCase()) : null;

    const updates = {
      status,
      reviewNotes: reviewNotes || "",
      reviewedBy: reviewer,
      updatedAt: new Date()
    };

    if (isApproved) {
      updates.handoverStatus = "pending_handover";
    }

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id)) {
      const existing = await Claim.findById(id);
      if (isApproved && (!existing?.claimReference)) {
        updates.claimReference = generatedRef;
      }
      claim = await Claim.findByIdAndUpdate(id, updates, { new: true });
    } else {
      claim = memoryClaims.find((c) => String(c._id) === id);
      if (claim) {
        claim.status = status;
        claim.reviewNotes = reviewNotes || "";
        claim.reviewedBy = reviewer;
        claim.updatedAt = new Date();
        if (isApproved) {
          claim.handoverStatus = "pending_handover";
          if (!claim.claimReference) claim.claimReference = generatedRef;
        }
      }
    }

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim record not found." });
    }

    // Send notification to claimant about status update
    if (claim.claimantEmail) {
      await sendNotification({
        userId: claim.claimantEmail,
        userEmail: claim.claimantEmail,
        title: isApproved ? "Claim Approved! 🎉" : "Claim Verification Update",
        message: isApproved
          ? `Your claim has been APPROVED! Show your claim QR code or reference (${claim.claimReference}) at Campus Security for physical item handover.`
          : `Your claim could not be verified: ${reviewNotes || "Information did not match the item specifications."}`,
        type: "claim_status",
        relatedItemId: claim.foundItemId,
        claimId: claim._id,
        data: { status, reviewNotes, claimReference: claim.claimReference }
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
