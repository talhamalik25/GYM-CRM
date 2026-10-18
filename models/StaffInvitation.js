import mongoose from "mongoose";
import { GYM_ROLES } from "./GymMembership.js";

const staffInvitationSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  role: { type: String, enum: GYM_ROLES.filter((role) => role !== "gym_owner"), required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  status: { type: String, enum: ["pending", "accepted", "revoked"], default: "pending", required: true },
  expiresAt: { type: Date, required: true, index: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

staffInvitationSchema.index({ gymId: 1, email: 1, status: 1 });

export default mongoose.models.StaffInvitation || mongoose.model("StaffInvitation", staffInvitationSchema);
