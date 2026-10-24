import test from "node:test";
import assert from "node:assert/strict";
import { formatSaaSPlanOption, getAssignableSaaSPlans, readAdminBillingResponse } from "../lib/adminBillingPlans.js";

const launchPlans = [
  { id: "basic-id", key: "basic", name: "Basic", price: 2999, interval: "monthly", isActive: true },
  { id: "pro-id", key: "pro", name: "Pro", price: 5999, interval: "monthly", isActive: true },
  { id: "professional-id", key: "professional", name: "Professional", price: 9999, interval: "monthly", isActive: true },
];

test("assignable launch plans retain stable ids and show their PKR monthly prices", () => {
  const plans = getAssignableSaaSPlans(launchPlans);
  assert.deepEqual(plans.map(({ id }) => id), ["basic-id", "pro-id", "professional-id"]);
  assert.deepEqual(plans.map(formatSaaSPlanOption), [
    "Basic · PKR 2,999 / month",
    "Pro · PKR 5,999 / month",
    "Professional · PKR 9,999 / month",
  ]);
});

test("assignment options omit inactive and malformed catalog records without choosing a default", () => {
  assert.deepEqual(getAssignableSaaSPlans([
    ...launchPlans,
    { ...launchPlans[0], id: "inactive", isActive: false },
    { ...launchPlans[1], id: "" },
  ]).map(({ id }) => id), ["basic-id", "pro-id", "professional-id"]);
  assert.deepEqual(getAssignableSaaSPlans([]), []);
  assert.deepEqual(getAssignableSaaSPlans(null), []);
});

test("billing response distinguishes an empty catalog, failed request, and missing catalog payload", async () => {
  const empty = await readAdminBillingResponse(new Response(JSON.stringify({ success: true, data: { plans: [] } })), { expectPlanCatalog: true });
  assert.deepEqual(empty.plans, []);
  await assert.rejects(readAdminBillingResponse(new Response(JSON.stringify({ success: false, error: { message: "Billing unavailable" } }), { status: 503 }), { expectPlanCatalog: true }), /Billing unavailable/);
  await assert.rejects(readAdminBillingResponse(new Response("not json"), { expectPlanCatalog: true }), /unreadable response/);
  await assert.rejects(readAdminBillingResponse(new Response(JSON.stringify({ success: true, data: {} })), { expectPlanCatalog: true }), /did not include the SaaS plan catalog/);
});
