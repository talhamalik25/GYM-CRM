import mongoose from "mongoose";
import { snapshotSchema } from "./saasSchemas.js";

const gymSchema = new mongoose.Schema({
  capacityVersion: { type: Number, default: 0 },
  trialUsedAt: { type: Date, default: null },
  planChangeRequest: { type: new mongoose.Schema({ planId: { type: mongoose.Schema.Types.ObjectId, ref: "SaaSPlan", required: true }, requestedAt: { type: Date, required: true }, requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } }, { _id: false }), default: undefined },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 80,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  status: { type: String, enum: ["active", "suspended"], default: "active", required: true, index: true },
  // Newly provisioned workspaces can explicitly require a SaaS term while
  // legacy gyms without this flag retain their established access behavior.
  saasAccessRequired: { type: Boolean, default: false, required: true },
  // Absent on existing/admin-provisioned gyms. Never backfill this marker.
  publicTrial: {
    type: new mongoose.Schema({
      version: { type: Number, enum: [1], required: true },
      startedAt: { type: Date, required: true },
      endsAt: { type: Date, required: true },
    }, { _id: false }),
    immutable: true,
    default: undefined,
  },
  timezone: { type: String, required: true, default: "Asia/Karachi", trim: true, maxlength: 100 },
  saasSubscription: {
    type: new mongoose.Schema({
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "SaaSPlan", required: true },
      planSnapshot: { type: snapshotSchema, required: true },
      status: { type: String, enum: ["trialing", "active", "past_due", "expired", "cancelled"], required: true },
      trialStartedAt: { type: Date, default: null },
      periodStart: { type: Date, default: null },
      periodEnd: { type: Date, default: null },
      trialEndsAt: { type: Date, default: null },
      renewalDate: { type: Date, default: null },
      pendingInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformInvoice", default: null },
      autoRenew: { type: Boolean, default: false, required: true },
      complimentaryGrant: { type: new mongoose.Schema({ reason: { type: String, required: true, trim: true, maxlength: 300 }, grantedAt: { type: Date, required: true }, grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } }, { _id: false }), default: undefined },
    }, { _id: false }),
    default: undefined,
  },
}, { timestamps: true });

gymSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Gym || mongoose.model("Gym", gymSchema);
