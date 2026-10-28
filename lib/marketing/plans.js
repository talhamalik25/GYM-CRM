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
