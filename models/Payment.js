import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required() { return this.isNew; } },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", default: null, index: true },
  renewalKey: { type: String, default: null },
  // Snapshot the plan price at payment time so later price edits do not rewrite history.
  amountDue: { type: Number, required: true, min: 1, validate: [{ validator: Number.isFinite, message: "Amount due must be a finite number." }, { validator: Number.isInteger, message: "Amount due must be a whole number of rupees." }] },
  amountPaid: {
    type: Number, required: true, min: 0,
    validate: [{ validator: Number.isFinite, message: "Amount paid must be a finite number." },
      { validator: Number.isInteger, message: "Amount paid must be a whole number of rupees." },
      { validator(value) { return value <= this.amountDue; }, message: "Amount paid cannot exceed amount due." }],
  },
  method: { type: String, required: true, enum: ["cash", "bank_transfer", "easypaisa", "jazzcash"] },
  paymentDate: { type: Date, required: true },
  receiptNumber: { type: String, required: true, unique: true },
  // Optional to preserve all historical rows; newly created rows receive a unique request key.
  idempotencyKey: { type: String, select: false },
  requestFingerprint: { type: String, select: false },
  notes: { type: String, default: "", trim: true },
}, { timestamps: true });

paymentSchema.index({ memberId: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ gymId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
