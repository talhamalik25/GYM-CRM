import mongoose from "mongoose";
import { FEATURE_LABELS, PLAN_KEYS } from "../lib/saasPlanRules.js";

export const limitsSchema = new mongoose.Schema(Object.fromEntries(["members", "trainers", "staff", "branches"].map((key) => [key, {
  type: Number, default: null, min: 0, validate: (value) => value === null || Number.isSafeInteger(value),
}])), { _id: false });
export const featuresSchema = new mongoose.Schema(Object.fromEntries(Object.keys(FEATURE_LABELS).map((key) => [key, { type: Boolean, default: undefined }])), { _id: false });
export const snapshotSchema = new mongoose.Schema({
  key: { type: String, enum: PLAN_KEYS, default: undefined },
  name: { type: String, required: true }, price: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["PKR"], required: true },
  interval: { type: String, enum: ["monthly", "yearly"], required: true },
  limits: { type: limitsSchema, default: () => ({}) },
  features: { type: featuresSchema, default: undefined },
}, { _id: false });
