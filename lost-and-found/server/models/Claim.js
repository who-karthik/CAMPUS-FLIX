import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
  lostItemId: { type: mongoose.Schema.Types.Mixed, ref: "Item" },
  foundItemId: { type: mongoose.Schema.Types.Mixed, ref: "Item", required: true },
  claimantId: { type: String, required: true },
  claimantName: { type: String, default: "" },
  claimantEmail: { type: String, required: true, trim: true },
  verificationDetails: { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  reviewedBy: { type: String, default: "" },
  reviewNotes: { type: String, default: "" }
}, { timestamps: true });

claimSchema.index({ foundItemId: 1, claimantEmail: 1 });

export default mongoose.model("Claim", claimSchema);
