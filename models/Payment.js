import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
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
  notes: { type: String, default: "", trim: true },
}, { timestamps: true });

paymentSchema.index({ memberId: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
