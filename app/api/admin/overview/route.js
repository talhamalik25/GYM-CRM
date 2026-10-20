import connectToDatabase from "../../../../lib/db.js";
import { requireSuperadminUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import Gym from "../../../../models/Gym.js";
import User from "../../../../models/User.js";
import GymMembership from "../../../../models/GymMembership.js";
import PlatformInvoice from "../../../../models/PlatformInvoice.js";

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  try {
    await connectToDatabase();
    const now = new Date();
    const [gyms, activeGyms, suspendedGyms, userAccounts, activeUserAccounts, inactiveUserAccounts, platformSuperadmins, openInvoices, activeOwnerUserIds, restrictedSaaSGyms] = await Promise.all([
      Gym.countDocuments({}),
      Gym.countDocuments({ status: "active" }),
      Gym.countDocuments({ status: "suspended" }),
      User.countDocuments({}),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: { $in: ["superadmin", "platform_super_admin"] } }),
      PlatformInvoice.countDocuments({ status: "open" }),
      User.distinct("_id", { role: "staff", isActive: { $ne: false } }),
      Gym.countDocuments({ $or: [
        { "saasSubscription.status": { $in: ["past_due", "expired", "cancelled"] } },
        { "saasSubscription.status": "trialing", $or: [{ "saasSubscription.trialEndsAt": { $lte: now } }, { "saasSubscription.trialEndsAt": null }] },
        { "saasSubscription.status": "active", $or: [{ "saasSubscription.periodEnd": { $lte: now } }, { "saasSubscription.periodEnd": null }] },
      ] }),
    ]);
    const ownerGymIds = activeOwnerUserIds.length ? await GymMembership.distinct("gymId", {
      role: "gym_owner", status: "active", userId: { $in: activeOwnerUserIds },
    }) : [];
    const gymsWithoutOwner = await Gym.countDocuments({ _id: { $nin: ownerGymIds } });

    return successResponse({
      gyms: { total: gyms, active: activeGyms, suspended: suspendedGyms },
      userAccounts: { total: userAccounts, active: activeUserAccounts, inactive: inactiveUserAccounts, platformSuperadmins },
      operations: { gymsWithoutOwner, openInvoices, restrictedSaaSGyms },
    });
  } catch {
    console.error("Admin platform overview could not be loaded.");
    return errorResponse("Could not load platform overview. Please try again.", 503);
  }
}
