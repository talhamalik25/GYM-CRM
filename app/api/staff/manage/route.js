import User from "../../../../models/User.js";
import Trainer from "../../../../models/Trainer.js";
import { branchScope } from "../../../../lib/branchRules.js";
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
    if (!body || !mongoose.isObjectIdOrHexString(body.id) || Object.keys(body).some((key) => !["id", "action", "branchId", "role"].includes(key)) || !["revoke", "assign_branch", "revoke_invitation", "change_role"].includes(body.action)) return errorResponse("Choose a valid staff action.", 400);
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
      else if (body.action === "change_role") {
        await assertGymFeature(context.gymId, "fullStaffManagement", { session });
        if (!["gym_admin", "trainer"].includes(body.role)) throw new EntitlementError("Choose an allowed staff role.", "INVALID_ROLE", 400);
        if (body.role === "trainer") {
          const user = await User.findById(membership.userId).session(session).lean();
          if (!user || !await Trainer.exists({ ...branchScope(context.gymId, membership.branchId), email: user.email, status: "active" }).session(session)) throw new EntitlementError("Create an active trainer profile in the assigned branch first.", "TRAINER_REQUIRED", 409);
        }
        membership.role = body.role;
      } else {
        await assertGymFeature(context.gymId, "multiBranch", { session });
        if (!(await listGymBranches(context.gymId)).some((branch) => String(branch._id) === body.branchId && branch.status === "active")) throw new EntitlementError("Choose an active branch in this organization.", "BRANCH_FORBIDDEN");
        if (membership.role === "trainer") {
          const user = await User.findById(membership.userId).session(session).lean();
          if (!user || !await Trainer.exists({ ...branchScope(context.gymId, new mongoose.Types.ObjectId(body.branchId)), email: user.email, status: "active" }).session(session)) throw new EntitlementError("A trainer must remain assigned to the branch containing their trainer profile.", "TRAINER_BRANCH_MISMATCH", 409);
        }
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
