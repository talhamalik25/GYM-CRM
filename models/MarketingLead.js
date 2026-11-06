import mongoose from "mongoose";
// Platform enquiries, not tenant records. No public read endpoint.
const schema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 80 },
  gymName: { type: String, required: true, maxlength: 120 },
  phone: { type: String, required: true, maxlength: 16 },
  topic: { type: String, enum: ["pricing", "demo", "trial"], required: true },
  source: { type: String, enum: ["marketing-chatbot"], default: "marketing-chatbot" },
  consentAt: { type: Date, required: true },
}, { timestamps: true });
export default mongoose.models.MarketingLead || mongoose.model("MarketingLead", schema);
