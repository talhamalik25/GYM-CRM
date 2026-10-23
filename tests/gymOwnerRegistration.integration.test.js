import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { POST as register } from "../app/api/auth/register/route.js";
import { GET as dashboard } from "../app/api/dashboard/owner/route.js";
import { GET as billing } from "../app/api/gym/billing/route.js";
import { GET as profile } from "../app/api/account/profile/route.js";
import { GET as gymSettings, PATCH as updateGymSettings } from "../app/api/gym/settings/route.js";
import { POST as adminBilling } from "../app/api/admin/billing/route.js";
import { GET as expiryCron } from "../app/api/cron/saas-expiry/route.js";
import { GET as overview } from "../app/api/admin/overview/route.js";
import { GET as gymDetails } from "../app/api/admin/gyms/[id]/route.js";
import { POST as logout } from "../app/api/auth/logout/route.js";
import { createSession, requireApiUser } from "../lib/auth.js";
import { enforceSaaSCapacity } from "../lib/saasCapacity.js";
import { publicTrialSubscription } from "../lib/gymOwnerRegistration.js";
import { authorizeGymMembership } from "../lib/tenantAuthorization.js";
import { publicGymOperationalRedirect } from "../lib/publicTrialAccess.js";
import { verifyPassword } from "../lib/passwords.js";
import connectToDatabase from "../lib/db.js";
import User from "../models/User.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import AuthSession from "../models/AuthSession.js";
import SaaSPlan from "../models/SaaSPlan.js";
import PlatformInvoice from "../models/PlatformInvoice.js";
import PlatformSetting from "../models/PlatformSetting.js";
import PublicTrialClaim from "../models/PublicTrialClaim.js";
import Plan from "../models/Plan.js";
import Member from "../models/Member.js";
import Trainer from "../models/Trainer.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "public_trial_registration");
const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";
const valid = { fullName: "Public Owner", email: "public-owner@example.test", password: "public-owner-long-password", gymName: "Public Trial Gym" };
function request(url, token, body) {
  const result = new Request(`http://localhost${url}`, body ? { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  if (token) Object.defineProperty(result, "cookies", { value: { get: (name) => name === cookieName ? { value: token } : undefined } });
  return result;
}
function tokenFrom(response) { return response.cookies.get(cookieName).value; }
async function counts() {
  return Promise.all([User, Gym, GymMembership, AuthSession, PublicTrialClaim, PlatformInvoice].map((Model) => Model.countDocuments({})));
}

test("public trial onboarding, expiry, verified reactivation and existing-gym isolation", { skip: !testUri }, async (t) => {
  const keys = ["MONGODB_URI", "AUTH_SESSION_SECRET", "PUBLIC_REGISTRATION_ENABLED", "PUBLIC_TRIAL_PLAN_ID", "CRON_SECRET"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.MONGODB_URI = testUri;
  process.env.AUTH_SESSION_SECRET = randomBytes(32).toString("hex");
  process.env.PUBLIC_REGISTRATION_ENABLED = "true";
  process.env.CRON_SECRET = randomBytes(32).toString("hex");
  const Models = [User, Gym, GymMembership, AuthSession, SaaSPlan, PlatformInvoice, PlatformSetting, PublicTrialClaim, Plan, Member, Trainer];
  try {
    await connectToDatabase();
    await Promise.all(Models.map((Model) => Model.init()));
    const plan = await SaaSPlan.create({ name: "Configured public plan", price: 2500, interval: "monthly", limits: { members: 0, trainers: 2 } });
    process.env.PUBLIC_TRIAL_PLAN_ID = String(plan._id);
    await PlatformSetting.create({ _id: "fitivo", defaultTrialDays: 30, manualBillingInstructions: "Contact billing@example.test for transfer details and send your invoice reference." });
    const admin = await User.create({ email: "admin@example.test", passwordHash: "synthetic", role: "platform_super_admin" });
    const adminToken = tokenFrom(await createSession(admin._id));
    const now = new Date();
    const oldTrial = publicTrialSubscription(plan, new Date(now.getTime() - 20 * 86400000));
    const futureTrial = publicTrialSubscription(plan, now);
    const legacyFixtures = [
      {}, { saasAccessRequired: true },
      { saasSubscription: oldTrial }, { saasSubscription: futureTrial },
      { saasSubscription: { ...oldTrial, status: "active", periodStart: now, periodEnd: new Date(now.getTime() + 30 * 86400000) } },
      { saasSubscription: { ...oldTrial, status: "active", periodEnd: new Date(now.getTime() - 1) } },
      { saasSubscription: { ...oldTrial, status: "past_due" } },
      { saasSubscription: { ...oldTrial, status: "cancelled" } },
      { status: "suspended" },
    ];
    const legacyIds = [];
    for (const [index, fixture] of legacyFixtures.entries()) {
      const _id = new mongoose.Types.ObjectId();
      legacyIds.push(_id);
      await Gym.collection.insertOne({ _id, name: `Existing Gym ${index}`, slug: `existing-gym-${index}`, status: "active", timezone: "Asia/Karachi", createdAt: now, ...fixture });
    }
    const readLegacy = () => Gym.collection.find({ _id: { $in: legacyIds } }).sort({ _id: 1 }).toArray();
    const originalLegacy = await readLegacy();
    let ownerToken, owner, gym;

    await t.test("creates exactly one seven-day trial, owner membership and hashed-password session", async () => {
      const response = await register(request("/api/auth/register", null, valid));
      assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
      ownerToken = tokenFrom(response);
      owner = await User.findOne({ email: valid.email }).select("+passwordHash").lean();
      assert.equal(await verifyPassword(valid.password, owner.passwordHash), true);
      assert.equal(owner.role, "staff");
      const memberships = await GymMembership.find({ userId: owner._id }).lean();
      assert.equal(memberships.length, 1);
      assert.equal(memberships[0].role, "gym_owner");
      gym = await Gym.findById(memberships[0].gymId).lean();
      assert.equal(gym.status, "active");
      assert.equal(gym.saasAccessRequired, true);
      assert.equal(gym.saasSubscription.trialStartedAt.getTime(), gym.createdAt.getTime());
      assert.equal(gym.saasSubscription.trialEndsAt - gym.createdAt, 604800000);
      assert.equal(String(gym.saasSubscription.planId), String(plan._id));
      assert.equal(await PublicTrialClaim.countDocuments({ userId: owner._id }), 1);
      assert.equal(await PlatformInvoice.countDocuments({ gymId: gym._id }), 0);
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 200);
      const capacityRequest = request("/api/members", ownerToken);
      assert.equal(await requireApiUser(capacityRequest), null);
      assert.equal((await enforceSaaSCapacity(capacityRequest, "members", Member)).status, 409);
    });

    await t.test("duplicates, existing gym identities and concurrent registrations cannot obtain another trial", async () => {
      const before = await counts();
      for (const body of [valid, { ...valid, gymName: "Different Gym" }, { ...valid, email: "different@example.test" }, { ...valid, email: "existing-test@example.test", gymName: "Existing Gym 0" }]) {
        assert.equal((await register(request("/api/auth/register", null, body))).status, 409);
      }
      assert.deepEqual(await counts(), before);
      const concurrent = { ...valid, email: "concurrent@example.test", gymName: "Concurrent Gym" };
      const responses = await Promise.all([register(request("/api/auth/register", null, concurrent)), register(request("/api/auth/register", null, concurrent))]);
      assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
      assert.equal(await Gym.countDocuments({ slug: "concurrent-gym" }), 1);
    });

    await t.test("transaction failure after gym creation rolls back all writes and permits a safe retry", async () => {
      const before = await counts();
      const body = { ...valid, email: "rollback@example.test", gymName: "Rollback Gym" };
      const secret = process.env.AUTH_SESSION_SECRET;
      delete process.env.AUTH_SESSION_SECRET; // createSession fails after account, gym, claim and membership writes.
      try { assert.equal((await register(request("/api/auth/register", null, body))).status, 503); }
      finally { process.env.AUTH_SESSION_SECRET = secret; }
      assert.deepEqual(await counts(), before);
      assert.equal((await register(request("/api/auth/register", null, body))).status, 200);
    });

    await t.test("missing or deactivated trial plan fails without partial registration", async () => {
      const before = await counts();
      process.env.PUBLIC_TRIAL_PLAN_ID = String(new mongoose.Types.ObjectId());
      assert.equal((await register(request("/api/auth/register", null, { ...valid, email: "missing@example.test", gymName: "Missing Plan Gym" }))).status, 503);
      process.env.PUBLIC_TRIAL_PLAN_ID = String(plan._id);
      await SaaSPlan.updateOne({ _id: plan._id }, { $set: { isActive: false } });
      try { assert.equal((await register(request("/api/auth/register", null, { ...valid, email: "disabled@example.test", gymName: "Disabled Plan Gym" }))).status, 503); }
      finally { await SaaSPlan.updateOne({ _id: plan._id }, { $set: { isActive: true } }); }
      assert.deepEqual(await counts(), before);
    });

    await t.test("registration fails closed if a required unique eligibility index is missing", async () => {
      const before = await counts();
      await PublicTrialClaim.collection.dropIndex("gymSlug_1");
      try {
        const response = await register(request("/api/auth/register", null, { ...valid, email: "no-index@example.test", gymName: "No Index Gym" }));
        assert.equal(response.status, 503);
        assert.deepEqual(await counts(), before);
      } finally { await PublicTrialClaim.createIndexes(); }
    });

    await t.test("public identity claims survive account deletion and gym renaming", async () => {
      const claimedOwner = await User.findOne({ email: "rollback@example.test" });
      const claim = await PublicTrialClaim.findOne({ userId: claimedOwner._id });
      await User.deleteOne({ _id: claimedOwner._id });
      await Gym.updateOne({ _id: claim.gymId }, { $set: { slug: "renamed-rollback" } });
      const before = await counts();
      assert.equal((await register(request("/api/auth/register", null, { ...valid, email: "rollback@example.test", gymName: "New Name Gym" }))).status, 409);
      assert.equal((await register(request("/api/auth/register", null, { ...valid, email: "new-name@example.test", gymName: "Rollback Gym" }))).status, 409);
      assert.deepEqual(await counts(), before);
    });

    await t.test("cross-tenant requests cannot select or mutate a foreign gym", async () => {
      const response = await gymSettings(request(`/api/gym/settings?gymId=${legacyIds[0]}`, ownerToken));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.name, valid.gymName);
      const forged = request("/api/gym/settings", ownerToken, { name: "Changed", timezone: "UTC", gymId: String(legacyIds[0]) });
      assert.equal((await updateGymSettings(forged)).status, 400);
      const membership = await GymMembership.findOne({ userId: owner._id }).lean();
      assert.equal(authorizeGymMembership({ user: owner, membership, gym, requestedGymId: legacyIds[0] }).ok, false);
      assert.equal((await gymDetails(request(`/api/admin/gyms/${legacyIds[0]}`, ownerToken), { params: Promise.resolve({ id: String(legacyIds[0]) }) })).status, 403);
    });

    await t.test("precise expiry denies APIs before cron, while billing and recovery remain accessible", async (boundaryTest) => {
      const expiry = gym.saasSubscription.trialEndsAt.getTime();
      // Keep the synthetic auth sessions alive beyond the trial to isolate the subscription guard.
      await AuthSession.updateMany({}, { $set: { expiresAt: new Date(expiry + 90 * 86400000) } });
      boundaryTest.mock.timers.enable({ apis: ["Date"], now: expiry - 1 });
      try {
        assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 200);
        boundaryTest.mock.timers.setTime(expiry);
        assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 403);
        assert.equal((await gymSettings(request("/api/gym/settings", ownerToken))).status, 403);
        assert.equal((await updateGymSettings(request("/api/gym/settings", ownerToken, { name: "Changed", timezone: "UTC" }))).status, 403);
        assert.equal((await billing(request("/api/gym/billing", ownerToken))).status, 200);
        assert.equal((await profile(request("/api/account/profile", ownerToken))).status, 200);
        const beforeCron = await Gym.findById(gym._id).lean();
        assert.equal(beforeCron.saasSubscription.status, "trialing");
        assert.equal(beforeCron.status, "active");
        assert.equal(publicGymOperationalRedirect(beforeCron, "gym_owner"), "/billing");
        const analytics = await (await overview(request("/api/admin/overview", adminToken))).json();
        assert.ok(analytics.data.analytics.saasStatus.expired >= 1);
        const details = await (await gymDetails(request(`/api/admin/gyms/${gym._id}`, adminToken), { params: Promise.resolve({ id: String(gym._id) }) })).json();
        assert.equal(details.data.trial.status, "expired");
        assert.equal(details.data.trial.remainingDays, 0);
        assert.equal((await expiryCron(request("/api/cron/saas-expiry"))).status, 401);
        const cronRequest = () => new Request("http://localhost/api/cron/saas-expiry", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });
        assert.equal((await expiryCron(cronRequest())).status, 200);
        assert.equal((await (await expiryCron(cronRequest())).json()).data.processed, 0);
        const expired = await Gym.findById(gym._id).lean();
        assert.equal(expired.saasSubscription.status, "expired");
        assert.equal(expired.status, "active");
        assert.deepEqual(await readLegacy(), originalLegacy);
      } finally { boundaryTest.mock.timers.reset(); }
    });

    await t.test("only verified Superadmin reconciliation restores access and preserves gym data", async () => {
      const storedPlan = await Plan.create({ gymId: gym._id, name: "Existing member plan", price: 500, durationDays: 30 });
      const action = (body, token = adminToken) => adminBilling(request("/api/admin/billing", token, body));
      const freePlan = await SaaSPlan.create({ name: "Admin free plan", price: 0, interval: "monthly" });
      assert.equal((await action({ action: "assign_plan", gymId: String(gym._id), planId: String(freePlan._id), mode: "invoice" })).status, 400);
      const assigned = await action({ action: "assign_plan", gymId: String(gym._id), planId: String(plan._id), mode: "invoice" });
      assert.equal(assigned.status, 201, JSON.stringify(await assigned.clone().json()));
      const invoice = (await assigned.json()).data.invoice;
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 403);
      const reconciliation = { action: "reconcile_invoice", invoiceId: invoice.id, paymentReference: "BANK-VERIFIED-123" };
      assert.equal((await action(reconciliation, ownerToken)).status, 403);
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 403);
      // Exercise a delayed verification: even an old invoice restores a usable paid term.
      await PlatformInvoice.updateOne({ _id: invoice.id }, { $set: { periodStart: new Date(Date.now() - 60 * 86400000), periodEnd: new Date(Date.now() - 30 * 86400000) } });
      assert.equal((await action(reconciliation)).status, 200);
      assert.equal((await action(reconciliation)).status, 409);
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 200);
      assert.ok(await Plan.exists({ _id: storedPlan._id, gymId: gym._id }));
      const restored = await Gym.findById(gym._id).lean();
      assert.equal(restored.saasSubscription.status, "active");
      assert.ok(restored.saasSubscription.periodEnd > new Date());
      assert.deepEqual(restored.publicTrial, gym.publicTrial);
      assert.equal(publicGymOperationalRedirect(restored, "gym_owner"), null);
      assert.equal((await PlatformInvoice.findById(invoice.id)).reconciledBy.toString(), admin._id.toString());
      const ownerBilling = await (await billing(request("/api/gym/billing", ownerToken))).json();
      assert.equal(ownerBilling.data.plans[0].id, String(plan._id));
      assert.match(ownerBilling.data.manualBillingInstructions, /transfer/);
    });

    await t.test("suspension remains independent of payment and billing stays readable", async () => {
      await Gym.updateOne({ _id: gym._id }, { $set: { status: "suspended" } });
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 403);
      assert.equal((await billing(request("/api/gym/billing", ownerToken))).status, 200);
      // Issuing a renewal while active, then suspending before verification must
      // never let reconciliation clear the platform's suspension.
      await Gym.updateOne({ _id: gym._id }, { $set: { status: "active" } });
      const issued = await adminBilling(request("/api/admin/billing", adminToken, { action: "renew_invoice", gymId: String(gym._id) }));
      assert.equal(issued.status, 201);
      const invoiceId = (await issued.json()).data.invoice.id;
      await Gym.updateOne({ _id: gym._id }, { $set: { status: "suspended" } });
      assert.equal((await adminBilling(request("/api/admin/billing", adminToken, { action: "reconcile_invoice", invoiceId, paymentReference: "SUSPENDED-VERIFIED" }))).status, 200);
      assert.equal((await Gym.findById(gym._id)).status, "suspended");
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 403);
      await Gym.updateOne({ _id: gym._id }, { $set: { status: "active" } });
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 200, "early paid renewal preserves the currently active term");
      await Gym.updateOne({ _id: gym._id }, { $set: { status: "suspended" } });
      assert.equal((await logout(request("/api/auth/logout", ownerToken, {}))).status, 200);
      assert.equal((await dashboard(request("/api/dashboard/owner", ownerToken))).status, 401);
    });

    await t.test("all existing subscription documents and admin trial defaults are byte-for-byte unchanged", async () => {
      assert.deepEqual(await readLegacy(), originalLegacy);
      assert.equal((await PlatformSetting.findById("fitivo")).defaultTrialDays, 30);
      assert.equal(await PublicTrialClaim.countDocuments({ gymId: { $in: legacyIds } }), 0);
      assert.equal(await PlatformInvoice.countDocuments({ gymId: { $in: legacyIds } }), 0);
      for (const legacy of await readLegacy()) assert.equal(Object.hasOwn(legacy, "publicTrial"), false);
    });

    await t.test("existing authorized admin trial management still works without a new automatic claim", async () => {
      const claimedGym = await Gym.findOne({ slug: "concurrent-gym" }).lean();
      const claimsBefore = await PublicTrialClaim.countDocuments({});
      const response = await adminBilling(request("/api/admin/billing", adminToken, { action: "assign_plan", gymId: String(claimedGym._id), planId: String(plan._id), mode: "trial", trialDays: 2 }));
      assert.equal(response.status, 200);
      const managed = await Gym.findById(claimedGym._id).lean();
      assert.equal(managed.saasSubscription.trialEndsAt - managed.saasSubscription.trialStartedAt, 2 * 86400000);
      assert.deepEqual(managed.publicTrial, claimedGym.publicTrial);
      assert.equal(await PublicTrialClaim.countDocuments({}), claimsBefore);
      assert.deepEqual(await readLegacy(), originalLegacy);
    });

    await t.test("legacy reconciliation retains original invoice dates and admin free-plan behavior", async () => {
      const periodStart = new Date(Date.now() - 3 * 86400000);
      const periodEnd = new Date(Date.now() + 27 * 86400000);
      const invoiceId = new mongoose.Types.ObjectId();
      const legacy = await Gym.create({ name: "Legacy billing", slug: "legacy-billing", saasAccessRequired: true,
        saasSubscription: { ...oldTrial, status: "past_due", periodStart, periodEnd, pendingInvoiceId: invoiceId } });
      await PlatformInvoice.create({ _id: invoiceId, invoiceNumber: "LEGACY-BILLING-TEST", gymId: legacy._id,
        planId: plan._id, planSnapshot: oldTrial.planSnapshot, amountDue: plan.price, currency: "PKR",
        periodStart, periodEnd, status: "open", issuedAt: periodStart, createdBy: admin._id });
      const response = await adminBilling(request("/api/admin/billing", adminToken, { action: "reconcile_invoice", invoiceId: String(invoiceId), paymentReference: "LEGACY-REFERENCE" }));
      assert.equal(response.status, 200);
      const reconciled = await Gym.findById(legacy._id).lean();
      assert.equal(reconciled.saasSubscription.periodStart.getTime(), periodStart.getTime());
      assert.equal(reconciled.saasSubscription.periodEnd.getTime(), periodEnd.getTime());
      assert.equal(Object.hasOwn(reconciled, "publicTrial"), false);
      const free = await SaaSPlan.findOne({ price: 0 });
      assert.equal((await adminBilling(request("/api/admin/billing", adminToken, { action: "assign_plan", gymId: String(legacy._id), planId: String(free._id), mode: "invoice" }))).status, 200);
      assert.equal(await PublicTrialClaim.countDocuments({ gymId: legacy._id }), 0);
      assert.deepEqual(await readLegacy(), originalLegacy);
    });
  } finally {
    // Only the random per-run DB from isolatedTestUri can reach this cleanup.
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === new URL(testUri).pathname.slice(1)) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
    globalThis.mongooseCache = { connection: null, promise: null };
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
