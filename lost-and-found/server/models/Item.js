import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, required: true, enum: ["Lost", "Found"] },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  contact: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: "" },
  status: { type: String, enum: ["Open", "Claimed", "Returned"], default: "Open" }
}, { timestamps: true });

export default mongoose.model("Item", itemSchema);
