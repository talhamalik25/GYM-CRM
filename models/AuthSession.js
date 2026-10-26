import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  authVersion: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

export default mongoose.models.AuthSession || mongoose.model("AuthSession", authSessionSchema);
