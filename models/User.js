import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
