import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  // `unique` creates the database index; route validation supplies the friendly conflict response.
  phone: { type: String, required: true, trim: true, unique: true },
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
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  notes: { type: String, default: "", trim: true },
}, { timestamps: true });

export default mongoose.models.Member || mongoose.model("Member", memberSchema);
