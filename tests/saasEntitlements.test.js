import test from "node:test";
import assert from "node:assert/strict";
import { LAUNCH_PLANS, snapshotEntitlements, exceededLimits } from "../lib/saasPlanRules.js";
import { branchScope, canSelectBranch } from "../lib/branchRules.js";
import { gymEntitlements, EntitlementError } from "../lib/entitlements.js";
import { enforceRouteFeature } from "../lib/routeEntitlements.js";
import { planSnapshot, validateSaaSPlanBody, invoiceMatchesPendingSubscription } from "../lib/platformBillingRules.js";
import { publicTrialSubscription } from "../lib/gymOwnerRegistration.js";
import { csvCell } from "../lib/csv.js";

test("launch tiers define exact prices, organization limits and exclusive Professional features", () => {
  assert.deepEqual(LAUNCH_PLANS.map(({ price }) => price), [2999, 5999, 9999]);
  assert.deepEqual(LAUNCH_PLANS.map(({ limits }) => [limits.members, limits.staff, limits.branches]), [[150, 3, 1], [500, 10, 1], [2000, 30, 5]]);
  const [basic, pro, professional] = LAUNCH_PLANS.map(snapshotEntitlements);
  for (const tier of [basic, pro, professional]) for (const key of ["memberManagement", "membershipPlans", "attendance", "memberPayments", "basicDashboard", "basicReports"]) assert.equal(tier.features[key], true);
  for (const key of ["advancedAnalytics", "csvExports", "advancedPaymentReports", "fullStaffManagement"]) { assert.equal(basic.features[key], false); assert.equal(pro.features[key], true); }
  for (const key of ["multiBranch", "branchReports", "consolidatedAnalytics", "prioritySupport"]) { assert.equal(basic.features[key], false); assert.equal(pro.features[key], false); assert.equal(professional.features[key], true); }
});
test("legacy contracts remain single-location and preserve prior unlimited capabilities", () => {
  const legacy = snapshotEntitlements({ name: "Old paid plan", price: 1200, limits: { members: 900, trainers: 20 } });
  assert.equal(legacy.key, "legacy"); assert.equal(legacy.limits.members, 900); assert.equal(legacy.limits.staff, null);
  assert.equal(legacy.features.advancedAnalytics, true); assert.equal(legacy.features.multiBranch, false);
  assert.equal(snapshotEntitlements().limits.members, null);
});
test("snapshot values stay fixed after catalog edits and non-Professional cannot acquire branches", () => {
  const catalog = structuredClone(LAUNCH_PLANS[1]);
  const snapshot = planSnapshot(catalog);
  catalog.price = 100000; catalog.features.csvExports = false; catalog.limits.members = 1;
  // Plain snapshots must be independent objects just as persisted snapshots are.
  assert.equal(snapshot.features.csvExports, true); assert.equal(snapshot.price, 5999); assert.equal(snapshot.limits.members, 500);
  const forged = snapshotEntitlements({ ...LAUNCH_PLANS[0], features: { multiBranch: true, consolidatedAnalytics: true }, limits: { branches: 5 } });
  assert.equal(forged.features.multiBranch, false); assert.equal(forged.limits.branches, 1);
});
test("disabled API features are distinct from expired subscription errors", async () => {
  const request = new Request("http://localhost/api/exports");
  const response = enforceRouteFeature(request, { entitlements: snapshotEntitlements(LAUNCH_PLANS[0]) });
  assert.equal(response.status, 403); assert.equal((await response.json()).error.code, "FEATURE_UNAVAILABLE");
  assert.equal(enforceRouteFeature(new Request("http://localhost/api/reports?basic=1"), { entitlements: snapshotEntitlements(LAUNCH_PLANS[0]) }), null);
  assert.throws(() => gymEntitlements({ status: "active", saasSubscription: { status: "active", periodEnd: new Date(0) } }), (error) => error instanceof EntitlementError && error.code === "SUBSCRIPTION_INACTIVE");
});
test("downgrades identify every exceeded resource without removing data", () => {
  const usage = { members: 151, staff: 4, branches: 2 };
  assert.deepEqual(exceededLimits(snapshotEntitlements(LAUNCH_PLANS[0]), usage).map((item) => item.resource), ["members", "staff", "branches"]);
  assert.deepEqual(usage, { members: 151, staff: 4, branches: 2 });
  assert.equal(exceededLimits(snapshotEntitlements(LAUNCH_PLANS[2]), usage).length, 0);
});
test("branch policy bounds staff, organization selection and consolidated reads", () => {
  const base = { gymId: "org", role: "gym_owner", multiBranch: true, consolidated: true, readOnly: true };
  assert.equal(canSelectBranch({ ...base, requestedBranchId: "all" }), true);
  assert.equal(canSelectBranch({ ...base, requestedBranchId: "all", readOnly: false }), false);
  assert.equal(canSelectBranch({ ...base, role: "gym_admin", assignedBranchId: "east", requestedBranchId: "west" }), false);
  assert.equal(canSelectBranch({ ...base, role: "gym_admin", assignedBranchId: "east", requestedBranchId: "east" }), true);
  assert.equal(canSelectBranch({ ...base, multiBranch: false, requestedBranchId: "east" }), false);
  assert.deepEqual(branchScope("org", "org"), { gymId: "org", $or: [{ branchId: "org" }, { branchId: null }] });
  assert.deepEqual(branchScope("org", "east"), { gymId: "org", branchId: "east" });
  assert.throws(() => branchScope(null, "east"));
});
test("new trials last seven days and plan validation rejects invalid entitlements", () => {
  const trial = publicTrialSubscription({ ...LAUNCH_PLANS[0], _id: "plan" }, new Date("2026-10-24T00:00:00Z"));
  assert.equal(trial.trialEndsAt.getTime() - trial.trialStartedAt.getTime(), 7 * 86400000);
  assert.equal(trial.planSnapshot.key, "basic");
  assert.equal(validateSaaSPlanBody({ features: { arbitrary: true } }, { partial: true }).message != null, true);
  assert.equal(validateSaaSPlanBody({ key: "professional" }, { partial: true }).message != null, true);
});
test("plan change invoices still require exact pending identity and matching invoice terms", () => {
  const invoice = { _id: "invoice", changesPlan: true, planId: "new", amountDue: 5999, currency: "PKR", planSnapshot: planSnapshot(LAUNCH_PLANS[1]), periodStart: new Date("2026-10-24"), periodEnd: new Date("2026-11-24") };
  const subscription = { pendingInvoiceId: "invoice", planId: "old", planSnapshot: planSnapshot(LAUNCH_PLANS[0]) };
  assert.equal(invoiceMatchesPendingSubscription(subscription, invoice), true);
  assert.equal(invoiceMatchesPendingSubscription({ ...subscription, pendingInvoiceId: "other" }, invoice), false);
  assert.equal(invoiceMatchesPendingSubscription(subscription, { ...invoice, amountDue: 1 }), false);
});
test("CSV exports escape delimiters, quotes, newlines and spreadsheet formulas", () => {
  assert.equal(csvCell('A,"B"\nC'), '"A,""B""\nC"');
  assert.equal(csvCell("=SUM(A1:A2)"), '"\'=SUM(A1:A2)"');
  assert.equal(csvCell(" +923001234567"), '"\' +923001234567"');
  assert.equal(csvCell(150), '"150"');
});
