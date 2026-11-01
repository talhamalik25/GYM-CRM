import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, immutable: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  action: { type: String, required: true, enum: ["payment.created", "payment.voided", "member.created", "member.edited"], immutable: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
  changedFields: { type: [String], default: [], immutable: true },
  reason: { type: String, maxlength: 1000, default: "", immutable: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
}, { versionKey: false });
auditLogSchema.index({ gymId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
