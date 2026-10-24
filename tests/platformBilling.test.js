import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET as adminBilling, POST as updateAdminBilling } from "../app/api/admin/billing/route.js";
import { GET as gymBilling } from "../app/api/gym/billing/route.js";
import { POST as processSaaSExpiry } from "../app/api/cron/saas-expiry/route.js";
import { addBillingInterval, expiredSaaSPaidPeriodFilter, expiredSaaSTrialFilter, invoiceMatchesPendingSubscription, serializeGymSaaSSubscription, validateInvoiceVoid, validateManualReconciliation, validatePaymentClaim, validatePaymentClaimRejection, validatePlatformSettings, validateSaaSPlanBody } from "../lib/platformBillingRules.js";

test("SaaS plans validate prices, intervals, and only supported feature limits", () => {
  assert.deepEqual(validateSaaSPlanBody({ name: "Growth", price: 2500, interval: "monthly", limits: { members: 100, trainers: null } }), { name: "Growth", price: 2500, interval: "monthly", limits: { members: 100, trainers: null } });
  assert.equal(validateSaaSPlanBody({ name: "x", price: 10.5, interval: "weekly" }).message.length > 0, true);
  assert.equal(validateSaaSPlanBody({ name: "Growth", price: 100, interval: "monthly", limits: { payments: null } }).fields["limits.payments"], "This limit cannot be configured.");
  assert.equal(validateSaaSPlanBody({ name: "Growth", price: 100, interval: "monthly", gatewaySecret: "secret" }).fields.gatewaySecret, "This field cannot be changed.");
});

test("SaaS plan deactivation confirms before changing plan availability", async () => {
  const source = await readFile(fileURLToPath(new URL("../components/admin/admin-billing-manager.js", import.meta.url)), "utf8");
  assert.match(source, /item\.isActive && !window\.confirm\(`Deactivate \$\{item\.name\}\? Existing subscriptions will keep their current terms\.`\)/);
  assert.match(source, /isActive: !item\.isActive/);
});

test("billing intervals clamp month-end dates and preserve UTC time", () => {
  assert.equal(addBillingInterval(new Date("2026-01-31T10:20:00.000Z"), "monthly").toISOString(), "2026-02-28T10:20:00.000Z");
  assert.equal(addBillingInterval(new Date("2026-02-28T10:20:00.000Z"), "yearly").toISOString(), "2027-02-28T10:20:00.000Z");
});

test("Gym SaaS billing reports expired trials and paid periods at their boundary", () => {
  const now = new Date("2026-10-20T00:00:00.000Z");
  const base = { planId: "plan", planSnapshot: { name: "Basic" }, status: "trialing", trialEndsAt: now };
  assert.equal(serializeGymSaaSSubscription(base, [], now).status, "trial_ended");
  assert.equal(serializeGymSaaSSubscription({ ...base, status: "active", periodEnd: now }, [], now).status, "expired");
});

test("subscription history serialization exposes invoice actors and explicit complimentary grant audit", () => {
  const grantActor = { _id: "admin-id", fullName: "Platform Admin", email: "admin@example.test" };
  const invoiceActor = { _id: "verifier-id", email: "verifier@example.test" };
  const subscription = { planId: "plan-id", planSnapshot: { name: "Basic" }, status: "active", complimentaryGrant: { reason: "Launch accommodation", grantedAt: new Date("2026-10-20T00:00:00Z"), grantedBy: grantActor } };
  const invoice = { _id: "invoice-id", invoiceNumber: "FITIVO-1", gymId: "gym-id", planId: "plan-id", planSnapshot: { name: "Basic" }, previousPlanSnapshot: { name: "Pro" }, changesPlan: true, amountDue: 2999, currency: "PKR", periodStart: new Date("2026-10-20T00:00:00Z"), periodEnd: new Date("2026-11-20T00:00:00Z"), status: "paid", issuedAt: new Date("2026-10-19T00:00:00Z"), paidAt: new Date("2026-10-20T00:00:00Z"), createdBy: invoiceActor, reconciledBy: invoiceActor };
  const result = serializeGymSaaSSubscription(subscription, [invoice]);
  assert.equal(result.complimentaryGrant.reason, "Launch accommodation");
  assert.equal(result.complimentaryGrant.grantedBy.name, "Platform Admin");
  assert.equal(result.invoices[0].previousPlanSnapshot.name, "Pro");
  assert.equal(result.invoices[0].reconciledBy.name, "verifier@example.test");
});

