import mongoose from "mongoose";

const gymSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 80,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  status: { type: String, enum: ["active", "suspended"], default: "active", required: true, index: true },
  timezone: { type: String, required: true, default: "Asia/Karachi", trim: true, maxlength: 100 },
}, { timestamps: true });

gymSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Gym || mongoose.model("Gym", gymSchema);
