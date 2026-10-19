import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { requireSuperadminUser } from "../../../../lib/auth.js";
import { validateGymOwnerAssignment } from "../../../../lib/adminGymRules.js";
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
    const [gym, user] = await Promise.all([
      Gym.findOne({ _id: validation.gymId, status: "active" }).select("_id").lean(),
      User.findOne({ email: validation.email }).select("_id email fullName role isActive").lean(),
    ]);
    if (!gym) return errorResponse("An active gym was not found.", 404);
    if (!user || !user.isActive || user.role !== "staff") {
      return errorResponse("An active staff account with this email was not found.", 404, { email: "Choose an existing active staff account." });
    }

    const activeMemberships = await GymMembership.find({ userId: user._id, status: "active" }).select("gymId role").lean();
    if (activeMemberships.length) {
      if (activeMemberships.length === 1 && String(activeMemberships[0].gymId) === String(gym._id) && activeMemberships[0].role === "gym_owner") {
        return successResponse({ gymId: String(gym._id), owner: { name: user.fullName || "Name unavailable", email: user.email } });
      }
      return errorResponse("This account already has an active gym membership. Revoke the existing assignment before assigning another gym.", 409);
    }

    const previous = await GymMembership.findOne({ userId: user._id, gymId: gym._id });
    if (previous) {
      previous.role = "gym_owner";
      previous.status = "active";
      await previous.save();
    } else {
      await GymMembership.create({ userId: user._id, gymId: gym._id, role: "gym_owner", status: "active" });
    }

    return successResponse({ gymId: String(gym._id), owner: { name: user.fullName || "Name unavailable", email: user.email } }, 201);
  } catch (error) {
    if (error?.code === 11000) return errorResponse("This account already has a gym owner assignment. Refresh and check its current Gym access.", 409);
    console.error("Gym owner assignment could not be completed.");
    return errorResponse("Could not assign the Gym owner. Please try again.", 503);
  }
}