test("expiry processing selects boundary-expired terms once and invoice reconciliation requires its pending subscription", () => {
  const now = new Date("2026-10-20T00:00:00.000Z");
  assert.deepEqual(expiredSaaSTrialFilter(now), { "saasSubscription.status": "trialing", $or: [{ "saasSubscription.trialEndsAt": { $lte: now } }, { "saasSubscription.trialEndsAt": null }] });
  assert.deepEqual(expiredSaaSPaidPeriodFilter(now), { "saasSubscription.status": "active", $or: [{ "saasSubscription.periodEnd": { $lte: now } }, { "saasSubscription.periodEnd": null }] });
  const subscription = { _id: "gym-subscription", planId: "plan", pendingInvoiceId: "invoice", planSnapshot: { price: 2500, currency: "PKR", interval: "monthly" } };
  const invoice = { _id: "invoice", planId: "plan", amountDue: 2500, currency: "PKR", planSnapshot: { price: 2500, currency: "PKR", interval: "monthly" }, periodStart: "2026-10-20T00:00:00Z", periodEnd: "2026-11-20T00:00:00Z" };
  assert.equal(invoiceMatchesPendingSubscription(subscription, invoice), true);
  assert.equal(invoiceMatchesPendingSubscription({ ...subscription, pendingInvoiceId: "other" }, invoice), false);
  assert.equal(invoiceMatchesPendingSubscription(subscription, { ...invoice, amountDue: 3000 }), false);
});

test("manual reconciliation, invoice voiding, and platform settings require bounded valid input", () => {
  const verified = validateManualReconciliation({ verifiedAmount: 2999, verifiedReference: " BANK-123 ", verificationNotes: "Checked receiving account", paymentIndependentlyVerified: true });
  assert.equal(verified.verifiedReference, "BANK-123");
  assert.ok(validateManualReconciliation({ verifiedAmount: 2999, verifiedReference: "BANK-123", verificationNotes: "Checked", paymentIndependentlyVerified: false }).message);
  assert.ok(validateManualReconciliation({ verifiedAmount: 1, verifiedReference: "BANK-123", verificationNotes: "Checked receiving account", paymentIndependentlyVerified: true }).verifiedAmount === 1);
  assert.ok(validatePaymentClaim({ invoiceId: "507f1f77bcf86cd799439011", reference: "WALLET-123" }).reference === "WALLET-123");
  assert.ok(validatePaymentClaimRejection({ invoiceId: "507f1f77bcf86cd799439011", claimId: "507f1f77bcf86cd799439012", reason: "Reference not received" }).reason);
  assert.equal(validateInvoiceVoid({ reason: "Duplicate invoice" }).reason, "Duplicate invoice");
  assert.ok(validateInvoiceVoid({ reason: " " }).message);
  assert.deepEqual(validatePlatformSettings({ defaultTrialDays: 14, manualBillingInstructions: "Pay by transfer", paymentInstructions: [{ type: "bank_transfer", instructions: "Use the Fitivo invoice number." }] }), { defaultTrialDays: 14, manualBillingInstructions: "Pay by transfer", paymentInstructions: [{ type: "bank_transfer", instructions: "Use the Fitivo invoice number." }] });
  assert.ok(validatePlatformSettings({ paymentInstructions: [{ type: "crypto", instructions: "Send funds" }] }).message);
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

test("SaaS expiry processing requires its configured Bearer secret before database access", async () => {
  const previousSecret = process.env.SAAS_EXPIRY_CRON_SECRET;
  process.env.SAAS_EXPIRY_CRON_SECRET = "x".repeat(40);
  try {
    const response = await processSaaSExpiry(new Request("http://localhost/api/cron/saas-expiry", { method: "POST" }));
    assert.equal(response.status, 401);
  } finally {
    if (previousSecret === undefined) delete process.env.SAAS_EXPIRY_CRON_SECRET;
    else process.env.SAAS_EXPIRY_CRON_SECRET = previousSecret;
  }
});

test("platform billing requires superadmin and owner billing uses the authenticated Gym context", async () => {
  const adminSource = await readFile(fileURLToPath(new URL("../app/api/admin/billing/route.js", import.meta.url)), "utf8");
  const ownerSource = await readFile(fileURLToPath(new URL("../app/api/gym/billing/route.js", import.meta.url)), "utf8");
  assert.equal((adminSource.match(/await requireSuperadminUser\(request\)/g) || []).length, 2);
  assert.match(ownerSource, /allowedRoles: \["gym_owner"\]/);
  assert.match(ownerSource, /allowSaaSInactive: true, allowSuspendedGym: true/);
  assert.match(ownerSource, /getRequestGymId\(request\)/);
  assert.doesNotMatch(ownerSource, /body\.gymId|searchParams|get\("gymId"\)/);
  assert.match(ownerSource, /Object\.keys\(body\)\.some\(\(key\) => key !== "planId"\)/);
});
