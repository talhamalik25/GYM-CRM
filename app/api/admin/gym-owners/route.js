import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { requireSuperadminUser } from "../../../../lib/auth.js";
import { ensureNoConflictingGymMembership, GymProvisioningError, lockOwnerAccountForAssignment, validateGymOwnerAssignment } from "../../../../lib/adminGymRules.js";
import Gym from "../../../../models/Gym.js";
import GymMembership from "../../../../models/GymMembership.js";
import User from "../../../../models/User.js";

export async function POST(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  let body;
  try { body = await request.json(); } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }
  const validation = validateGymOwnerAssignment(body);
  if (validation.message) return errorResponse(validation.message, 400, validation.fields);
  if (!mongoose.isObjectIdOrHexString(validation.gymId)) return errorResponse("Gym id is invalid.", 400);

  try {
    await connectToDatabase();
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const gym = await Gym.findOne({ _id: validation.gymId, status: "active" }).select("_id").session(session).lean();
        const user = await User.findOne({ email: validation.email, role: "staff", isActive: true }).select("_id email fullName role isActive __v").session(session);
        if (!gym) throw new GymProvisioningError("An active gym was not found.", 404);
        if (!user) throw new GymProvisioningError("An active staff account with this email was not found.", 404, { email: "Choose an existing active staff account." });
        const activeMemberships = await GymMembership.find({ userId: user._id, status: "active" }).select("gymId role").session(session).lean();
        if (activeMemberships.length === 1 && String(activeMemberships[0].gymId) === String(gym._id) && activeMemberships[0].role === "gym_owner") {
          result = { gymId: String(gym._id), owner: { name: user.fullName || "Name unavailable", email: user.email }, duplicate: true };
          return;
        }
        await lockOwnerAccountForAssignment(user, session, User);
        await ensureNoConflictingGymMembership(user._id, session, GymMembership);
        const previous = await GymMembership.findOne({ userId: user._id, gymId: gym._id }).session(session);
        if (previous) {
          previous.role = "gym_owner";
          previous.status = "active";
          await previous.save({ session });
        } else {
          await GymMembership.create([{ userId: user._id, gymId: gym._id, role: "gym_owner", status: "active" }], { session });
        }
        result = { gymId: String(gym._id), owner: { name: user.fullName || "Name unavailable", email: user.email }, duplicate: false };
      });
      const { duplicate, ...data } = result;
      return successResponse(data, duplicate ? 200 : 201);
    } finally { await session.endSession(); }
  } catch (error) {
    if (error instanceof GymProvisioningError) return errorResponse(error.message, error.status, Object.keys(error.fields).length ? error.fields : undefined);
    if (error?.code === 11000) return errorResponse("This account already has a gym owner assignment. Refresh and check its current Gym access.", 409);
    if (error?.code === 20 || error?.codeName === "IllegalOperation" || /replica set|transaction numbers are only allowed/i.test(error?.message || "")) return errorResponse("Atomic owner assignment requires MongoDB transaction support. Configure a replica-set MongoDB deployment.", 503);
    console.error("Gym owner assignment could not be completed.");
    return errorResponse("Could not assign the Gym owner. Please try again.", 503);
  }
}
