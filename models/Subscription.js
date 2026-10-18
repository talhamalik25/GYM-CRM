import mongoose from "mongoose";

const termSchema = new mongoose.Schema({
  renewalKey: { type: String, required: true },
  requestFingerprint: { type: String, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  planSnapshot: { name: { type: String, required: true }, durationDays: { type: Number, required: true }, originalPrice: { type: Number, required: true }, agreedPrice: { type: Number, required: true } },
  startDate: { type: Date, required: true }, expiryDate: { type: Date, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
}, { timestamps: true });

const subscriptionSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", index: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  startDate: { type: Date, required: true }, expiryDate: { type: Date, required: true },
  originalPrice: { type: Number, required: true, min: 1 }, agreedPrice: { type: Number, required: true, min: 1 },
  planSnapshot: { name: { type: String, required: true }, durationDays: { type: Number, required: true }, originalPrice: { type: Number, required: true }, agreedPrice: { type: Number, required: true } },
  status: { type: String, enum: ["pending", "active", "expired", "cancelled"], default: "pending", index: true },
  createKey: { type: String, required: true },
  createFingerprint: { type: String, required: true },
  renewalHistory: { type: [termSchema], default: [] },
}, { timestamps: true });

subscriptionSchema.index({ memberId:  1, createdAt: -1 });
subscriptionSchema.index({ gymId: 1, createKey: 1 }, { unique: true });
export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
