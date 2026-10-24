import mongoose from "mongoose";

const schema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  address: { type: String, trim: true, maxlength: 400, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ gymId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
schema.index({ gymId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });
export default mongoose.models.Branch || mongoose.model("Branch", schema);
