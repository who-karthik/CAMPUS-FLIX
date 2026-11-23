import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  lostItemId: { type: mongoose.Schema.Types.Mixed, ref: "Item", required: true },
  foundItemId: { type: mongoose.Schema.Types.Mixed, ref: "Item", required: true },
  confidenceScore: { type: Number, required: true, min: 0, max: 100 },
  matchingFactors: {
    nameScore: { type: Number, default: 0 },
    categoryScore: { type: Number, default: 0 },
    descriptionScore: { type: Number, default: 0 },
    locationScore: { type: Number, default: 0 },
    dateScore: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ["suggested", "confirmed", "dismissed", "claimed"],
    default: "suggested"
  }
}, { timestamps: true });

matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

export default mongoose.model("Match", matchSchema);
