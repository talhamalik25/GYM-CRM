import mongoose from "mongoose";
import Branch from "../models/Branch.js";
import { branchScope, canSelectBranch } from "./branchRules.js";
import { gymEntitlements, EntitlementError } from "./entitlements.js";

export async function resolveBranchContext(request, context) {
  const { gymId, gym, membership, role } = context;
  const entitlements = gymEntitlements(gym, { requireActive: false });
  const path = new URL(request.url).pathname;
  // Billing and organization settings are independent of the active location.
  const organizationRoute = /^\/api\/(gym\/(billing|settings|entitlements)|branches(?:\/|$)|staff\/)/.test(path);
  const selected = organizationRoute ? String(gymId) : request.headers.get("x-fitivo-branch") || request.cookies?.get("fitivo_branch")?.value || "";
  const requestedBranchId = selected || String(role === "gym_owner" ? gymId : membership.branchId || gymId);
  const readOnly = request.method === "GET" && ["/api/reports", "/api/dashboard/owner", "/api/payments/summary", "/api/payment-reports"].includes(path);
  if (!organizationRoute && !canSelectBranch({ role, assignedBranchId: membership.branchId, gymId, requestedBranchId, multiBranch: entitlements.features.multiBranch, consolidated: entitlements.features.consolidatedAnalytics, readOnly })) {
    throw new EntitlementError("This branch selection is not authorized. Select an available location.", "BRANCH_FORBIDDEN");
  }
  if (requestedBranchId !== "all" && !mongoose.isObjectIdOrHexString(requestedBranchId)) throw new EntitlementError("Invalid branch selection.", "BRANCH_FORBIDDEN");
  if (requestedBranchId !== "all" && requestedBranchId !== String(gymId)) {
    const branch = await Branch.findOne({ _id: requestedBranchId, gymId }).lean();
    if (!branch || (branch.status !== "active" && (role !== "gym_owner" || request.method !== "GET"))) throw new EntitlementError("This branch is unavailable.", "BRANCH_FORBIDDEN");
  }
  if (["/api/reports", "/api/dashboard/owner", "/api/payment-reports"].includes(path) && requestedBranchId !== String(gymId) && requestedBranchId !== "all" && !entitlements.features.branchReports) throw new EntitlementError("Branch reporting is unavailable on your plan.", "FEATURE_UNAVAILABLE");
  const branchId = requestedBranchId === "all" ? "all" : new mongoose.Types.ObjectId(requestedBranchId);
  return { ...context, entitlements, branchId, scope: branchScope(gymId, branchId) };
}

export async function listGymBranches(gymId) {
  const branches = await Branch.find({ gymId }).sort({ isDefault: -1, createdAt: 1 }).lean();
  if (!branches.some((branch) => String(branch._id) === String(gymId))) branches.unshift({ _id: gymId, gymId, name: "Main branch", address: "", status: "active", isDefault: true });
  return branches;
}
