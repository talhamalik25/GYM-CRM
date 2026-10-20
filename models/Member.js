import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required() { return this.isNew; } },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: "",
    validate: {
      validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: "Enter a valid email address.",
    },
  },
  gender: { type: String, required: true, enum: ["Female", "Male", "Other", "Prefer not to say"] },
  dateOfBirth: { type: Date, default: null },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", default: null, index: true },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  notes: { type: String, default: "", trim: true },
  isActive: { type: Boolean, default: true, required: true },
  membershipCancelled: { type: Boolean, default: false, required: true },
}, { timestamps: true });

memberSchema.index({ gymId: 1, phone: 1 }, { unique: true });

export default mongoose.models.Member || mongoose.model("Member", memberSchema);
