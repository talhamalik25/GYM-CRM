import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET as adminBilling, POST as updateAdminBilling } from "../app/api/admin/billing/route.js";
import { GET as gymBilling } from "../app/api/gym/billing/route.js";
import { addBillingInterval, validateInvoiceVoid, validateManualReconciliation, validatePlatformSettings, validateSaaSPlanBody } from "../lib/platformBillingRules.js";

test("SaaS plans validate prices, intervals, and only supported feature limits", () => {
  assert.deepEqual(validateSaaSPlanBody({ name: "Growth", price: 2500, interval: "monthly", limits: { members: 100, trainers: null } }), { name: "Growth", price: 2500, interval: "monthly", limits: { members: 100, trainers: null } });
  assert.equal(validateSaaSPlanBody({ name: "x", price: 10.5, interval: "weekly" }).message.length > 0, true);
  assert.equal(validateSaaSPlanBody({ name: "Growth", price: 100, interval: "monthly", limits: { payments: null } }).fields["limits.payments"], "This limit cannot be configured.");
  assert.equal(validateSaaSPlanBody({ name: "Growth", price: 100, interval: "monthly", gatewaySecret: "secret" }).fields.gatewaySecret, "This field cannot be changed.");
});

test("billing intervals clamp month-end dates and preserve UTC time", () => {
  assert.equal(addBillingInterval(new Date("2026-01-31T10:20:00.000Z"), "monthly").toISOString(), "2026-02-28T10:20:00.000Z");
  assert.equal(addBillingInterval(new Date("2026-02-28T10:20:00.000Z"), "yearly").toISOString(), "2027-02-28T10:20:00.000Z");
});

test("manual reconciliation, invoice voiding, and platform settings require bounded valid input", () => {
  assert.ok(validateManualReconciliation({ paymentReference: "  BANK-123 " }).paymentReference === "BANK-123");
  assert.ok(validateManualReconciliation({ paymentReference: "" }).message);
  assert.equal(validateInvoiceVoid({ reason: "Duplicate invoice" }).reason, "Duplicate invoice");
  assert.ok(validateInvoiceVoid({ reason: " " }).message);
  assert.deepEqual(validatePlatformSettings({ defaultTrialDays: 14, manualBillingInstructions: "Pay by transfer" }), { defaultTrialDays: 14, manualBillingInstructions: "Pay by transfer" });
  assert.ok(validatePlatformSettings({ defaultTrialDays: 91 }).message);
  assert.ok(validatePlatformSettings({ providerSecret: "x" }).fields.providerSecret);
});

test("platform and Gym SaaS billing APIs deny unauthenticated requests before database access", async () => {
  const getAdmin = await adminBilling(new Request("http://localhost/api/admin/billing"));
  const postAdmin = await updateAdminBilling(new Request("http://localhost/api/admin/billing", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ action: "update_settings", defaultTrialDays: 30 }) }));
  const getOwner = await gymBilling(new Request("http://localhost/api/gym/billing"));
  assert.equal(getAdmin.status, 401);
  assert.equal(postAdmin.status, 401);
  assert.equal(getOwner.status, 401);
});

test("platform billing requires superadmin and owner billing uses the authenticated Gym context", async () => {
  const adminSource = await readFile(fileURLToPath(new URL("../app/api/admin/billing/route.js", import.meta.url)), "utf8");
  const ownerSource = await readFile(fileURLToPath(new URL("../app/api/gym/billing/route.js", import.meta.url)), "utf8");
  assert.equal((adminSource.match(/await requireSuperadminUser\(request\)/g) || []).length, 2);
  assert.match(ownerSource, /allowedRoles: \["gym_owner"\]/);
  assert.match(ownerSource, /getRequestGymId\(request\)/);
  assert.doesNotMatch(ownerSource, /request\.json|searchParams|get\("gymId"\)/);
});
