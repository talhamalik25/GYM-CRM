import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { GET as listStaff, POST as inviteStaff } from "../app/api/staff/invitations/route.js";
import { POST as acceptInvitation } from "../app/api/staff/invitations/accept/route.js";
import connectToDatabase from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import AuthSession from "../models/AuthSession.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import StaffInvitation from "../models/StaffInvitation.js";
import User from "../models/User.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "staff_invitations");
const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";

function request(url, body, token) {
  const result = new Request(`http://localhost${url}`, { method: body === undefined ? "GET" : "POST", headers: { origin: "http://localhost", ...(body === undefined ? {} : { "content-type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (token) Object.defineProperty(result, "cookies", { value: { get: name => name === cookieName ? { value: token } : undefined } });
  return result;
}

test("owner invitations are gym scoped, role limited, single use, and preserve existing passwords", { skip: !testUri }, async () => {
  const previousUri = process.env.MONGODB_URI; const previousSecret = process.env.AUTH_SESSION_SECRET;
  process.env.MONGODB_URI = testUri; process.env.AUTH_SESSION_SECRET = randomBytes(32).toString("hex");
  const suffix = randomUUID(); const ids = { users: [], gyms: [], sessions: [], invitations: [] };
  try {
    await connectToDatabase();
    await Promise.all([User.init(), Gym.init(), GymMembership.init(), AuthSession.init(), StaffInvitation.init()]);
    const owner = await User.create({ fullName: "Invitation Owner", email: `owner-${suffix}@example.test`, passwordHash: await hashPassword("owner-password-long"), role: "staff", isActive: true }); ids.users.push(owner._id);
    const otherUser = await User.create({ fullName: "Other Gym Owner", email: `other-${suffix}@example.test`, passwordHash: await hashPassword("other-password-long"), role: "staff", isActive: true }); ids.users.push(otherUser._id);
    const existing = await User.create({ fullName: "Existing Invitee", email: `existing-${suffix}@example.test`, passwordHash: await hashPassword("existing-password-long"), role: "staff", isActive: true }); ids.users.push(existing._id);
    const gym = await Gym.create({ name: "Invite Gym", slug: `invite-${suffix}` }); const otherGym = await Gym.create({ name: "Other Invite Gym", slug: `other-invite-${suffix}` }); ids.gyms.push(gym._id, otherGym._id);
    await GymMembership.create([{ userId: owner._id, gymId: gym._id, role: "gym_owner", status: "active" }, { userId: otherUser._id, gymId: otherGym._id, role: "gym_owner", status: "active" }]);
    const ownerToken = randomBytes(32).toString("base64url"); const adminToken = randomBytes(32).toString("base64url");
    const ownerSession = await AuthSession.create({ userId: owner._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(ownerToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(ownerSession._id);
    const admin = await User.create({ fullName: "Gym Admin", email: `admin-${suffix}@example.test`, passwordHash: await hashPassword("admin-password-long"), role: "staff", isActive: true }); ids.users.push(admin._id);
    await GymMembership.create({ userId: admin._id, gymId: gym._id, role: "gym_admin", status: "active" });
    const adminSession = await AuthSession.create({ userId: admin._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(adminToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(adminSession._id);

    const unauth = await inviteStaff(request("/api/staff/invitations", { email: `new-${suffix}@example.test`, role: "trainer" })); assert.equal(unauth.status, 401);
    const forbidden = await inviteStaff(request("/api/staff/invitations", { email: `new-${suffix}@example.test`, role: "trainer" }, adminToken)); assert.equal(forbidden.status, 403);
    const forged = await inviteStaff(request("/api/staff/invitations", { email: `new-${suffix}@example.test`, role: "gym_owner", gymId: String(otherGym._id) }, ownerToken)); assert.equal(forged.status, 400);

    const newEmail = `new-${suffix}@example.test`;
    const created = await inviteStaff(request("/api/staff/invitations", { email: newEmail, role: "gym_admin" }, ownerToken)); assert.equal(created.status, 201);
    const createdData = (await created.json()).data; assert.ok(createdData.invitationUrl);
    const newToken = new URL(createdData.invitationUrl, "http://localhost").searchParams.get("token");
    const concurrent = await Promise.all([acceptInvitation(request("/api/staff/invitations/accept", { token: newToken, fullName: "New Invitee", password: "new-invitee-password-long" })), acceptInvitation(request("/api/staff/invitations/accept", { token: newToken, fullName: "New Invitee", password: "new-invitee-password-long" }))]);
    assert.equal(concurrent.filter(response => response.status === 200).length, 1);
    assert.equal(await GymMembership.countDocuments({ gymId: gym._id, role: "gym_admin", status: "active", userId: { $in: await User.find({ email: newEmail }).distinct("_id") } }), 1);
    assert.equal((await inviteStaff(request("/api/staff/invitations", { email: newEmail, role: "trainer" }, ownerToken))).status, 409);

    const existingInvite = await inviteStaff(request("/api/staff/invitations", { email: existing.email, role: "trainer" }, ownerToken)); assert.equal(existingInvite.status, 201);
    const existingToken = new URL((await existingInvite.json()).data.invitationUrl, "http://localhost").searchParams.get("token");
    assert.equal((await acceptInvitation(request("/api/staff/invitations/accept", { token: existingToken, fullName: "Attacker", password: "attacker-password-long" }))).status, 401);
    const existingSessionToken = randomBytes(32).toString("base64url");
    const existingSession = await AuthSession.create({ userId: existing._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(existingSessionToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(existingSession._id);
    const existingAccept = await acceptInvitation(request("/api/staff/invitations/accept", { token: existingToken }, existingSessionToken)); assert.equal(existingAccept.status, 200);
    const saved = await User.findById(existing._id).select("+passwordHash").lean(); assert.equal(await verifyPassword("existing-password-long", saved.passwordHash), true);

    const ownerStaff = await listStaff(request("/api/staff/invitations", undefined, ownerToken)); assert.equal(ownerStaff.status, 200);
    const listed = await ownerStaff.json(); assert.ok(listed.data.staff.every(person => person.email !== otherUser.email));
    const oldInvite = await StaffInvitation.findOne({ email: newEmail }); await StaffInvitation.updateOne({ _id: oldInvite._id }, { $set: { expiresAt: new Date(0), status: "pending" } });
    assert.equal((await acceptInvitation(request("/api/staff/invitations/accept", { token: newToken, fullName: "New Invitee", password: "new-invitee-password-long" }))).status, 400);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await StaffInvitation.deleteMany({ email: { $regex: suffix } });
      await AuthSession.deleteMany({ userId: { $in: ids.users } });
      await GymMembership.deleteMany({ userId: { $in: ids.users }, gymId: { $in: ids.gyms } });
      await User.deleteMany({ _id: { $in: ids.users } });
      await Gym.deleteMany({ _id: { $in: ids.gyms } });
    }
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});
