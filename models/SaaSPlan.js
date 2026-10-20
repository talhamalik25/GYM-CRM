import mongoose from "mongoose";

const limitsSchema = new mongoose.Schema({
  members: { type: Number, default: null, min: 0, validate: Number.isSafeInteger },
  trainers: { type: Number, default: null, min: 0, validate: Number.isSafeInteger },
}, { _id: false });

const saasPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, default: "", trim: true, maxlength: 400 },
  price: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["PKR"], default: "PKR", required: true },
  interval: { type: String, enum: ["monthly", "yearly"], required: true },
  limits: { type: limitsSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

export default mongoose.models.SaaSPlan || mongoose.model("SaaSPlan", saasPlanSchema);
