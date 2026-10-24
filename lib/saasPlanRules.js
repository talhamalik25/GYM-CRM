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
const features = (keys) => Object.fromEntries(Object.keys(FEATURE_LABELS).map((key) => [key, keys.includes(key)]));
export const LAUNCH_PLANS = Object.freeze([
  { key: "basic", name: "Basic", price: 2999, interval: "monthly", limits: { members: 150, staff: 3, branches: 1, trainers: null }, features: features(core) },
  { key: "pro", name: "Pro", price: 5999, interval: "monthly", limits: { members: 500, staff: 10, branches: 1, trainers: null }, features: features(pro) },
  { key: "professional", name: "Professional", price: 9999, interval: "monthly", limits: { members: 2000, staff: 30, branches: 5, trainers: null }, features: features(Object.keys(FEATURE_LABELS)) },
]);

export function snapshotEntitlements(snapshot) {
  // Unversioned contracts keep their existing single-location capabilities and limits.
  const legacy = !PLAN_KEYS.includes(snapshot?.key);
  const defaults = legacy ? features(pro) : LAUNCH_PLANS.find((plan) => plan.key === snapshot.key).features;
  const result = { ...defaults, ...snapshot?.features };
  if (snapshot?.key !== "professional") {
    for (const key of ["multiBranch", "branchReports", "consolidatedAnalytics", "prioritySupport"]) result[key] = false;
  }
  return { key: snapshot?.key || "legacy", features: result, limits: {
    members: snapshot?.limits?.members ?? null, trainers: snapshot?.limits?.trainers ?? null,
    staff: snapshot?.limits?.staff ?? null,
    branches: snapshot?.key === "professional" ? (snapshot?.limits?.branches ?? 5) : 1,
  } };
}

export function exceededLimits(entitlements, usage) {
  return Object.entries(entitlements.limits).filter(([key, limit]) => limit !== null && (usage[key] || 0) > limit)
    .map(([resource, limit]) => ({ resource, limit, used: usage[resource] }));
}
