// Draft marketing catalog, separate from database-backed billing/entitlements.
// Replace null with confirmed monthly PKR prices before enabling checkout.
export const PRICING = {
  currency: "PKR",
  pricesConfirmed: false,
  annualFreeMonths: 2,
  paymentNote: "PKR bank transfer · Manual payment verification",
  placeholderLabel: "Price to be confirmed",
};

export const PLANS = [
  { id: "basic", name: "Basic", monthlyPrice: null, description: "A starting point for everyday gym administration.", recommended: false, highlights: ["Member records & memberships", "Attendance & check-ins", "Member payments & receipts", "Basic reports"] },
  { id: "pro", name: "Pro", monthlyPrice: null, description: "For a growing gym and its team.", recommended: true, highlights: ["Everything outlined in Basic", "Staff management", "Advanced payment reports", "Analytics & CSV exports"] },
  { id: "professional", name: "Professional", monthlyPrice: null, description: "For coordinating operations across locations.", recommended: false, highlights: ["Everything outlined in Pro", "Multi-branch management", "Branch-level reports", "Consolidated analytics"] },
];

export function marketingPlanAmount(plan, cycle = "monthly") {
  if (!plan || !Number.isFinite(plan.monthlyPrice) || plan.monthlyPrice <= 0) return null;
  if (cycle === "monthly") return plan.monthlyPrice;
  if (cycle === "annual") return plan.monthlyPrice * (12 - PRICING.annualFreeMonths);
  return null;
}

// Existing operational defaults are preserved for backward compatibility.
// They are not confirmed public quotes; stored invoice/subscription prices stay authoritative.
// Launch defaults are used only to create the editable catalog, never to reprice a subscription.
export const FEATURE_LABELS = Object.freeze({
  memberManagement: "Member management", membershipPlans: "Membership plans",
  attendance: "Attendance management", memberPayments: "Member payments",
  basicDashboard: "Basic dashboard", basicReports: "Basic reports",
  advancedAnalytics: "Advanced analytics", csvExports: "CSV exports",
  advancedPaymentReports: "Advanced payment reports", fullStaffManagement: "Full staff management",
  multiBranch: "Multi-branch management", branchReports: "Branch reports",
  consolidatedAnalytics: "Consolidated analytics", prioritySupport: "Priority support entitlement",
});
export const PLAN_KEYS = Object.freeze(["basic", "pro", "professional"]);
const core = ["memberManagement", "membershipPlans", "attendance", "memberPayments", "basicDashboard", "basicReports"];
const pro = [...core, "advancedAnalytics", "csvExports", "advancedPaymentReports", "fullStaffManagement"];
export const LEGACY_FEATURE_KEYS = pro;
const features = (keys) => Object.fromEntries(Object.keys(FEATURE_LABELS).map((key) => [key, keys.includes(key)]));
export const LAUNCH_PLANS = Object.freeze([
  { key: "basic", name: "Basic", price: 2999, interval: "monthly", limits: { members: 150, staff: 3, branches: 1, trainers: null }, features: features(core) },
  { key: "pro", name: "Pro", price: 5999, interval: "monthly", limits: { members: 500, staff: 10, branches: 1, trainers: null }, features: features(pro) },
  { key: "professional", name: "Professional", price: 9999, interval: "monthly", limits: { members: 2000, staff: 30, branches: 5, trainers: null }, features: features(Object.keys(FEATURE_LABELS)) },
]);
