import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextRequest } from "next/server.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

// Next resolves extensionless application imports. Match that resolution only for
// existing project JS files when exercising the actual handlers in Node tests.
const projectUrl = new URL("../", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.startsWith(projectUrl)
    && !context.parentURL.includes("/node_modules/")
    && specifier.startsWith(".")
    && !/\.[a-z]+$/i.test(specifier)) {
    const candidate = new URL(`${specifier}.js`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });
const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "saas_entitlements");

test("SaaS API enforcement, transactions, branch isolation, billing and reversible migration", { skip: !testUri }, async (t) => {
  const beforeEnv = { uri: process.env.MONGODB_URI, secret: process.env.AUTH_SESSION_SECRET };
  process.env.MONGODB_URI = testUri;
  process.env.AUTH_SESSION_SECRET = randomBytes(32).toString("hex");
  const { default: connect } = await import("../lib/db.js");
  const models = {};
  for (const name of ["Gym", "SaaSPlan", "Branch", "User", "GymMembership", "AuthSession", "Member", "Plan", "Trainer", "Attendance", "Payment", "Subscription", "PlatformInvoice", "StaffInvitation", "Counter", "PublicTrialClaim"]) models[name] = (await import(`../models/${name}.js`)).default;
  const { Gym, SaaSPlan, Branch, User, GymMembership, Member, Plan, PlatformInvoice } = models;
  const { LAUNCH_PLANS } = await import("../lib/saasPlanRules.js");
  const { addBillingInterval, planSnapshot } = await import("../lib/platformBillingRules.js");
  const { createSession } = await import("../lib/auth.js");
  const { assertGymLimit } = await import("../lib/entitlements.js");
  const { POST: addMember, GET: listMembers } = await import("../app/api/members/route.js");
  const { PATCH: updateMember } = await import("../app/api/members/[id]/route.js");
  const { POST: branches } = await import("../app/api/branches/route.js");
  const { GET: reports } = await import("../app/api/reports/route.js");
  const { GET: paymentReports } = await import("../app/api/payment-reports/route.js");
  const { GET: exports } = await import("../app/api/exports/route.js");
  const { POST: requestPlan, GET: billing } = await import("../app/api/gym/billing/route.js");
  const { POST: adminBilling } = await import("../app/api/admin/billing/route.js");
  const { GET: getAdminBilling } = await import("../app/api/admin/billing/route.js");
  const { applyBranchMigration, inspectBranchMigration, rollbackBranchMigration } = await import("../lib/branchMigration.js");
  const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";
  const req = (path, token, body, branch, method = "POST") => new NextRequest(`http://localhost${path}`, {
    method: body ? method : "GET", headers: { origin: "http://localhost", "content-type": "application/json", cookie: `${cookieName}=${token}`, ...(branch ? { "x-fitivo-branch": String(branch) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const sessionToken = async (id) => (await createSession(id)).cookies.get(cookieName).value;
  const data = async (response, expected = 200) => { const result = await response.json(); assert.equal(response.status, expected, JSON.stringify(result)); return result.data; };
  let connected = false;
  try {
    await connect(); connected = true;
    for (const Model of Object.values(models)) await Model.init();
    await mongoose.connection.db.createCollection("branchmigrationjournals");
    const plans = [];
    for (const item of LAUNCH_PLANS) plans.push(await SaaSPlan.create(item));
    const admin = await User.create({ email: "admin@entitlements.test", passwordHash: "synthetic", role: "superadmin" });
    const adminToken = await sessionToken(admin._id);
    async function fixture(slug, plan, limits = {}) {
      const owner = await User.create({ email: `${slug}@entitlements.test`, passwordHash: "synthetic" });
      const snapshot = planSnapshot(plan); snapshot.limits = { ...snapshot.limits, ...limits };
      const gym = await Gym.create({ name: slug, slug, saasAccessRequired: true, saasSubscription: { planId: plan._id, planSnapshot: snapshot, status: "active", periodStart: new Date(Date.now() - 86400000), periodEnd: new Date(Date.now() + 86400000 * 20) } });
      await GymMembership.create({ userId: owner._id, gymId: gym._id, role: "gym_owner" });
      const membershipPlan = await Plan.create({ gymId: gym._id, name: "Monthly", price: 1000, durationDays: 30 });
      return { gym, owner, membershipPlan, token: await sessionToken(owner._id) };
    }
    const basic = await fixture("basic-gym", plans[0], { members: 1, staff: 1 });
    const professional = await fixture("professional-gym", plans[2], { branches: 2 });
    const other = await fixture("other-gym", plans[1]);
    const memberBody = (planId, phone) => ({ fullName: "Synthetic Member", phone, gender: "Other", planId: String(planId), startDate: "2026-10-24" });

    await t.test("Superadmin billing catalog lists the three active launch plans", async () => {
      const response = await getAdminBilling(req("/api/admin/billing", adminToken));
      const result = await data(response);
      assert.deepEqual(result.plans.filter((plan) => plan.key).map(({ key }) => key).sort(), ["basic", "pro", "professional"]);
      assert.deepEqual(result.plans.filter((plan) => plan.key).map(({ isActive }) => isActive), [true, true, true]);
    });

    await t.test("Basic denies direct analytics and CSV but serves basic reports", async () => {
      assert.equal((await reports(req("/api/reports", basic.token))).status, 403);
      assert.equal((await exports(req("/api/exports", basic.token))).status, 403);
      await data(await reports(req("/api/reports?basic=1", basic.token)));
      await data(await reports(req("/api/reports", other.token)));
      assert.equal((await branches(req("/api/branches", basic.token, { name: "Unauthorized branch" }))).status, 403);
    });
    let firstMember;
    await t.test("concurrent member creation and reactivation cannot exceed the organization cap", async () => {
      const responses = await Promise.all(["03001111111", "03002222222"].map((phone) => addMember(req("/api/members", basic.token, memberBody(basic.membershipPlan._id, phone)))));
      assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
      assert.equal(await Member.countDocuments({ gymId: basic.gym._id }), 1);
      firstMember = await Member.findOne({ gymId: basic.gym._id }).lean();
      await data(await updateMember(req(`/api/members/${firstMember._id}`, basic.token, { isActive: false }, null, "PATCH"), { params: Promise.resolve({ id: String(firstMember._id) }) }));
      await data(await addMember(req("/api/members", basic.token, memberBody(basic.membershipPlan._id, "03003333333"))), 201);
      const response = await updateMember(req(`/api/members/${firstMember._id}`, basic.token, { isActive: true }, null, "PATCH"), { params: Promise.resolve({ id: String(firstMember._id) }) });
      assert.equal(response.status, 409);
      assert.equal((await Member.findById(firstMember._id).lean()).isActive, false);
    });
    let east;
    await t.test("concurrent branch creation admits only one final slot", async () => {
      const responses = await Promise.all(["East", "West"].map((name) => branches(req("/api/branches", professional.token, { name }))));
      assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
      east = await Branch.findOne({ gymId: professional.gym._id, isDefault: false }).lean();
      assert.ok(east);
    });
    await t.test("cross-gym and cross-branch ids, body ownership and staff switching are denied", async () => {
      const eastPlan = await Plan.create({ gymId: professional.gym._id, branchId: east._id, name: "East monthly", price: 1000, durationDays: 30 });
      const created = await data(await addMember(req("/api/members", professional.token, memberBody(eastPlan._id, "03004444444"), east._id)), 201);
      const main = await data(await listMembers(req("/api/members", professional.token)));
      assert.equal(main.items.length, 0);
      const scoped = await data(await listMembers(req("/api/members", professional.token, null, east._id)));
      assert.equal(scoped.items.length, 1);
      assert.equal((await listMembers(req("/api/members", other.token, null, east._id))).status, 403);
      assert.equal((await addMember(req("/api/members", professional.token, { ...memberBody(eastPlan._id, "03005555555"), gymId: String(other.gym._id) }, east._id))).status, 400);
      assert.equal((await updateMember(req(`/api/members/${created._id}`, professional.token, { isActive: false }, null, "PATCH"), { params: Promise.resolve({ id: String(created._id) }) })).status, 404);
      const staff = await User.create({ email: "staff@entitlements.test", passwordHash: "synthetic" });
      await GymMembership.create({ gymId: professional.gym._id, userId: staff._id, role: "gym_admin", branchId: east._id });
      const token = await sessionToken(staff._id);
      assert.equal((await listMembers(req("/api/members", token, null, professional.gym._id))).status, 403);
      assert.equal((await branches(req("/api/branches", token, { action: "select", branchId: "all" }))).status, 403);
      await data(await listMembers(req("/api/members", token)));
      assert.equal((await listMembers(req("/api/members", professional.token, null, "all"))).status, 403);
      await data(await reports(req("/api/reports", professional.token, null, "all")));
      await data(await paymentReports(req("/api/payment-reports", professional.token, null, "all")));
    });
    await t.test("concurrent staff enrollment uses the same organization lock", async () => {
      const users = await User.create([{ email: "one@staff.test", passwordHash: "synthetic" }, { email: "two@staff.test", passwordHash: "synthetic" }]);
      const enroll = async (user) => {
        const session = await mongoose.startSession();
        try { await session.withTransaction(async () => { await assertGymLimit(basic.gym._id, "staff", { session }); await GymMembership.create([{ gymId: basic.gym._id, userId: user._id, role: "gym_admin" }], { session }); }); }
        finally { await session.endSession(); }
      };
      const results = await Promise.allSettled(users.map(enroll));
      assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(results.find((result) => result.status === "rejected").reason.code, "LIMIT_EXCEEDED");
    });
    await t.test("requests and invoices preserve paid terms until manual reconciliation", async () => {
      const original = (await Gym.findById(basic.gym._id).lean()).saasSubscription;
      await data(await requestPlan(req("/api/gym/billing", basic.token, { planId: String(plans[1]._id) })), 201);
      assert.deepEqual((await Gym.findById(basic.gym._id).lean()).saasSubscription, original);
      const deniedAssignment = await adminBilling(req("/api/admin/billing", basic.token, { action: "assign_plan", gymId: String(basic.gym._id), planId: String(plans[1]._id), mode: "invoice" }));
      assert.equal(deniedAssignment.status, 403);
      const invalidPlan = await adminBilling(req("/api/admin/billing", adminToken, { action: "assign_plan", gymId: String(basic.gym._id), planId: new mongoose.Types.ObjectId().toString(), mode: "invoice" }));
      assert.equal(invalidPlan.status, 400);
      assert.equal((await invalidPlan.json()).error.code, "INVALID_PLAN");
      const issued = await data(await adminBilling(req("/api/admin/billing", adminToken, { action: "assign_plan", gymId: String(basic.gym._id), planId: String(plans[1]._id), mode: "invoice" })), 201);
      assert.equal(issued.invoice.planId, String(plans[1]._id));
      const pending = (await Gym.findById(basic.gym._id).lean()).saasSubscription;
      assert.equal(pending.status, "active"); assert.deepEqual(pending.planSnapshot, original.planSnapshot);
      const claim = { action: "submit_payment_claim", invoiceId: issued.invoice.id, reference: "OWNER-CLAIM-123" };
      assert.equal((await requestPlan(req("/api/gym/billing", other.token, claim))).status, 409, "an owner cannot submit a claim against another Gym's invoice");
      await data(await requestPlan(req("/api/gym/billing", basic.token, claim)), 201);
      assert.equal((await PlatformInvoice.findById(issued.invoice.id).lean()).status, "open");
      assert.equal((await Gym.findById(basic.gym._id).lean()).saasSubscription.planSnapshot.key, "basic", "a reference claim does not activate the selected plan");
      assert.equal((await requestPlan(req("/api/gym/billing", basic.token, claim))).status, 409, "duplicate active owner claims are rejected");
      const claimedInvoice = await PlatformInvoice.findById(issued.invoice.id).lean();
      const firstClaimId = String(claimedInvoice.paymentClaims[0]._id);
      const reject = await adminBilling(req("/api/admin/billing", adminToken, { action: "reject_payment_claim", invoiceId: issued.invoice.id, claimId: firstClaimId, reason: "No matching funds received" }));
      assert.equal(reject.status, 200);
      assert.equal((await PlatformInvoice.findById(issued.invoice.id).lean()).status, "open", "rejection preserves the invoice");
      await data(await requestPlan(req("/api/gym/billing", basic.token, { ...claim, reference: "OWNER-CLAIM-456" })), 201);
      const verification = { verifiedAmount: issued.invoice.amountDue, verifiedReference: "verified-test-reference", verificationNotes: "Matched bank credit against the invoice", paymentIndependentlyVerified: true };
      assert.equal((await adminBilling(req("/api/admin/billing", basic.token, { action: "reconcile_invoice", invoiceId: issued.invoice.id, ...verification }))).status, 403);
      await data(await adminBilling(req("/api/admin/billing", adminToken, { action: "reconcile_invoice", invoiceId: issued.invoice.id, ...verification })));
      assert.equal((await Gym.findById(basic.gym._id).lean()).saasSubscription.planSnapshot.key, "pro");
      const verifiedInvoice = await PlatformInvoice.findById(issued.invoice.id).lean();
      assert.equal(verifiedInvoice.status, "paid");
      assert.equal(verifiedInvoice.verifiedAmount, issued.invoice.amountDue);
      assert.equal(verifiedInvoice.verifiedReference, "verified-test-reference");
      assert.equal(String(verifiedInvoice.verifiedBy), String(admin._id));
      assert.deepEqual(verifiedInvoice.paymentClaims.map((item) => item.status), ["rejected", "approved"]);
      const ownerView = await data(await billing(req("/api/gym/billing", basic.token)));
      const ownerInvoice = ownerView.subscription.invoices.find((item) => item.id === issued.invoice.id);
      assert.equal(ownerInvoice.verifiedReference, "verified-test-reference");
      assert.equal(Object.hasOwn(ownerInvoice, "verificationNotes"), false, "internal verification notes stay in the Superadmin audit view");
      assert.equal(Object.hasOwn(ownerInvoice, "verifiedBy"), false);
      assert.equal((await adminBilling(req("/api/admin/billing", adminToken, { action: "reconcile_invoice", invoiceId: issued.invoice.id, ...verification }))).status, 409);
      const renewalResponse = await adminBilling(req("/api/admin/billing", adminToken, { action: "renew_invoice", gymId: String(basic.gym._id) }));
      const renewalData = await data(renewalResponse, 201);
      const elapsedStart = new Date(Date.now() - 5 * 86400000);
      await PlatformInvoice.updateOne({ _id: renewalData.invoice.id }, { $set: { periodStart: elapsedStart, periodEnd: new Date(elapsedStart.getTime() + 86400000) } });
      const renewed = await data(await adminBilling(req("/api/admin/billing", adminToken, { action: "reconcile_invoice", invoiceId: renewalData.invoice.id, verifiedAmount: renewalData.invoice.amountDue, verifiedReference: "verified-renewal", verificationNotes: "Matched renewal transfer in receiving bank", paymentIndependentlyVerified: true })));
      const renewedGym = await Gym.findById(basic.gym._id).lean();
      assert.equal(renewedGym.saasSubscription.periodStart.getTime(), verifiedInvoice.paidAt.getTime(), "renewal preserves the already-paid period start");
      assert.equal(renewedGym.saasSubscription.periodEnd.getTime(), new Date(renewed.invoice.periodEnd).getTime());
      assert.equal(new Date(renewed.invoice.periodStart).getTime(), new Date(renewed.invoice.paidAt).getTime(), "an elapsed renewal starts at verification");
      assert.equal(new Date(renewed.invoice.periodEnd).getTime(), addBillingInterval(renewed.invoice.paidAt, "monthly").getTime());
      const voidGym = await fixture("void-invoice-gym", plans[0]);
      const voidIssued = await data(await adminBilling(req("/api/admin/billing", adminToken, { action: "assign_plan", gymId: String(voidGym.gym._id), planId: String(plans[1]._id), mode: "invoice" })), 201);
      const beforeVoid = (await Gym.findById(voidGym.gym._id).lean()).saasSubscription;
      const blockedCancellation = await adminBilling(req("/api/admin/billing", adminToken, { action: "cancel_subscription", gymId: String(voidGym.gym._id) }));
      assert.equal(blockedCancellation.status, 409, "an open pending invoice blocks cancellation");
      const conflictBody = await blockedCancellation.json();
      assert.equal(conflictBody.error.context.code, "PENDING_INVOICE");
      assert.equal(conflictBody.error.context.gym.id, String(voidGym.gym._id));
      assert.equal(conflictBody.error.context.invoice.id, voidIssued.invoice.id);
      assert.equal((await adminBilling(req("/api/admin/billing", voidGym.token, { action: "void_invoice", invoiceId: voidIssued.invoice.id, reason: "Owner selected the wrong plan" }))).status, 403, "owners cannot void platform invoices");
      const voidResult = await adminBilling(req("/api/admin/billing", adminToken, { action: "void_invoice", invoiceId: voidIssued.invoice.id, reason: "Owner selected the wrong plan" }));
      assert.equal(voidResult.status, 200);
      const voidedInvoice = await PlatformInvoice.findById(voidIssued.invoice.id).lean();
      assert.equal(voidedInvoice.status, "void");
      assert.equal(voidedInvoice.voidReason, "Owner selected the wrong plan");
      const afterVoid = (await Gym.findById(voidGym.gym._id).lean()).saasSubscription;
      assert.equal(afterVoid.planSnapshot.key, beforeVoid.planSnapshot.key);
      assert.equal(afterVoid.status, "active");
      assert.equal(afterVoid.pendingInvoiceId, null, "voiding clears the conflict without activating the invoice plan");
      const cancelled = await adminBilling(req("/api/admin/billing", adminToken, { action: "cancel_subscription", gymId: String(voidGym.gym._id) }));
      assert.equal(cancelled.status, 200, "cancellation is permitted after invoice resolution");
      assert.equal((await Gym.findById(voidGym.gym._id).lean()).saasSubscription.status, "cancelled");
      const downgrade = await requestPlan(req("/api/gym/billing", professional.token, { planId: String(plans[1]._id) }));
      assert.equal(downgrade.status, 409);
      assert.equal((await downgrade.json()).error.code, "DOWNGRADE_REMEDIATION_REQUIRED");
      assert.equal((await adminBilling(req("/api/admin/billing", adminToken, { action: "assign_plan", gymId: String(basic.gym._id), planId: String(plans[0]._id), mode: "trial", trialDays: 7 }))).status, 409);
    });
    await t.test("concurrent renewal and cancellation cannot attach an invoice to cancelled terms", async () => {
      const target = await fixture("renewal-race", plans[0]);
      const results = await Promise.all([
        adminBilling(req("/api/admin/billing", adminToken, { action: "renew_invoice", gymId: String(target.gym._id) })),
        adminBilling(req("/api/admin/billing", adminToken, { action: "cancel_subscription", gymId: String(target.gym._id) })),
      ]);
      const statuses = results.map((response) => response.status).sort();
      assert.ok(JSON.stringify(statuses) === JSON.stringify([200, 409]) || JSON.stringify(statuses) === JSON.stringify([201, 409]));
      const saved = await Gym.findById(target.gym._id).lean();
      const open = await PlatformInvoice.countDocuments({ gymId: target.gym._id, status: "open" });
      if (saved.saasSubscription.status === "cancelled") { assert.equal(open, 0); assert.equal(saved.saasSubscription.pendingInvoiceId, null); }
      else { assert.equal(open, 1); assert.ok(saved.saasSubscription.pendingInvoiceId); }
    });
    await t.test("expired subscription blocks operations while billing stays available", async () => {
      await Gym.updateOne({ _id: other.gym._id }, { $set: { "saasSubscription.periodEnd": new Date(0) } });
      const response = await listMembers(req("/api/members", other.token));
      assert.equal(response.status, 403); assert.equal((await response.json()).error.code, "SUBSCRIPTION_INACTIVE");
      await data(await billing(req("/api/gym/billing", other.token)));
    });
    await t.test("migration validates, assigns legacy rows, and restores exact null/missing shape", async () => {
      const db = mongoose.connection.db;
      const subscriptionBefore = (await Gym.findById(basic.gym._id).lean()).saasSubscription;
      const report = await inspectBranchMigration(db, basic.gym._id);
      assert.equal(report.issues.length, 0); assert.ok(report.entries.length > 0);
      const original = await db.collection("plans").findOne({ _id: basic.membershipPlan._id });
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(() => applyBranchMigration(db, basic.gym._id, session));
        assert.equal(String((await Plan.findById(basic.membershipPlan._id).lean()).branchId), String(basic.gym._id));
        await session.withTransaction(() => rollbackBranchMigration(db, basic.gym._id, session));
      } finally { await session.endSession(); }
      assert.deepEqual(await db.collection("plans").findOne({ _id: basic.membershipPlan._id }), original);
      assert.deepEqual((await Gym.findById(basic.gym._id).lean()).saasSubscription, subscriptionBefore);
    });
  } finally {
    // Only the uniquely generated disposable database can reach this cleanup.
    if (connected) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    globalThis.mongooseCache = { connection: null, promise: null };
    for (const [key, value] of [["MONGODB_URI", beforeEnv.uri], ["AUTH_SESSION_SECRET", beforeEnv.secret]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
