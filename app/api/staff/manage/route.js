import mongoose from "mongoose";
import { requireApiUser, getRequestTenantContext } from "../../../../lib/auth.js";
import { lockGym, assertGymFeature, EntitlementError, entitlementErrorResponse } from "../../../../lib/entitlements.js";
import GymMembership from "../../../../models/GymMembership.js";
import StaffInvitation from "../../../../models/StaffInvitation.js";
import { listGymBranches } from "../../../../lib/branches.js";
import { successResponse, errorResponse } from "../../../../lib/planApiResponse.js";
export async function PATCH(request) {
  const denied = await requireApiUser(request, { allowedRoles: ["gym_owner"] });
  if (denied) return denied;
  let session;
  try {
    const body = await request.json();
    if (!body || !mongoose.isObjectIdOrHexString(body.id) || Object.keys(body).some((key) => !["id", "action", "branchId"].includes(key)) || !["revoke", "assign_branch", "revoke_invitation"].includes(body.action)) return errorResponse("Choose a valid staff action.", 400);
    const context = getRequestTenantContext(request);
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await lockGym(context.gymId, session);
      if (body.action === "revoke_invitation") {
        await StaffInvitation.updateOne({ _id: body.id, gymId: context.gymId, status: "pending" }, { $set: { status: "revoked" } }, { session });
        return;
      }
      const membership = await GymMembership.findOne({ _id: body.id, gymId: context.gymId, role: { $ne: "gym_owner" }, status: "active" }).session(session);
      if (!membership) throw new EntitlementError("Staff membership was not found.", "NOT_FOUND", 404);
      if (body.action === "revoke") membership.status = "revoked";
      else {
        await assertGymFeature(context.gymId, "multiBranch", { session });
        if (!(await listGymBranches(context.gymId)).some((branch) => String(branch._id) === body.branchId && branch.status === "active")) throw new EntitlementError("Choose an active branch in this organization.", "BRANCH_FORBIDDEN");
        membership.branchId = body.branchId;
      }
      await membership.save({ session });
    });
    return successResponse({ saved: true });
  } catch (error) {
    if (error instanceof EntitlementError) return entitlementErrorResponse(error);
    return errorResponse("Could not update staff access.", 503);
  } finally { if (session) await session.endSession(); }
}
