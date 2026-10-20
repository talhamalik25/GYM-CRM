import connectToDatabase from "../../../../lib/db.js";
import { requireSuperadminUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import Gym from "../../../../models/Gym.js";
import User from "../../../../models/User.js";
import GymMembership from "../../../../models/GymMembership.js";
import PlatformInvoice from "../../../../models/PlatformInvoice.js";
import { buildPlatformAnalytics, getPlatformAnalyticsMonths } from "../../../../lib/adminAnalyticsRules.js";

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  try {
    await connectToDatabase();
    const now = new Date();
    const monthWindows = getPlatformAnalyticsMonths(now);
    const first = monthWindows[0];
    const end = monthWindows[monthWindows.length - 1].end;
    const [gyms, activeGyms, suspendedGyms, userAccounts, activeUserAccounts, inactiveUserAccounts, platformSuperadmins, openInvoices, activeOwnerUserIds, restrictedSaaSGyms, gymAnalytics, invoiceAnalytics] = await Promise.all([
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
      Gym.aggregate([{ $facet: {
        gymStatuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        saasStatuses: [
          { $group: { _id: { $switch: { branches: [
            { case: { $eq: ["$saasSubscription.status", "trialing"] }, then: { $cond: [{ $gt: ["$saasSubscription.trialEndsAt", now] }, "trialing", "expired"] } },
            { case: { $eq: ["$saasSubscription.status", "active"] }, then: { $cond: [{ $gt: ["$saasSubscription.periodEnd", now] }, "active", "expired"] } },
            { case: { $eq: ["$saasSubscription.status", "past_due"] }, then: "past_due" },
            { case: { $eq: ["$saasSubscription.status", "expired"] }, then: "expired" },
            { case: { $eq: ["$saasSubscription.status", "cancelled"] }, then: "cancelled" },
          ], default: "unconfigured" } }, count: { $sum: 1 } } },
        ],
        onboarding: [
          { $match: { createdAt: { $gte: first.start, $lt: end, $lte: now } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } },
        ],
      } }]),
      PlatformInvoice.aggregate([{ $facet: {
        invoiced: [
          { $match: { status: { $in: ["open", "paid"] }, issuedAt: { $gte: first.start, $lt: end, $lte: now } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$issuedAt", timezone: "UTC" } }, amount: { $sum: "$amountDue" } } },
        ],
        collected: [
          { $match: { status: "paid", paidAt: { $gte: first.start, $lt: end, $lte: now } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt", timezone: "UTC" } }, amount: { $sum: "$amountDue" } } },
        ],
      } }]),
    ]);
    const ownerGymIds = activeOwnerUserIds.length ? await GymMembership.distinct("gymId", {
      role: "gym_owner", status: "active", userId: { $in: activeOwnerUserIds },
    }) : [];
    const gymsWithoutOwner = await Gym.countDocuments({ _id: { $nin: ownerGymIds } });

    const gymAnalyticsResult = gymAnalytics[0] || {};
    const invoiceAnalyticsResult = invoiceAnalytics[0] || {};
    const invoiceMonths = new Map();
    for (const item of invoiceAnalyticsResult.invoiced || []) invoiceMonths.set(item._id, { _id: item._id, invoiced: item.amount, collected: 0 });
    for (const item of invoiceAnalyticsResult.collected || []) invoiceMonths.set(item._id, { ...invoiceMonths.get(item._id), _id: item._id, collected: item.amount });

    return successResponse({
      gyms: { total: gyms, active: activeGyms, suspended: suspendedGyms },
      userAccounts: { total: userAccounts, active: activeUserAccounts, inactive: inactiveUserAccounts, platformSuperadmins },
      operations: { gymsWithoutOwner, openInvoices, restrictedSaaSGyms },
      analytics: buildPlatformAnalytics({
        monthWindows,
        gymStatuses: gymAnalyticsResult.gymStatuses || [],
        saasStatuses: gymAnalyticsResult.saasStatuses || [],
        onboarding: gymAnalyticsResult.onboarding || [],
        invoiceTrends: [...invoiceMonths.values()],
      }),
    });
  } catch {
    console.error("Admin platform overview could not be loaded.");
    return errorResponse("Could not load platform overview. Please try again.", 503);
  }
}
