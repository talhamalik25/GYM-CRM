import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: { type: String },
  attempts: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { versionKey: false });

export default mongoose.models.AuthRateLimit || mongoose.model("AuthRateLimit", schema);
