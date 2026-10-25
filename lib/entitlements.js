import { NextRequest } from "next/server.js";
import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import Trainer from "../models/Trainer.js";
import GymMembership from "../models/GymMembership.js";
import Branch from "../models/Branch.js";
import { snapshotEntitlements, exceededLimits } from "./saasPlanRules.js";
import { isSaaSAccessAllowed } from "./tenantAuthorization.js";

export class EntitlementError extends Error {
  constructor(message, code = "FEATURE_UNAVAILABLE", status = 403, details = {}) {
    super(message); this.code = code; this.status = status; this.details = details;
  }
}
export function entitlementErrorResponse(error) {
  return Response.json({ success: false, error: { message: error.message, code: error.code, ...error.details } }, { status: error.status, headers: { "Cache-Control": "no-store" } });
}
export function gymEntitlements(gym, { requireActive = true } = {}) {
  if (!gym) throw new EntitlementError("Gym was not found.", "GYM_NOT_FOUND", 404);
  if (requireActive && (gym.status !== "active" || !isSaaSAccessAllowed(gym.saasSubscription, new Date(), gym.saasAccessRequired))) {
    throw new EntitlementError("Your Fitivo subscription is inactive or expired. Visit Plan & billing.", "SUBSCRIPTION_INACTIVE");
  }
  return snapshotEntitlements(gym.saasSubscription?.planSnapshot);
}
// Callers must derive gymId from a verified membership or a superadmin operation.
export async function getGymEntitlements(gymId, { session, requireActive = true } = {}) {
  return gymEntitlements(await Gym.findById(gymId).session(session || null).lean(), { requireActive });
}
export async function hasGymFeature(gymId, featureKey, options) {
  return (await getGymEntitlements(gymId, options)).features[featureKey] === true;
}
export async function assertGymFeature(gymId, featureKey, options) {
  if (!await hasGymFeature(gymId, featureKey, options)) throw new EntitlementError("This feature is unavailable on your plan. Visit Plan & billing to request an upgrade.", "FEATURE_UNAVAILABLE", 403, { feature: featureKey });
}
export async function getGymUsage(gymId, session) {
  // Sequential queries are intentional inside MongoDB transactions.
  const members = await Member.countDocuments({ gymId, isActive: { $ne: false } }).session(session || null);
  const trainers = await Trainer.countDocuments({ gymId, status: "active" }).session(session || null);
  const staff = await GymMembership.countDocuments({ gymId, status: "active", role: { $ne: "gym_owner" } }).session(session || null);
  const branches = 1 + await Branch.countDocuments({ gymId, isDefault: false, status: "active" }).session(session || null);
  return { members, trainers, staff, branches };
}
// Taking this write lock BEFORE reading usage serializes concurrent additions,
// reactivations, downgrades, and branch changes across all app instances.
export async function lockGym(gymId, session) {
  if (!session?.inTransaction()) throw new Error("A MongoDB transaction is required for capacity changes.");
  const gym = await Gym.findOneAndUpdate({ _id: gymId }, { $inc: { capacityVersion: 1 } }, { returnDocument: "after", session, timestamps: false }).lean();
  if (!gym) throw new EntitlementError("Gym was not found.", "GYM_NOT_FOUND", 404);
  return gym;
}
export async function assertGymLimit(gymId, resourceKey, { session, additional = 1 } = {}) {
  const gym = await lockGym(gymId, session);
  const entitlements = gymEntitlements(gym);
  const usage = await getGymUsage(gymId, session);
  const limit = entitlements.limits[resourceKey];
  if (limit != null && usage[resourceKey] + additional > limit) throw new EntitlementError(`Your plan allows ${limit} ${resourceKey}. Reduce usage or request an upgrade.`, "LIMIT_EXCEEDED", 409, { resource: resourceKey, limit, used: usage[resourceKey] });
}
export async function assertPlanFits(gymId, snapshot, session) {
  const target = snapshotEntitlements(snapshot);
  const exceeded = exceededLimits(target, await getGymUsage(gymId, session));
  if (target.limits.branches === 1) {
    const assigned = await GymMembership.countDocuments({ gymId, role: { $ne: "gym_owner" }, status: "active", branchId: { $nin: [null, gymId] } }).session(session || null);
    if (assigned) exceeded.push({ resource: "staff assigned to other branches", used: assigned, limit: 0 });
  }
  if (exceeded.length) throw new EntitlementError(`Resolve usage before changing plans: ${exceeded.map(({ resource, used, limit }) => `${resource} ${used}/${limit}`).join(", ")}. No records have been deleted.`, "DOWNGRADE_REMEDIATION_REQUIRED", 409, { exceeded });
}

// Used by simple member/trainer mutations; all Mongoose operations in the handler
// inherit this session. Complex billing/staff operations use their existing sessions.
mongoose.set("transactionAsyncLocalStorage", true);
export function withCapacityTransaction(handler, resource) {
  return async function capacityRoute(request, context) {
    const { requireApiUser, getRequestGymId } = await import("./auth.js");
    const denied = await requireApiUser(request);
    if (denied) return denied;
    try {
      return await mongoose.connection.transaction(async (session) => {
        const gymId = getRequestGymId(request);
        const gym = await lockGym(gymId, session);
        const entitlements = gymEntitlements(gym);
        const before = (await getGymUsage(gymId, session))[resource];
        // A transaction retry must read a fresh body.
        const response = await handler(new NextRequest(request.clone()), context);
        if (!response.ok) { const error = new Error("Mutation rejected"); error.response = response; throw error; }
        const after = (await getGymUsage(gymId, session))[resource];
        const limit = entitlements.limits[resource];
        if (after > before && limit != null && after > limit) throw new EntitlementError(`Your plan allows ${limit} ${resource}. Reduce usage or request an upgrade.`, "LIMIT_EXCEEDED", 409, { resource, limit, used: before });
        return response;
      });
    } catch (error) {
      if (error.response) return error.response;
      if (error instanceof EntitlementError) return entitlementErrorResponse(error);
      return Response.json({ success: false, error: { message: "Could not safely save this change. MongoDB transaction support is required." } }, { status: 503 });
    }
  };
}
