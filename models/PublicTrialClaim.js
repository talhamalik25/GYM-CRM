import mongoose from "mongoose";

// Eligibility history, not a second subscription. No TTL or cascading deletion:
// changing/deleting an account or renaming a gym must not grant another trial.
const publicTrialClaimSchema = new mongoose.Schema({
  email: { type: String, required: true, immutable: true },
  gymSlug: { type: String, required: true, immutable: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true },
  claimedAt: { type: Date, required: true, immutable: true },
});
publicTrialClaimSchema.index({ email: 1 }, { unique: true });
publicTrialClaimSchema.index({ gymSlug: 1 }, { unique: true });

export default mongoose.models.PublicTrialClaim || mongoose.model("PublicTrialClaim", publicTrialClaimSchema);
