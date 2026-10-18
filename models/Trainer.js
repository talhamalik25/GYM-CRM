import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", index: true },
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: String, required: true, trim: true, match: /^\+?\d{7,15}$/ },
  specialization: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  profileImage: { type: String, default: "", trim: true, maxlength: 2048 },
  notes: { type: String, default: "", trim: true, maxlength: 2000 },
}, { timestamps: true });

trainerSchema.index({ gymId: 1, email: 1 }, { unique: true });
trainerSchema.index({ fullName: 1, status: 1 });

export default mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);
