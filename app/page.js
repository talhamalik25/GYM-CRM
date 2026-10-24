import connectToDatabase from "../lib/db.js";
import { publicRegistrationConfigured } from "../lib/gymOwnerRegistration.js";
import { serializeSaaSPlan } from "../lib/platformBillingRules.js";
import SaaSPlan from "../models/SaaSPlan.js";
import MarketingHome from "../components/marketing/marketing-home.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fitivo | Gym Management, Made for Growth",
  description: "Manage gym members, memberships, attendance, payments, staff, reports, and branches in one connected Fitivo workspace.",
  openGraph: {
    title: "Fitivo | Gym Management, Made for Growth",
    description: "A connected workspace for gym members, attendance, payments, reports, and growth.",
    type: "website",
    images: [{ url: "/fitivo-social.svg", width: 1200, height: 630, alt: "Fitivo gym management platform" }],
  },
  twitter: { card: "summary_large_image", title: "Fitivo | Gym Management, Made for Growth", description: "A connected workspace for gym members, attendance, payments, reports, and growth.", images: ["/fitivo-social.svg"] },
};

async function loadMarketingData() {
  try {
    await connectToDatabase();
    const plans = await SaaSPlan.find({ isActive: true, price: { $gt: 0 } }).sort({ price: 1, _id: 1 }).lean();
    let trialPlan = null;
    if (publicRegistrationConfigured()) {
      trialPlan = await SaaSPlan.findOne({ _id: process.env.PUBLIC_TRIAL_PLAN_ID, isActive: true }).select("name").lean();
    }
    return { plans: plans.map(serializeSaaSPlan), pricingAvailable: true, trialAvailable: Boolean(trialPlan), trialPlanName: trialPlan?.name || "" };
  } catch (error) {
    console.error("Marketing catalog unavailable:", error?.message || "Unknown error");
    return { plans: [], pricingAvailable: false, trialAvailable: false, trialPlanName: "" };
  }
}

export default async function HomePage() {
  const data = await loadMarketingData();
  return <MarketingHome {...data} />;
}
