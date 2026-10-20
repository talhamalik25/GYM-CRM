import mongoose from "mongoose";

const platformSettingSchema = new mongoose.Schema({
  _id: { type: String, default: "fitivo" },
  defaultTrialDays: { type: Number, min: 0, max: 90, default: 0, validate: Number.isSafeInteger },
  manualBillingInstructions: { type: String, trim: true, maxlength: 1200, default: "" },
}, { timestamps: true, versionKey: false });

export default mongoose.models.PlatformSetting || mongoose.model("PlatformSetting", platformSettingSchema);
