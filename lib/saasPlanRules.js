import { FEATURE_LABELS, PLAN_KEYS, LAUNCH_PLANS, LEGACY_FEATURE_KEYS } from "../config/plans.js";

export { FEATURE_LABELS, PLAN_KEYS, LAUNCH_PLANS } from "../config/plans.js";

const features = (keys) => Object.fromEntries(Object.keys(FEATURE_LABELS).map((key) => [key, keys.includes(key)]));

export function snapshotEntitlements(snapshot) {
  // Unversioned contracts keep their existing single-location capabilities and limits.
  const legacy = !PLAN_KEYS.includes(snapshot?.key);
  const defaults = legacy ? features(LEGACY_FEATURE_KEYS) : LAUNCH_PLANS.find((plan) => plan.key === snapshot.key).features;
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
