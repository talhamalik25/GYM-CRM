import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db.js";
import { createSession, getAuthenticatedUserFromRequest, validateRequestOrigin } from "../../../../../lib/auth.js";
import { hashPassword, validatePassword } from "../../../../../lib/passwords.js";
import { hashInvitationToken } from "../../../../../lib/staffInvitations.js";
import Gym from "../../../../../models/Gym.js";
import GymMembership from "../../../../../models/GymMembership.js";
import StaffInvitation from "../../../../../models/StaffInvitation.js";
import User from "../../../../../models/User.js";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;
  let body;
  try { body = await request.json(); } catch { return json({ success: false, error: { message: "This invitation is invalid or expired." } }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["token", "fullName", "password"].includes(key)) || typeof body.token !== "string" || !/^[A-Za-z0-9_-]{40,60}$/.test(body.token)) {
    return json({ success: false, error: { message: "This invitation is invalid or expired." } }, 400);
  }
  try {
    await connectToDatabase();
    const invitation = await StaffInvitation.findOne({ tokenHash: hashInvitationToken(body.token), status: "pending", expiresAt: { $gt: new Date() } }).select("+tokenHash").lean();
    if (!invitation || !["gym_admin", "trainer"].includes(invitation.role) || !await Gym.exists({ _id: invitation.gymId, status: "active" })) return json({ success: false, error: { message: "This invitation is invalid or expired." } }, 400);
    const existingUser = await User.findOne({ email: invitation.email }).select("_id").lean();
    let userId;
    let passwordHash;
    if (existingUser) {
      const authenticatedUser = await getAuthenticatedUserFromRequest(request);
      if (!authenticatedUser || String(authenticatedUser._id) !== String(existingUser._id)) return json({ success: false, error: { message: "Sign in to the invited account before accepting." } }, 401);
      userId = existingUser._id;
    } else {
      if (typeof body.fullName !== "string" || body.fullName.trim().length < 2 || body.fullName.trim().length > 120) return json({ success: false, error: { message: "Enter your name to create an account." } }, 400);
      const passwordError = validatePassword(body.password);
      if (passwordError) return json({ success: false, error: { message: passwordError } }, 400);
      passwordHash = await hashPassword(body.password);
    }

    const mongoSession = await mongoose.startSession();
    let response;
    try {
      await mongoSession.withTransaction(async () => {
        const claimed = await StaffInvitation.findOneAndUpdate(
          { _id: invitation._id, tokenHash: hashInvitationToken(body.token), status: "pending", expiresAt: { $gt: new Date() } },
          { $set: { status: "accepted" } }, { new: true, session: mongoSession },
        );
        if (!claimed) throw new Error("INVITATION_ALREADY_USED");
        let memberId = userId;
        if (!memberId) {
          const [createdUser] = await User.create([{ fullName: body.fullName.trim(), email: invitation.email, passwordHash, role: "staff", isActive: true }], { session: mongoSession });
          memberId = createdUser._id;
        }
        if (await GymMembership.exists({ userId: memberId, gymId: invitation.gymId }).session(mongoSession)) throw new Error("MEMBERSHIP_EXISTS");
        await GymMembership.create([{ userId: memberId, gymId: invitation.gymId, role: invitation.role, status: "active" }], { session: mongoSession });
        await StaffInvitation.updateOne({ _id: invitation._id }, { $set: { acceptedBy: memberId } }, { session: mongoSession });
        if (!existingUser) response = await createSession(memberId, { session: mongoSession });
      });
    } finally { await mongoSession.endSession(); }
    return response || json({ success: true, data: { redirectTo: "/dashboard" } });
  } catch (error) {
    const duplicate = error?.code === 11000;
    return json({ success: false, error: { message: duplicate || error?.message === "MEMBERSHIP_EXISTS" ? "This account already has access to the invited gym." : "This invitation is invalid, expired, or already used." } }, duplicate ? 409 : 400);
  }
}
