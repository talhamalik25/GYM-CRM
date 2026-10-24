import mongoose from "mongoose";

export const GYM_ROLES = ["gym_owner", "gym_admin", "trainer"];

const gymMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
  role: { type: String, enum: GYM_ROLES, required: true },
  status: { type: String, enum: ["active", "revoked"], default: "active", required: true },
}, { timestamps: true });

gymMembershipSchema.index({ userId: 1, gymId: 1 }, { unique: true });
gymMembershipSchema.index({ gymId: 1, role: 1, status: 1 });

export default mongoose.models.GymMembership || mongoose.model("GymMembership", gymMembershipSchema);
