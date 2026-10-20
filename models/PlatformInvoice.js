import mongoose from "mongoose";

const invoicePlanSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["PKR"], required: true },
  interval: { type: String, enum: ["monthly", "yearly"], required: true },
  limits: {
    members: { type: Number, default: null },
    trainers: { type: Number, default: null },
  },
}, { _id: false });

const platformInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "SaaSPlan", required: true },
  planSnapshot: { type: invoicePlanSnapshotSchema, required: true },
  amountDue: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  currency: { type: String, enum: ["PKR"], default: "PKR", required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  status: { type: String, enum: ["open", "paid", "void"], default: "open", required: true },
  issuedAt: { type: Date, required: true },
  paidAt: { type: Date, default: null },
  paymentReference: { type: String, default: "", trim: true, maxlength: 200 },
  voidedAt: { type: Date, default: null },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  voidReason: { type: String, default: "", trim: true, maxlength: 300 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export default mongoose.models.PlatformInvoice || mongoose.model("PlatformInvoice", platformInvoiceSchema);
