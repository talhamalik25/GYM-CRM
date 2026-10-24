import mongoose from "mongoose";

import { snapshotSchema as invoicePlanSnapshotSchema } from "./saasSchemas.js";

const platformInvoiceSchema = new mongoose.Schema({
  changesPlan: { type: Boolean, default: false },
  invoiceNumber: { type: String, required: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "SaaSPlan", required: true },
  planSnapshot: { type: invoicePlanSnapshotSchema, required: true },
  previousPlanSnapshot: { type: invoicePlanSnapshotSchema, default: undefined },
  amountDue: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["PKR"], default: "PKR", required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  status: { type: String, enum: ["open", "paid", "void"], default: "open", required: true },
  issuedAt: { type: Date, required: true },
  paidAt: { type: Date, default: null },
  paymentReference: { type: String, default: "", trim: true, maxlength: 200 },
  paymentClaims: { type: [new mongoose.Schema({ reference: { type: String, required: true, trim: true, maxlength: 200 }, submittedAt: { type: Date, required: true }, submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, status: { type: String, enum: ["submitted", "rejected", "approved"], default: "submitted", required: true }, reviewedAt: { type: Date, default: null }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, rejectionReason: { type: String, default: "", trim: true, maxlength: 300 } }, { timestamps: false })], default: [] },
  verifiedAmount: { type: Number, default: null, min: 0, validate: (value) => value === null || Number.isSafeInteger(value) },
  verifiedReference: { type: String, default: "", trim: true, maxlength: 200 },
  verificationNotes: { type: String, default: "", trim: true, maxlength: 1000 },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  voidedAt: { type: Date, default: null },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  voidReason: { type: String, default: "", trim: true, maxlength: 300 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export default mongoose.models.PlatformInvoice || mongoose.model("PlatformInvoice", platformInvoiceSchema);
