import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { GET as listStaff, POST as inviteStaff } from "../app/api/staff/invitations/route.js";
import { POST as acceptInvitation } from "../app/api/staff/invitations/accept/route.js";
import { GET as getTrainerWorkspace } from "../app/api/trainer/workspace/route.js";
import connectToDatabase from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import AuthSession from "../models/AuthSession.js";
import Attendance from "../models/Attendance.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import Member from "../models/Member.js";
import StaffInvitation from "../models/StaffInvitation.js";
import Trainer from "../models/Trainer.js";
import User from "../models/User.js";
import { createInvitationToken } from "../lib/staffInvitations.js";
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
    const crossGym = await User.create({ fullName: "Cross Gym Invitee", email: `cross-gym-${suffix}@example.test`, passwordHash: await hashPassword("cross-gym-password-long"), role: "staff", isActive: true }); ids.users.push(crossGym._id);
    const racing = await User.create({ fullName: "Racing Invitee", email: `racing-${suffix}@example.test`, passwordHash: await hashPassword("racing-password-long"), role: "staff", isActive: true }); ids.users.push(racing._id);
    const trainerUser = await User.create({ fullName: "Trainer User", email: `trainer-${suffix}@example.test`, passwordHash: await hashPassword("trainer-password-long"), role: "staff", isActive: true }); ids.users.push(trainerUser._id);
    const gym = await Gym.create({ name: "Invite Gym", slug: `invite-${suffix}` }); const otherGym = await Gym.create({ name: "Other Invite Gym", slug: `other-invite-${suffix}` }); ids.gyms.push(gym._id, otherGym._id);
    await GymMembership.create([{ userId: owner._id, gymId: gym._id, role: "gym_owner", status: "active" }, { userId: otherUser._id, gymId: otherGym._id, role: "gym_owner", status: "active" }]);
    const ownerToken = randomBytes(32).toString("base64url"); const adminToken = randomBytes(32).toString("base64url"); const otherOwnerToken = randomBytes(32).toString("base64url");
    const ownerSession = await AuthSession.create({ userId: owner._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(ownerToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(ownerSession._id);
    const otherOwnerSession = await AuthSession.create({ userId: otherUser._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(otherOwnerToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(otherOwnerSession._id);
    const admin = await User.create({ fullName: "Gym Admin", email: `admin-${suffix}@example.test`, passwordHash: await hashPassword("admin-password-long"), role: "staff", isActive: true }); ids.users.push(admin._id);
    await GymMembership.create({ userId: admin._id, gymId: gym._id, role: "gym_admin", status: "active" });
    const adminSession = await AuthSession.create({ userId: admin._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(adminToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(adminSession._id);

    const unauth = await inviteStaff(request("/api/staff/invitations", { email: `new-${suffix}@example.test`, role: "gym_admin" })); assert.equal(unauth.status, 401);
    const forbidden = await inviteStaff(request("/api/staff/invitations", { email: `new-${suffix}@example.test`, role: "trainer" }, adminToken)); assert.equal(forbidden.status, 403);
    const forged = await inviteStaff(request("/api/staff/invitations", { email: `new-${suffix}@example.test`, role: "gym_owner", gymId: String(otherGym._id) }, ownerToken)); assert.equal(forged.status, 400);
    const missingTrainerProfile = await inviteStaff(request("/api/staff/invitations", { email: `missing-trainer-${suffix}@example.test`, role: "trainer" }, ownerToken));
    assert.equal(missingTrainerProfile.status, 400);
    const legacyTrainerToken = createInvitationToken();
    const legacyTrainerInvite = await StaffInvitation.create({ gymId: gym._id, email: `missing-trainer-${suffix}@example.test`, role: "trainer", tokenHash: legacyTrainerToken.tokenHash, expiresAt: new Date(Date.now() + 60000), status: "pending" });
    ids.invitations.push(legacyTrainerInvite._id);
    const legacyTrainerAccept = await acceptInvitation(request("/api/staff/invitations/accept", { token: legacyTrainerToken.token, fullName: "Missing Trainer", password: "missing-trainer-password-long" }));
    assert.equal(legacyTrainerAccept.status, 409);
    assert.equal((await StaffInvitation.findById(legacyTrainerInvite._id)).status, "pending");
    assert.equal(await User.exists({ email: `missing-trainer-${suffix}@example.test` }), null);

    const newEmail = `new-${suffix}@example.test`;
    const created = await inviteStaff(request("/api/staff/invitations", { email: newEmail, role: "gym_admin" }, ownerToken)); assert.equal(created.status, 201);
    const createdData = (await created.json()).data; assert.ok(createdData.invitationUrl);
    const newToken = new URL(createdData.invitationUrl, "http://localhost").searchParams.get("token");
    const concurrent = await Promise.all([acceptInvitation(request("/api/staff/invitations/accept", { token: newToken, fullName: "New Invitee", password: "new-invitee-password-long" })), acceptInvitation(request("/api/staff/invitations/accept", { token: newToken, fullName: "New Invitee", password: "new-invitee-password-long" }))]);
    assert.equal(concurrent.filter(response => response.status === 200).length, 1);
    assert.equal(await GymMembership.countDocuments({ gymId: gym._id, role: "gym_admin", status: "active", userId: { $in: await User.find({ email: newEmail }).distinct("_id") } }), 1);
    assert.equal((await inviteStaff(request("/api/staff/invitations", { email: newEmail, role: "trainer" }, ownerToken))).status, 400);

    const trainer = await Trainer.create({ gymId: gym._id, fullName: "Assigned Trainer", email: trainerUser.email, phone: "+923001112233", specialization: "Strength", joiningDate: new Date(), status: "active" });
    const assignedMember = await Member.create({ gymId: gym._id, fullName: "Assigned Member", phone: `+92300${String(randomBytes(4).readUInt32BE(0) % 10000000).padStart(7, "0")}`, gender: "Other", planId: new mongoose.Types.ObjectId(), trainerId: trainer._id, startDate: new Date("2026-01-01"), expiryDate: new Date("2027-01-01") });
    const unassignedMember = await Member.create({ gymId: gym._id, fullName: "Unassigned Member", phone: `+92301${String(randomBytes(4).readUInt32BE(0) % 10000000).padStart(7, "0")}`, gender: "Other", planId: new mongoose.Types.ObjectId(), startDate: new Date("2026-01-01"), expiryDate: new Date("2027-01-01") });
    await Attendance.create({ gymId: gym._id, memberId: assignedMember._id, date: "2026-10-20", checkInAt: new Date() });
    await Attendance.create({ gymId: gym._id, memberId: unassignedMember._id, date: "2026-10-20", checkInAt: new Date() });
    const trainerToken = randomBytes(32).toString("base64url");
    const trainerSession = await AuthSession.create({ userId: trainerUser._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(trainerToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(trainerSession._id);
    const trainerInvite = await inviteStaff(request("/api/staff/invitations", { email: trainerUser.email, role: "trainer" }, ownerToken)); assert.equal(trainerInvite.status, 201);
    const trainerInviteToken = new URL((await trainerInvite.json()).data.invitationUrl, "http://localhost").searchParams.get("token");
    assert.equal((await acceptInvitation(request("/api/staff/invitations/accept", { token: trainerInviteToken }, trainerToken))).status, 200);
    const trainerWorkspace = await getTrainerWorkspace(request("/api/trainer/workspace", undefined, trainerToken)); assert.equal(trainerWorkspace.status, 200);
    const trainerData = (await trainerWorkspace.json()).data;
    assert.deepEqual(trainerData.members.map(member => member.id), [String(assignedMember._id)]);
    assert.deepEqual(trainerData.attendance.map(record => record.memberId), [String(assignedMember._id)]);
    const memberRoute = await (await import("node:fs/promises")).readFile(new URL("../app/api/members/route.js", import.meta.url), "utf8");
    assert.match(memberRoute, /requireApiUser\(request\)/);
    assert.doesNotMatch(memberRoute, /allowedRoles: \[[^\]]*trainer/);

    const existingInvite = await inviteStaff(request("/api/staff/invitations", { email: existing.email, role: "gym_admin" }, ownerToken)); assert.equal(existingInvite.status, 201);
    const existingToken = new URL((await existingInvite.json()).data.invitationUrl, "http://localhost").searchParams.get("token");
    assert.equal((await acceptInvitation(request("/api/staff/invitations/accept", { token: existingToken, fullName: "Attacker", password: "attacker-password-long" }))).status, 401);
    const existingSessionToken = randomBytes(32).toString("base64url");
    const existingSession = await AuthSession.create({ userId: existing._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(existingSessionToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(existingSession._id);
    const existingAccept = await acceptInvitation(request("/api/staff/invitations/accept", { token: existingToken }, existingSessionToken)); assert.equal(existingAccept.status, 200);
    const saved = await User.findById(existing._id).select("+passwordHash").lean(); assert.equal(await verifyPassword("existing-password-long", saved.passwordHash), true);

    const crossGymToken = randomBytes(32).toString("base64url");
    const crossGymSession = await AuthSession.create({ userId: crossGym._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(crossGymToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(crossGymSession._id);
    await GymMembership.create({ userId: crossGym._id, gymId: otherGym._id, role: "gym_admin", status: "active" });
    const crossGymInvite = await inviteStaff(request("/api/staff/invitations", { email: crossGym.email, role: "gym_admin" }, ownerToken)); assert.equal(crossGymInvite.status, 201);
    const crossGymUrl = new URL((await crossGymInvite.json()).data.invitationUrl, "http://localhost");
    const crossGymAccept = await acceptInvitation(request("/api/staff/invitations/accept", { token: crossGymUrl.searchParams.get("token") }, crossGymToken));
    assert.equal(crossGymAccept.status, 409); assert.match((await crossGymAccept.json()).error.message, /another gym/);
    assert.equal(await GymMembership.countDocuments({ userId: crossGym._id, status: "active" }), 1);
    assert.equal(await GymMembership.countDocuments({ userId: crossGym._id, gymId: gym._id }), 0);
    assert.ok(await AuthSession.exists({ _id: crossGymSession._id }));
    assert.equal((await StaffInvitation.findOne({ email: crossGym.email })).status, "pending");

    const racingToken = randomBytes(32).toString("base64url");
    const racingSession = await AuthSession.create({ userId: racing._id, tokenHash: (await import("node:crypto")).createHmac("sha256", process.env.AUTH_SESSION_SECRET).update(racingToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); ids.sessions.push(racingSession._id);
    const inviteA = await inviteStaff(request("/api/staff/invitations", { email: racing.email, role: "gym_admin" }, ownerToken)); assert.equal(inviteA.status, 201);
    const inviteB = await inviteStaff(request("/api/staff/invitations", { email: racing.email, role: "gym_admin" }, otherOwnerToken)); assert.equal(inviteB.status, 201);
    const tokenA = new URL((await inviteA.json()).data.invitationUrl, "http://localhost").searchParams.get("token");
    const tokenB = new URL((await inviteB.json()).data.invitationUrl, "http://localhost").searchParams.get("token");
    const raceResults = await Promise.all([
      acceptInvitation(request("/api/staff/invitations/accept", { token: tokenA }, racingToken)),
      acceptInvitation(request("/api/staff/invitations/accept", { token: tokenB }, racingToken)),
    ]);
    assert.equal(raceResults.filter(result => result.status === 200).length, 1);
    assert.equal(await GymMembership.countDocuments({ userId: racing._id, status: "active" }), 1);
    const racingInvitations = await StaffInvitation.find({ email: racing.email }).lean();
    assert.equal(racingInvitations.filter(invitation => invitation.status === "accepted").length, 1);
    assert.equal(racingInvitations.filter(invitation => invitation.status === "pending").length, 1);

    const ownerStaff = await listStaff(request("/api/staff/invitations", undefined, ownerToken)); assert.equal(ownerStaff.status, 200);
    const listed = await ownerStaff.json(); assert.ok(listed.data.staff.every(person => person.email !== otherUser.email));
    const oldInvite = await StaffInvitation.findOne({ email: newEmail }); await StaffInvitation.updateOne({ _id: oldInvite._id }, { $set: { expiresAt: new Date(0), status: "pending" } });
    assert.equal((await acceptInvitation(request("/api/staff/invitations/accept", { token: newToken, fullName: "New Invitee", password: "new-invitee-password-long" }))).status, 400);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await Attendance.deleteMany({ gymId: { $in: ids.gyms } });
      await Member.deleteMany({ gymId: { $in: ids.gyms } });
      await Trainer.deleteMany({ gymId: { $in: ids.gyms } });
      await StaffInvitation.deleteMany({ email: { $regex: suffix } });
      await AuthSession.deleteMany({ userId: { $in: ids.users } });
      await GymMembership.deleteMany({ userId: { $in: ids.users }, gymId: { $in: ids.gyms } });
      await User.deleteMany({ _id: { $in: ids.users } });
      await Gym.deleteMany({ _id: { $in: ids.gyms } });
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});
