import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { getAuthenticatedUserFromRequest, requireSuperadminUser } from "../../../../../lib/auth";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { serializeAdminUser, validateAccountStatusChange, isSuperadmin } from "../../../../../lib/adminUserRules";
import User from "../../../../../models/User";

export async function PATCH(request, { params }) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("User id is invalid.", 400);
  let body;
  try { body = await request.json(); }
  catch { return errorResponse("Request body must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "isActive")) {
    return errorResponse("Only account activation status can be changed.", 400, { isActive: "Set isActive to true or false." });
  }
  try {
    await connectToDatabase();
    const target = await User.findById(id).select("fullName email role isActive createdAt").lean();
    if (!target) return errorResponse("User account was not found.", 404);
    const actor = await getAuthenticatedUserFromRequest(request);
    const otherActiveSuperadmins = isSuperadmin(target) && body.isActive === false
      ? await User.countDocuments({ _id: { $ne: target._id }, role: { $in: ["platform_super_admin", "superadmin"] }, isActive: true })
      : 0;
    const validation = validateAccountStatusChange({ actorId: actor?._id, targetId: target._id, desiredActive: body.isActive, targetRole: target.role, otherActiveSuperadmins });
    if (validation) return errorResponse(validation.message, validation.status);
    const updated = await User.findOneAndUpdate({ _id: target._id, isActive: { $ne: body.isActive } }, { $set: { isActive: body.isActive } }, { returnDocument: "after", runValidators: true }).select("fullName email role isActive createdAt").lean();
    return successResponse(serializeAdminUser(updated || { ...target, isActive: body.isActive }));
  } catch (error) {
    console.error("Admin user status update failed:", error?.message);
    return errorResponse("Could not update the user account. Please try again.", 503);
  }
}
