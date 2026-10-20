import mongoose from "mongoose";

const gymSchema = new mongoose.Schema({
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
  timezone: { type: String, required: true, default: "Asia/Karachi", trim: true, maxlength: 100 },
  saasSubscription: {
    type: new mongoose.Schema({
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "SaaSPlan", required: true },
      planSnapshot: {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, enum: ["PKR"], required: true },
        interval: { type: String, enum: ["monthly", "yearly"], required: true },
        limits: {
          members: { type: Number, default: null },
          trainers: { type: Number, default: null },
        },
      },
      status: { type: String, enum: ["trialing", "active", "past_due", "expired", "cancelled"], required: true },
      trialStartedAt: { type: Date, default: null },
      periodStart: { type: Date, default: null },
      periodEnd: { type: Date, default: null },
      trialEndsAt: { type: Date, default: null },
      renewalDate: { type: Date, default: null },
      pendingInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformInvoice", default: null },
      autoRenew: { type: Boolean, default: false, required: true },
    }, { _id: false }),
    default: undefined,
  },
}, { timestamps: true });

gymSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Gym || mongoose.model("Gym", gymSchema);
