import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { GET, PATCH } from "../app/api/account/profile/route.js";
import connectToDatabase from "../lib/db.js";
import AuthSession from "../models/AuthSession.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import User from "../models/User.js";
import { hashPassword } from "../lib/passwords.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "user_profile");
const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";

function request(method, body, token) {
  const result = new Request("http://localhost/api/account/profile", { method, headers: { origin: "http://localhost", ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (token) Object.defineProperty(result, "cookies", { value: { get: (name) => name === cookieName ? { value: token } : undefined } });
  return result;
}

test("owner profile is session-derived and cannot change protected account or Gym fields", { skip: !testUri }, async () => {
  const previousUri = process.env.MONGODB_URI;
  const previousSecret = process.env.AUTH_SESSION_SECRET;
  const secret = randomBytes(32).toString("hex");
  process.env.MONGODB_URI = testUri;
  process.env.AUTH_SESSION_SECRET = secret;
  const suffix = randomUUID();
  const users = [];
  const gyms = [];
  const sessions = [];
  try {
    await connectToDatabase();
    const owner = await User.create({ fullName: "Original Name", email: `owner-${suffix}@example.test`, phone: "", passwordHash: await hashPassword("owner-password-long"), role: "staff", isActive: true });
    const nonOwner = await User.create({ fullName: "Staff Name", email: `staff-${suffix}@example.test`, passwordHash: await hashPassword("staff-password-long"), role: "staff", isActive: true });
    users.push(owner._id, nonOwner._id);
    const gym = await Gym.create({ name: "Profile Gym", slug: `profile-${suffix}` }); gyms.push(gym._id);
    await GymMembership.create({ userId: owner._id, gymId: gym._id, role: "gym_owner", status: "active" });
    await GymMembership.create({ userId: nonOwner._id, gymId: gym._id, role: "gym_admin", status: "active" });
    const ownerToken = randomBytes(32).toString("base64url");
    const session = await AuthSession.create({ userId: owner._id, tokenHash: createHmac("sha256", secret).update(ownerToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); sessions.push(session._id);
    const staffToken = randomBytes(32).toString("base64url");
    const staffSession = await AuthSession.create({ userId: nonOwner._id, tokenHash: createHmac("sha256", secret).update(staffToken).digest("hex"), expiresAt: new Date(Date.now() + 60000) }); sessions.push(staffSession._id);
    const read = await GET(request("GET", undefined, ownerToken));
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json()).data, { fullName: "Original Name", email: owner.email, phone: "" });
    const update = await PATCH(request("PATCH", { fullName: "Updated Name", phone: "+923001234567" }, ownerToken));
    assert.equal(update.status, 200);
    const saved = await User.findById(owner._id).lean();
    assert.equal(saved.fullName, "Updated Name");
    assert.equal(saved.phone, "+923001234567");
    assert.equal(saved.role, "staff");
    assert.equal(saved.isActive, true);
    assert.equal(await GymMembership.countDocuments({ userId: owner._id, gymId: gym._id, role: "gym_owner", status: "active" }), 1);
    const forbidden = await GET(request("GET", undefined, staffToken));
    assert.equal(forbidden.status, 403);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await AuthSession.deleteMany({ _id: { $in: sessions } });
      await GymMembership.deleteMany({ userId: { $in: users }, gymId: { $in: gyms } });
      await User.deleteMany({ _id: { $in: users } });
      await Gym.deleteMany({ _id: { $in: gyms } });
    }
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});
