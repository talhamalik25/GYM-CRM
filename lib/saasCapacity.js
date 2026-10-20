import { getRequestGymId, getRequestTenantContext } from "./auth.js";
import { errorResponse } from "./planApiResponse.js";

export async function enforceSaaSCapacity(request, feature, Model) {
  const context = getRequestTenantContext(request);
  const subscription = context?.gym?.saasSubscription;
  if (!subscription || !["active", "trialing"].includes(subscription.status)) return null;
  if (subscription.status === "trialing" && (!subscription.trialEndsAt || new Date(subscription.trialEndsAt) <= new Date())) return null;
  const limit = subscription.planSnapshot?.limits?.[feature];
  if (!Number.isSafeInteger(limit) || limit < 0) return null;
  const count = await Model.countDocuments({ gymId: getRequestGymId(request) });
  if (count < limit) return null;
  const resource = feature === "members" ? "member" : "trainer";
  return errorResponse(`This Gym has reached its SaaS plan limit of ${limit} ${resource}${limit === 1 ? "" : "s"}.`, 409, { limit: "Upgrade the Gym's Fitivo plan to add more." });
}
