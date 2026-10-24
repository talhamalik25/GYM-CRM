import mongoose from "mongoose";
import { requireApiUser, getRequestTenantContext } from "../../../lib/auth.js";
import Branch from "../../../models/Branch.js";
import { listGymBranches } from "../../../lib/branches.js";
import { canSelectBranch } from "../../../lib/branchRules.js";
import { assertGymFeature, assertGymLimit, lockGym, gymEntitlements, EntitlementError, entitlementErrorResponse } from "../../../lib/entitlements.js";
import { successResponse, errorResponse } from "../../../lib/planApiResponse.js";

export async function GET(request) {
  const denied = await requireApiUser(request, { allowedRoles: ["gym_owner", "gym_admin", "trainer"] });
  if (denied) return denied;
  try {
    const context = getRequestTenantContext(request);
    const branches = await listGymBranches(context.gymId);
    const assigned = String(context.membership.branchId || context.gymId);
    return successResponse({ enabled: context.entitlements.features.multiBranch, role: context.role, consolidated: context.entitlements.features.consolidatedAnalytics, defaultBranchId: String(context.gymId), branches: branches.filter((branch) => context.role === "gym_owner" || String(branch._id) === assigned) });
  } catch { return errorResponse("Could not load branches.", 503); }
}

export async function POST(request) {
  const denied = await requireApiUser(request, { allowedRoles: ["gym_owner", "gym_admin", "trainer"] });
  if (denied) return denied;
  let session;
  try {
    const body = await request.json();
    const context = getRequestTenantContext(request);
    if (body?.action === "select") {
      if (typeof body.branchId !== "string" || Object.keys(body).some((key) => !["action", "branchId"].includes(key))) return errorResponse("Choose a valid branch.", 400);
      const entitlements = context.entitlements;
      if (!canSelectBranch({ role: context.role, assignedBranchId: context.membership.branchId, gymId: context.gymId, requestedBranchId: body.branchId, multiBranch: entitlements.features.multiBranch, consolidated: entitlements.features.consolidatedAnalytics, readOnly: true })) throw new EntitlementError("This branch is not authorized.", "BRANCH_FORBIDDEN");
      if (body.branchId !== "all" && !(await listGymBranches(context.gymId)).some((branch) => String(branch._id) === body.branchId && (branch.status === "active" || context.role === "gym_owner"))) throw new EntitlementError("Branch was not found.", "BRANCH_FORBIDDEN");
      const { NextResponse } = await import("next/server.js");
      const response = NextResponse.json({ success: true, data: { selected: body.branchId } });
      response.cookies.set("fitivo_branch", body.branchId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 604800 });
      return response;
    }
    if (context.role !== "gym_owner") throw new EntitlementError("Only the organization owner can manage branches.", "FORBIDDEN");
    if (!body || Object.keys(body).some((key) => !["name", "address", "id", "status"].includes(key)) || typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100 || (body.address != null && (typeof body.address !== "string" || body.address.length > 400)) || (body.status && !["active", "inactive"].includes(body.status)) || (body.id && !mongoose.isObjectIdOrHexString(body.id))) return errorResponse("Enter valid branch details.", 400);
    session = await mongoose.startSession();
    let branch;
    await session.withTransaction(async () => {
      const gym = await lockGym(context.gymId, session);
      gymEntitlements(gym);
      await assertGymFeature(gym._id, "multiBranch", { session });
      const existing = body.id ? await Branch.findOne({ _id: body.id, gymId: gym._id }).session(session).lean() : null;
      const isDefault = body.id === String(gym._id);
      if (body.id && !existing && !isDefault) throw new EntitlementError("Branch was not found.", "NOT_FOUND", 404);
      if (isDefault && body.status === "inactive") throw new EntitlementError("The default branch must remain active.", "DEFAULT_BRANCH_REQUIRED", 409);
      if ((!body.id || existing?.status === "inactive") && body.status !== "inactive") await assertGymLimit(gym._id, "branches", { session });
      branch = await Branch.findOneAndUpdate({ _id: existing?._id || (isDefault ? gym._id : new mongoose.Types.ObjectId()), gymId: gym._id }, { $set: { name: body.name.trim(), address: body.address?.trim() || "", status: body.status || "active", isDefault } }, { new: true, upsert: true, runValidators: true, session }).lean();
    });
    return successResponse({ branch }, body.id ? 200 : 201);
  } catch (error) {
    if (error instanceof EntitlementError) return entitlementErrorResponse(error);
    if (error?.code === 11000) return errorResponse("A branch already uses this name.", 409);
    return errorResponse("Could not save branch details.", error instanceof SyntaxError ? 400 : 503);
  } finally { if (session) await session.endSession(); }
}
