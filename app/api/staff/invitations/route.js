import { listGymBranches } from "../../../../lib/branches.js";
import { assertGymFeature, EntitlementError, entitlementErrorResponse } from "../../../../lib/entitlements.js";
import connectToDatabase from "../../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser } from "../../../../lib/auth.js";
import { createInvitationToken, validateStaffInvitationBody } from "../../../../lib/staffInvitations.js";
import GymMembership from "../../../../models/GymMembership.js";
import StaffInvitation from "../../../../models/StaffInvitation.js";
import Trainer from "../../../../models/Trainer.js";
import User from "../../../../models/User.js";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request) {
  const auth = await requireApiUser(request, { allowedRoles: ["gym_owner"] });
  if (auth) return auth;
  try {
    await connectToDatabase();
    const [memberships, invitations] = await Promise.all([
      GymMembership.find({ gymId: getRequestGymId(request), status: "active" }).populate("userId", "fullName email").sort({ createdAt: 1 }).lean(),
      StaffInvitation.find({ gymId: getRequestGymId(request) }).select("email role status expiresAt createdAt").sort({ createdAt: -1 }).lean(),
    ]);
    return json({ success: true, data: { staff: memberships.map(({ _id, userId, role, branchId, createdAt }) => ({ id: String(_id), name: userId?.fullName || "Unknown user", email: userId?.email || "", role, branchId: String(branchId || getRequestGymId(request)), createdAt })), invitations, branches: getRequestTenantContext(request).entitlements.features.multiBranch ? await listGymBranches(getRequestGymId(request)) : [], entitlements: getRequestTenantContext(request).entitlements } });
  } catch {
    return json({ success: false, error: { message: "Staff could not be loaded." } }, 503);
  }
}

export async function POST(request) {
  const auth = await requireApiUser(request, { allowedRoles: ["gym_owner"] });
  if (auth) return auth;
  let body;
  try { body = await request.json(); } catch { return json({ success: false, error: { message: "Enter a valid invitation." } }, 400); }
  const validation = validateStaffInvitationBody(body);
  if (validation.message) return json({ success: false, error: validation }, 400);
  try {
    await connectToDatabase();
    const assignedBranch = validation.branchId || String(getRequestGymId(request));
    if (assignedBranch !== String(getRequestGymId(request))) await assertGymFeature(getRequestGymId(request), "multiBranch");
    if (!(await listGymBranches(getRequestGymId(request))).some((branch) => String(branch._id) === assignedBranch && branch.status === "active")) return json({ success: false, error: { message: "Choose an active branch in your organization." } }, 403);
    const targetUser = await User.findOne({ email: validation.email }).select("_id role isActive").lean();
    if (targetUser && (targetUser.role !== "staff" || !targetUser.isActive)) {
      return json({ success: false, error: { message: "This email belongs to an inactive or platform-level account and cannot be invited." } }, 409);
    }
    if (validation.role === "trainer" && !await Trainer.exists({ gymId: getRequestGymId(request), email: validation.email, status: "active" })) {
      return json({ success: false, error: { message: "Create an active trainer profile with this email before sending a trainer invitation." }, fields: { email: "An active trainer profile must use this email." } }, 400);
    }
    if (targetUser && await GymMembership.exists({ gymId: getRequestGymId(request), status: "active", userId: targetUser._id })) {
      return json({ success: false, error: { message: "This person is already a member of the gym." } }, 409);
    }
    const tokenData = createInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await StaffInvitation.updateMany({ gymId: getRequestGymId(request), email: validation.email, status: "pending" }, { $set: { status: "revoked" } });
    await StaffInvitation.create({ branchId: assignedBranch, gymId: getRequestGymId(request), email: validation.email, role: validation.role, tokenHash: tokenData.tokenHash, expiresAt });
    return json({ success: true, data: { email: validation.email, role: validation.role, expiresAt, invitationUrl: `/staff/accept?token=${encodeURIComponent(tokenData.token)}` } }, 201);
  } catch (error) {
    if (error instanceof EntitlementError) return entitlementErrorResponse(error);
    return json({ success: false, error: { message: "The invitation could not be created." } }, 503);
  }
}
