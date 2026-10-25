import connectToDatabase from "../../../../lib/db.js";
import { getAuthenticatedUserFromRequest, validateRequestOrigin } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { serializeOwnerProfile, validateOwnerProfile } from "../../../../lib/userProfileRules.js";
import GymMembership from "../../../../models/GymMembership.js";
import User from "../../../../models/User.js";

async function getOwner(request) {
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user || user.role !== "staff") return { error: errorResponse("Authentication is required.", 401) };
  await connectToDatabase();
  const membership = await GymMembership.findOne({ userId: user._id, role: "gym_owner", status: "active" }).select("_id").lean();
  if (!membership) return { error: errorResponse("An active Gym Owner account is required.", 403) };
  return { user };
}

export async function GET(request) {
  try {
    const auth = await getOwner(request);
    if (auth.error) return auth.error;
    const user = await User.findOne({ _id: auth.user._id, role: "staff", isActive: true }).select("fullName email phone").lean();
    if (!user) return errorResponse("User account was not found or is inactive.", 401);
    return successResponse(serializeOwnerProfile(user));
  } catch {
    return errorResponse("Could not load your profile. Please try again.", 503);
  }
}

export async function PATCH(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;
  let body;
  try { body = await request.json(); }
  catch { return errorResponse("Request body must be valid JSON.", 400); }
  const validation = validateOwnerProfile(body);
  if (validation.message) return errorResponse(validation.message, 400, validation.fields);
  try {
    const auth = await getOwner(request);
    if (auth.error) return auth.error;
    const updated = await User.findOneAndUpdate(
      { _id: auth.user._id, role: "staff", isActive: true },
      { $set: { fullName: validation.fullName, phone: validation.phone } },
      { returnDocument: "after", runValidators: true },
    ).select("fullName email phone").lean();
    if (!updated) return errorResponse("User account was not found or is inactive.", 401);
    return successResponse(serializeOwnerProfile(updated));
  } catch {
    return errorResponse("Could not save your profile. Please try again.", 503);
  }
}
