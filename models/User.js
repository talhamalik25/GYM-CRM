import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, trim: true, minlength: 2, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, default: "", trim: true, maxlength: 16, match: /^(?:\+?\d{7,15})?$/ },
  passwordHash: { type: String, required: true, select: false },
  authVersion: { type: Number, default: 0, min: 0, select: false },
  // `superadmin` is retained for existing accounts; new platform role naming is explicit.
  role: { type: String, enum: ["platform_super_admin", "superadmin", "staff"], default: "staff", required: true },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
