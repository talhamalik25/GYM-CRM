import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { requireSuperadminUser } from "../../../../../lib/auth";
import { serializeAdminGym, validateGymStatusUpdate } from "../../../../../lib/adminGymRules.js";
import Gym from "../../../../../models/Gym";
import GymMembership from "../../../../../models/GymMembership";

async function readGymId(context) {
  const { id } = await context.params;
  return id;
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
