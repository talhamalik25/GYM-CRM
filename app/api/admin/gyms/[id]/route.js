import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db.js";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse.js";
import { requireSuperadminUser } from "../../../../../lib/auth.js";
import { serializeAdminGym, validateGymStatusUpdate } from "../../../../../lib/adminGymRules.js";
import Gym from "../../../../../models/Gym.js";
import GymMembership from "../../../../../models/GymMembership.js";
import { trialSummary } from "../../../../../lib/publicTrialAccess.js";

async function readGymId(context) {
  const { id } = await context.params;
  return id;
}

export async function GET(request, context) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  let id;
  try { id = await readGymId(context); } catch {
    return errorResponse("Gym id is invalid.", 400);
  }
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Gym id is invalid.", 400);

  try {
    await connectToDatabase();
    const gym = await Gym.findById(id).select("name slug status timezone createdAt updatedAt publicTrial saasSubscription").lean();
    if (!gym) return errorResponse("Gym was not found.", 404);
    const memberships = await GymMembership.find({ gymId: gym._id, role: "gym_owner", status: "active" })
      .select("gymId userId").populate({ path: "userId", match: { isActive: { $ne: false } }, select: "fullName email" }).lean();
    const trial = trialSummary(gym);
    return successResponse({ ...serializeAdminGym(gym, memberships), ...(trial ? { trial } : {}) });
  } catch {
    console.error("Admin gym details could not be loaded.");
    return errorResponse("Could not load gym details. Please try again.", 503);
  }
}

export async function PATCH(request, context) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  try {
    const id = await readGymId(context);
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Gym id is invalid.", 400);
    let body;
    try { body = await request.json(); } catch { return errorResponse("Request body must be valid JSON.", 400); }
    const validation = validateGymStatusUpdate(body);
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);

    await connectToDatabase();
    const gym = await Gym.findOneAndUpdate({ _id: id }, { $set: { status: validation.status } }, { new: true, runValidators: true }).lean();
    if (!gym) return errorResponse("Gym was not found.", 404);
    const memberships = await GymMembership.find({ gymId: gym._id, role: "gym_owner", status: "active" })
      .select("gymId userId").populate("userId", "fullName email").lean();
    return successResponse(serializeAdminGym(gym, memberships));
  } catch {
    console.error("Admin gym status could not be updated.");
    return errorResponse("Could not update the gym status. Please try again.", 503);
  }
}
