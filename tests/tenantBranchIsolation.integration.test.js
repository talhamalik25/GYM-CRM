import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { randomBytes, createHash } from "node:crypto";
import mongoose from "mongoose";
import { NextRequest } from "next/server.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const projectUrl = new URL("../", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.startsWith(projectUrl) && !context.parentURL.includes("/node_modules/") && specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    const candidate = new URL(`${specifier}.js`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

const testUri = isolatedTestUri(process.env.MONGODB_URI_TEST, "tenant_branch_isolation");
const disposableAuthorized = process.env.MONGODB_TEST_DISPOSABLE === "YES";
// Stable fixture IDs are safe because the existing guard creates a fresh database per run.
const fixtureId = (name) => new mongoose.Types.ObjectId(createHash("sha256").update(name).digest("hex").slice(0, 24));
const seed = (Model, records) => Model.create(records.map((record, index) => ({ _id: fixtureId(`${Model.modelName}:${index}`), ...record })));

test("real handlers isolate gyms, branches, memberships, and branch entitlements", { skip: !testUri || !disposableAuthorized }, async (t) => {
  const beforeEnv = { uri: process.env.MONGODB_URI, secret: process.env.AUTH_SESSION_SECRET };
  process.env.MONGODB_URI = testUri;
  process.env.AUTH_SESSION_SECRET = randomBytes(32).toString("hex");
  const suffix = "isolation-fixture";
  let connected = false;

  try {
    const { default: connect } = await import("../lib/db.js");
    const { createSession } = await import("../lib/auth.js");
    const { createInvitationToken } = await import("../lib/staffInvitations.js");
    const { LAUNCH_PLANS } = await import("../lib/saasPlanRules.js");
    const { planSnapshot } = await import("../lib/platformBillingRules.js");
    const models = {};
    for (const name of ["Gym", "Branch", "User", "GymMembership", "AuthSession", "Member", "Plan", "Payment", "Attendance", "Trainer", "Subscription", "SaaSPlan", "AuthRateLimit", "StaffInvitation"]) models[name] = (await import(`../models/${name}.js`)).default;
    const { GET: listMembers } = await import("../app/api/members/route.js");
    const { GET: getMember, PATCH: updateMember } = await import("../app/api/members/[id]/route.js");
    const { GET: listPayments } = await import("../app/api/payments/route.js");
    const { GET: getPayment } = await import("../app/api/payments/[id]/route.js");
    const { GET: listAttendance } = await import("../app/api/attendance/route.js");
    const { POST: checkOut } = await import("../app/api/attendance/[id]/check-out/route.js");
    const { GET: listTrainers } = await import("../app/api/trainers/route.js");
    const { GET: getTrainer } = await import("../app/api/trainers/[id]/route.js");
    const { GET: trainerWorkspace } = await import("../app/api/trainer/workspace/route.js");
    const { GET: reports } = await import("../app/api/reports/route.js");
    const { GET: getSubscription } = await import("../app/api/subscriptions/[id]/route.js");
    const { POST: acceptInvitation } = await import("../app/api/staff/invitations/accept/route.js");
    const { Gym, Branch, User, GymMembership, Member, Plan, Payment, Attendance, Trainer, Subscription, SaaSPlan, StaffInvitation } = models;
    const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";
    const request = (path, token, { method = "GET", body, branch, branchCookie } = {}) => new NextRequest(`http://localhost${path}`, {
      method,
      headers: { cookie: `${cookieName}=${token}${branchCookie ? `; fitivo_branch=${branchCookie}` : ""}`, origin: "http://localhost", "content-type": "application/json", ...(branch ? { "x-fitivo-branch": String(branch) } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = async (response, expected = 200) => {
      const result = await response.json();
      assert.equal(response.status, expected, JSON.stringify(result));
      return result.data;
    };

    assert.equal(mongoose.connection.readyState, 0, "Integration suite requires a fresh connection");
    await connect();
    assert.equal(mongoose.connection.name, new URL(testUri).pathname.slice(1));
    connected = true;
    for (const Model of Object.values(models)) await Model.init();
    const professional = await SaaSPlan.create({ ...LAUNCH_PLANS.find((plan) => plan.key === "professional") });
    const basic = await SaaSPlan.create({ ...LAUNCH_PLANS.find((plan) => plan.key === "basic") });
    const activeSubscription = (plan) => ({
      planId: plan._id,
      planSnapshot: planSnapshot(plan),
      status: "active",
      periodStart: new Date(Date.now() - 86400000),
      periodEnd: new Date(Date.now() + 7 * 86400000),
    });
    const [gymA, gymB] = await seed(Gym, [
      { name: "Isolation Gym A", slug: `isolation-gym-a-${suffix}`, saasAccessRequired: true, saasSubscription: activeSubscription(professional) },
      { name: "Isolation Gym B", slug: `isolation-gym-b-${suffix}`, saasAccessRequired: true, saasSubscription: activeSubscription(basic) },
    ]);
    const [east, west, branchB] = await seed(Branch, [
      { gymId: gymA._id, name: "East", isDefault: false },
      { gymId: gymA._id, name: "West", isDefault: false },
      { gymId: gymB._id, name: "Branch B", isDefault: false },
    ]);
    await Branch.create([{ _id: gymA._id, gymId: gymA._id, name: "Main branch", isDefault: true }, { _id: gymB._id, gymId: gymB._id, name: "Main branch", isDefault: true }]);
    const users = await seed(User, [
      { fullName: "Owner A", email: `owner-a-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Admin A", email: `admin-a-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Trainer A", email: `trainer-a-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Owner B", email: `owner-b-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Admin B", email: `admin-b-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Trainer B", email: `trainer-b-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "No Membership", email: `missing-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Revoked", email: `revoked-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
      { fullName: "Multi Gym", email: `multi-${suffix}@example.test`, passwordHash: "synthetic", role: "staff" },
    ]);
    const ownerA = users[0], adminA = users[1], trainerA = users[2], ownerB = users[3], adminB = users[4], trainerB = users[5], missing = users[6], revoked = users[7], multi = users[8];
    await seed(GymMembership, [
      { userId: ownerA._id, gymId: gymA._id, role: "gym_owner" },
      { userId: adminA._id, gymId: gymA._id, branchId: east._id, role: "gym_admin" },
      { userId: trainerA._id, gymId: gymA._id, branchId: east._id, role: "trainer" },
      { userId: ownerB._id, gymId: gymB._id, role: "gym_owner" },
      { userId: adminB._id, gymId: gymB._id, branchId: branchB._id, role: "gym_admin" },
      { userId: trainerB._id, gymId: gymB._id, branchId: branchB._id, role: "trainer" },
      { userId: revoked._id, gymId: gymA._id, role: "gym_admin", status: "revoked" },
      { userId: multi._id, gymId: gymA._id, role: "gym_admin", branchId: east._id },
      { userId: multi._id, gymId: gymB._id, role: "gym_admin", branchId: branchB._id },
    ]);
    const [eastTrainer, westTrainer, trainerProfileB] = await seed(Trainer, [
      { gymId: gymA._id, branchId: east._id, fullName: "Trainer A", email: trainerA.email, phone: "+15550000101", specialization: "Strength", joiningDate: new Date() },
      { gymId: gymA._id, branchId: west._id, fullName: "West Coach", email: `west-coach-${suffix}@example.test`, phone: "+15550000102", specialization: "Yoga", joiningDate: new Date() },
      { gymId: gymB._id, branchId: branchB._id, fullName: "Trainer B", email: trainerB.email, phone: "+15550000201", specialization: "Strength", joiningDate: new Date() },
    ]);
    const [mainPlan, legacyPlan, eastPlan, westPlan, planB] = await seed(Plan, [
      { gymId: gymA._id, branchId: gymA._id, name: "Main plan", price: 1000, durationDays: 30 },
      { gymId: gymA._id, name: "Legacy plan", price: 1000, durationDays: 30 },
      { gymId: gymA._id, branchId: east._id, name: "East plan", price: 1000, durationDays: 30 },
      { gymId: gymA._id, branchId: west._id, name: "West plan", price: 1000, durationDays: 30 },
      { gymId: gymB._id, branchId: branchB._id, name: "Branch B plan", price: 1000, durationDays: 30 },
    ]);
    const memberFields = (gymId, branchId, planId, fullName, phone, trainerId = null) => ({ gymId, ...(branchId === null ? {} : { branchId }), planId, trainerId, fullName, phone, gender: "Other", startDate: new Date("2026-01-01"), expiryDate: new Date("2027-01-01") });
    const [mainMember, legacyMember, eastMember, westMember, memberB] = await seed(Member, [
      memberFields(gymA._id, gymA._id, mainPlan._id, "Main Member A", "03000000001"),
      memberFields(gymA._id, null, legacyPlan._id, "Legacy Member A", "03000000002"),
      memberFields(gymA._id, east._id, eastPlan._id, "East Member A", "03000000003", eastTrainer._id),
      memberFields(gymA._id, west._id, westPlan._id, "West Member A", "03000000004", westTrainer._id),
      memberFields(gymB._id, branchB._id, planB._id, "Member B", "03000000005", trainerProfileB._id),
    ]);
    const [paymentA, paymentB, paymentWest] = await seed(Payment, [
      { gymId: gymA._id, branchId: east._id, memberId: eastMember._id, planId: eastPlan._id, amountDue: 1000, amountPaid: 1000, method: "cash", paymentDate: new Date(), receiptNumber: `ISO-A-${suffix}`, idempotencyKey: `iso-a-${suffix}` },
      { gymId: gymB._id, branchId: branchB._id, memberId: memberB._id, planId: planB._id, amountDue: 1000, amountPaid: 1000, method: "cash", paymentDate: new Date(), receiptNumber: `ISO-B-${suffix}`, idempotencyKey: `iso-b-${suffix}` },
      { gymId: gymA._id, branchId: west._id, memberId: westMember._id, planId: westPlan._id, amountDue: 1000, amountPaid: 1000, method: "cash", paymentDate: new Date(), receiptNumber: `ISO-W-${suffix}`, idempotencyKey: `iso-w-${suffix}` },
    ]);
    const [attendanceA, attendanceB, attendanceWest] = await seed(Attendance, [
      { gymId: gymA._id, branchId: east._id, memberId: eastMember._id, date: "2026-11-07", checkInAt: new Date("2026-11-07T08:00:00Z") },
      { gymId: gymB._id, branchId: branchB._id, memberId: memberB._id, date: "2026-11-07", checkInAt: new Date("2026-11-07T08:00:00Z") },
      { gymId: gymA._id, branchId: west._id, memberId: westMember._id, date: "2026-11-07", checkInAt: new Date("2026-11-07T08:00:00Z") },
    ]);
    const subscriptions = await seed(Subscription, [eastMember, westMember, memberB].map((member, index) => ({
      gymId: member.gymId, branchId: member.branchId, memberId: member._id, planId: member.planId,
      startDate: member.startDate, expiryDate: member.expiryDate, status: "active",
      originalPrice: 1000, agreedPrice: 1000,
      planSnapshot: { name: "Disposable membership", durationDays: 30, originalPrice: 1000, agreedPrice: 1000 },
      createKey: `isolation-subscription-${index}`, createFingerprint: `isolation-fingerprint-${index}`,
    })));
    const contextFor = (record) => ({ params: Promise.resolve({ id: String(record._id) }) });
    const itemIds = (result) => result.items.map((item) => String(item.id || item._id)).sort();
    const tokenFor = async (user) => (await createSession(user._id)).cookies.get(cookieName).value;
    const tokens = Object.fromEntries(await Promise.all([["ownerA", ownerA], ["adminA", adminA], ["trainerA", trainerA], ["ownerB", ownerB], ["adminB", adminB], ["trainerB", trainerB], ["missing", missing], ["revoked", revoked], ["multi", multi]].map(async ([key, user]) => [key, await tokenFor(user)])));

    await t.test("owner and admin lists contain only East records, including populated resources", async () => {
      for (const actor of ["ownerA", "adminA"]) {
        for (const [handler, path, record] of [
          [listMembers, "/api/members", eastMember],
          [listPayments, "/api/payments", paymentA],
          [listAttendance, "/api/attendance?date=2026-11-07", attendanceA],
          [listTrainers, "/api/trainers", eastTrainer],
        ]) {
          const result = await data(await handler(request(path, tokens[actor], { branch: east._id })));
          assert.deepEqual(itemIds(result), [String(record._id)], `${actor}: ${path}`);
          assert.equal(result.total, 1);
          assert.ok(!JSON.stringify(result).includes(String(memberB._id)));
        }
        assert.equal((await getSubscription(request("/api/subscriptions/foreign", tokens[actor], { branch: east._id }), contextFor(subscriptions[2]))).status, 404);
        assert.equal((await getMember(request("/api/members/foreign", tokens[actor], { branch: east._id }), contextFor(memberB))).status, 404);
        assert.equal((await updateMember(request("/api/members/foreign", tokens[actor], { method: "PATCH", branch: east._id, body: { isActive: false } }), contextFor(memberB))).status, 404);
        assert.equal((await getPayment(request("/api/payments/foreign", tokens[actor], { branch: east._id }), contextFor(paymentB))).status, 404);
        assert.equal((await getTrainer(request("/api/trainers/foreign", tokens[actor], { branch: east._id }), contextFor(trainerProfileB))).status, 404);
        const foreignAttendance = await data(await listAttendance(request(`/api/attendance?memberId=${memberB._id}`, tokens[actor], { branch: east._id })));
        assert.deepEqual(foreignAttendance.items, []);
      }
      const workspace = await data(await trainerWorkspace(request(`/api/trainer/workspace?gymId=${gymB._id}`, tokens.trainerA)));
      assert.deepEqual(workspace.members.map((member) => member.id), [String(eastMember._id)]);
      assert.deepEqual(workspace.attendance.map((record) => record.id), [String(attendanceA._id)]);
      assert.equal((await checkOut(request("/api/attendance/foreign/check-out", tokens.trainerA, { method: "POST" }), contextFor(attendanceB))).status, 404);
    });

    await t.test("forged body identity and branch cookies cannot move records or grant access", async () => {
      for (const body of [{ gymId: String(gymB._id) }, { branchId: String(west._id) }]) {
        assert.equal((await updateMember(request("/api/members/east", tokens.adminA, { method: "PATCH", body: { ...body, isActive: false } }), contextFor(eastMember))).status, 400);
      }
      for (const actor of ["adminA", "trainerA"]) {
        const handler = actor === "trainerA" ? trainerWorkspace : listMembers;
        const path = actor === "trainerA" ? "/api/trainer/workspace" : "/api/members";
        for (const selection of [west._id, branchB._id, "all", "invalid"]) {
          assert.equal((await handler(request(path, tokens[actor], { branchCookie: selection }))).status, 403);
        }
      }
      assert.equal((await listMembers(request("/api/members", tokens.ownerA, { branch: branchB._id }))).status, 403);
      assert.equal((await updateMember(request("/api/members/east", tokens.ownerA, { method: "PATCH", branch: "all", body: { isActive: false } }), contextFor(eastMember))).status, 403);
      assert.equal((await Member.findById(eastMember._id).lean()).isActive, true);
      assert.equal(String((await Member.findById(eastMember._id).lean()).gymId), String(gymA._id));
    });

    await t.test("Gym A handlers cannot read or modify Gym B records despite forged tenant input", async () => {
      const list = await data(await listMembers(request(`/api/members?gymId=${gymB._id}`, tokens.ownerA, { branch: east._id })));
      assert.deepEqual(list.items.map((member) => member.fullName), ["East Member A"]);
      assert.equal((await getMember(request(`/api/members/${memberB._id}?gymId=${gymB._id}`, tokens.ownerA, { branch: east._id }), { params: Promise.resolve({ id: String(memberB._id) }) })).status, 404);
      assert.equal((await updateMember(request(`/api/members/${memberB._id}`, tokens.ownerA, { method: "PATCH", branch: east._id, body: { isActive: false } }), { params: Promise.resolve({ id: String(memberB._id) }) })).status, 404);
      assert.equal((await Member.findById(memberB._id).lean()).isActive, true);
      assert.equal((await Payment.findById(paymentB._id).lean()).voided, false);
      assert.equal((await getPayment(request(`/api/payments/${paymentB._id}`, tokens.ownerA, { branch: east._id }), { params: Promise.resolve({ id: String(paymentB._id) }) })).status, 404);
      assert.equal((await listPayments(request("/api/payments", tokens.ownerA, { branch: east._id }))).status, 200);
      assert.equal((await listAttendance(request("/api/attendance", tokens.ownerA, { branch: east._id }))).status, 200);
      assert.equal((await checkOut(request(`/api/attendance/${attendanceB._id}/check-out`, tokens.ownerA, { method: "POST", branch: east._id }), { params: Promise.resolve({ id: String(attendanceB._id) }) })).status, 404);
      assert.equal((await getTrainer(request(`/api/trainers/${trainerProfileB._id}`, tokens.ownerA, { branch: east._id }), { params: Promise.resolve({ id: String(trainerProfileB._id) }) })).status, 404);
    });

    await t.test("branch scope protects East, West, legacy default records, and consolidated reads", async () => {
      assert.equal((await listMembers(request("/api/members", tokens.ownerA))).status, 200);
      const defaultMembers = await data(await listMembers(request("/api/members", tokens.ownerA)));
      assert.deepEqual(defaultMembers.items.map((member) => member.fullName).sort(), ["Legacy Member A", "Main Member A"]);
      assert.equal((await listMembers(request("/api/members", tokens.adminA, { branch: west._id }))).status, 403);
      assert.equal((await updateMember(request(`/api/members/${westMember._id}`, tokens.adminA, { method: "PATCH", body: { isActive: false } }), { params: Promise.resolve({ id: String(westMember._id) }) })).status, 404);
      assert.equal((await Member.findById(westMember._id).lean()).isActive, true);
      assert.equal((await getTrainer(request("/api/trainers/west", tokens.adminA), contextFor(westTrainer))).status, 404);
      assert.equal((await getPayment(request("/api/payments/west", tokens.adminA), contextFor(paymentWest))).status, 404);
      for (const actor of ["adminA", "trainerA"]) {
        assert.equal((await checkOut(request("/api/attendance/west/check-out", tokens[actor], { method: "POST" }), contextFor(attendanceWest))).status, 404);
      }
      assert.equal((await Attendance.findById(attendanceWest._id).lean()).checkOutAt, null);
      assert.equal((await getSubscription(request("/api/subscriptions/west", tokens.adminA), contextFor(subscriptions[1]))).status, 404);
      const selectedWest = await data(await listMembers(request("/api/members", tokens.ownerA, { branch: west._id })));
      assert.deepEqual(itemIds(selectedWest), [String(westMember._id)]);
      assert.equal((await Member.findById(legacyMember._id).lean()).branchId, null);
      assert.equal(String((await Member.findById(mainMember._id).lean()).branchId), String(gymA._id));
      assert.equal((await trainerWorkspace(request("/api/trainer/workspace", tokens.trainerA, { branch: west._id }))).status, 403);
      const workspace = await data(await trainerWorkspace(request("/api/trainer/workspace", tokens.trainerA)));
      assert.deepEqual(workspace.members.map((member) => member.name), ["East Member A"]);
      assert.equal((await listMembers(request("/api/members", tokens.ownerA, { branch: "all" }))).status, 403);
      assert.equal((await reports(request("/api/reports", tokens.ownerA, { branch: "all" }))).status, 200);
      assert.equal((await reports(request("/api/reports", tokens.adminA, { branch: "all" }))).status, 403);
    });

    await t.test("membership, gym, subscription, and invitation boundaries reject invalid access", async () => {
      assert.equal((await listMembers(request("/api/members", tokens.missing))).status, 403);
      assert.equal((await listMembers(request("/api/members", tokens.revoked))).status, 403);
      assert.equal((await listMembers(request("/api/members", tokens.multi))).status, 403);
      try {
        await Gym.updateOne({ _id: gymA._id }, { $set: { status: "suspended" } });
        assert.equal((await listMembers(request("/api/members", tokens.ownerA))).status, 403);
        await Gym.updateOne({ _id: gymA._id }, { $set: { status: "active" } });
        await Gym.updateOne({ _id: gymB._id }, { $set: { "saasSubscription.periodEnd": new Date(0) } });
        assert.equal((await listMembers(request("/api/members", tokens.ownerB))).status, 403);
        assert.equal((await listMembers(request("/api/members", tokens.ownerB, { branch: branchB._id }))).status, 403);
        assert.equal((await listMembers(request("/api/members", tokens.ownerA, { branch: west._id }))).status, 200);
      } finally {
        await Gym.updateOne({ _id: gymA._id }, { $set: { status: "active" } });
        await Gym.updateOne({ _id: gymB._id }, { $set: { "saasSubscription.periodEnd": gymB.saasSubscription.periodEnd } });
      }

      const invitation = createInvitationToken();
      await StaffInvitation.create({ gymId: gymA._id, branchId: east._id, email: ownerB.email, role: "gym_admin", tokenHash: invitation.tokenHash, expiresAt: new Date(Date.now() + 3600000) });
      const response = await acceptInvitation(request("/api/staff/invitations/accept", tokens.ownerB, { method: "POST", body: { token: invitation.token } }));
      assert.equal(response.status, 409);
      assert.equal(await GymMembership.exists({ userId: ownerB._id, gymId: gymA._id, status: "active" }), null);
      assert.equal(await GymMembership.countDocuments({ userId: ownerB._id, status: "active" }), 1);
      assert.equal((await StaffInvitation.findOne({ tokenHash: invitation.tokenHash }).lean()).status, "pending");
    });

    await t.test("Gym B cannot select its extra branch without the multi-branch entitlement", async () => {
      const response = await listMembers(request("/api/members", tokens.ownerB, { branch: branchB._id }));
      assert.equal(response.status, 403);
      assert.equal((await reports(request("/api/reports", tokens.ownerB, { branch: "all" }))).status, 403);
    });

    await t.test("valid roles work and Gym B remains isolated after temporary entitlement enablement", async () => {
      const original = gymB.saasSubscription.toObject();
      try {
        await Gym.updateOne({ _id: gymB._id }, { $set: { saasSubscription: activeSubscription(professional) } });
        for (const actor of ["ownerB", "adminB"]) {
          const own = await data(await listMembers(request("/api/members", tokens[actor], { branch: branchB._id })));
          assert.deepEqual(itemIds(own), [String(memberB._id)]);
          assert.equal((await getMember(request("/api/members/east", tokens[actor], { branch: branchB._id }), contextFor(eastMember))).status, 404);
        }
        const workspace = await data(await trainerWorkspace(request("/api/trainer/workspace", tokens.trainerB)));
        assert.deepEqual(workspace.members.map((member) => member.id), [String(memberB._id)]);
        assert.equal((await listMembers(request("/api/members", tokens.trainerA))).status, 403);
        const changed = await data(await updateMember(request("/api/members/east", tokens.adminA, { method: "PATCH", body: { notes: "Disposable authorized edit" } }), contextFor(eastMember)));
        assert.equal(changed.notes, "Disposable authorized edit");
        assert.equal((await Member.findById(eastMember._id).lean()).notes, "Disposable authorized edit");
      } finally {
        await Gym.updateOne({ _id: gymB._id }, { $set: { saasSubscription: original } });
      }
    });
  } finally {
    try {
      if (connected) {
        assert.equal(mongoose.connection.name, new URL(testUri).pathname.slice(1), "Refuse cleanup of an unexpected database");
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
      globalThis.mongooseCache = { connection: null, promise: null };
      for (const [key, value] of [["MONGODB_URI", beforeEnv.uri], ["AUTH_SESSION_SECRET", beforeEnv.secret]]) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  }
});
