import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required() { return this.isNew; } },
  name: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 },
});

counterSchema.index({ gymId: 1, name: 1 }, { unique: true });

export default mongoose.models.Counter || mongoose.model("Counter", counterSchema);
