import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required() { return this.isNew; } },
  name: { type: String, required: true, trim: true },
  price: {
    type: Number,
    required: true,
    validate: { validator: (value) => Number.isSafeInteger(value) && value > 0, message: "Price must be a whole number of rupees greater than zero." },
  },
  durationDays: {
    type: Number,
    required: true,
    min: 1,
    validate: { validator: Number.isInteger, message: "Duration must be a whole number of days." },
  },
  description: { type: String, default: "", trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// The collation makes the unique index treat names with different letter case as duplicates.
planSchema.index({ gymId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export default mongoose.models.Plan || mongoose.model("Plan", planSchema);
