import mongoose from "mongoose";

import { limitsSchema, featuresSchema } from "./saasSchemas.js";
import { PLAN_KEYS } from "../lib/saasPlanRules.js";

const saasPlanSchema = new mongoose.Schema({
  key: { type: String, enum: PLAN_KEYS, immutable: true },
  features: { type: featuresSchema, default: undefined },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, default: "", trim: true, maxlength: 400 },
  price: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["PKR"], default: "PKR", required: true },
  interval: { type: String, enum: ["monthly", "yearly"], required: true },
  limits: { type: limitsSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

saasPlanSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { key: { $type: "string" } } });

export default mongoose.models.SaaSPlan || mongoose.model("SaaSPlan", saasPlanSchema);
