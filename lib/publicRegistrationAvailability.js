import connectToDatabase from "./db.js";
import { publicRegistrationConfigured } from "./gymOwnerRegistration.js";
import SaaSPlan from "../models/SaaSPlan.js";

export async function getPublicRegistrationAvailability() {
  if (!publicRegistrationConfigured()) return { enabled: false, planName: "" };

  try {
    await connectToDatabase();
    const plan = await SaaSPlan.findOne({ _id: process.env.PUBLIC_TRIAL_PLAN_ID, isActive: true })
      .select("name")
      .lean();
    return { enabled: Boolean(plan), planName: plan?.name || "" };
  } catch (error) {
    console.error("Public registration availability could not be confirmed:", error?.message || "Unknown error");
    return { enabled: false, planName: "" };
  }
}
