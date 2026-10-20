export const GYM_ROLES = Object.freeze(["gym_owner", "gym_admin", "trainer"]);

export function isSaaSAccessAllowed(subscription, now = new Date(), required = false) {
  if (!subscription) return !required; // Legacy gyms remain accessible; newly provisioned gyms can require a plan.
  const startsAt = subscription.status === "trialing" ? subscription.trialStartedAt : subscription.periodStart;
  if (startsAt && (!Number.isFinite(new Date(startsAt).getTime()) || new Date(startsAt) > now)) return false;
  if (subscription.status === "trialing") return Boolean(subscription.trialEndsAt && Number.isFinite(new Date(subscription.trialEndsAt).getTime()) && new Date(subscription.trialEndsAt) > now);
  if (subscription.status === "active") return Boolean(subscription.periodEnd && Number.isFinite(new Date(subscription.periodEnd).getTime()) && new Date(subscription.periodEnd) > now);
  return false;
}

export function authorizeGymMembership({ user, membership, gym, requestedGymId, allowedRoles = GYM_ROLES, allowSaaSInactive = false, allowSuspendedGym = false }) {
  if (!user || user.isActive === false) return { ok: false, status: 401, error: "Authentication is required." };
  if (!membership || String(membership.userId) !== String(user._id)) {
    return { ok: false, status: 403, error: "An authorized gym membership is required." };
  }
  if (requestedGymId && String(requestedGymId) !== String(membership.gymId)) {
    return { ok: false, status: 403, error: "The requested gym is not authorized." };
  }
  if (membership.status !== "active" || !allowedRoles.includes(membership.role)) {
    return { ok: false, status: 403, error: "You do not have permission to access this gym." };
  }
  if (!gym || String(gym._id) !== String(membership.gymId) || (gym.status !== "active" && !(allowSuspendedGym && gym.status === "suspended"))) {
    return { ok: false, status: 403, error: "This gym is unavailable." };
  }
  if (!allowSaaSInactive && !isSaaSAccessAllowed(gym.saasSubscription, new Date(), gym.saasAccessRequired === true)) {
    return { ok: false, status: 403, error: "This Gym's Fitivo subscription is inactive or has expired. Contact the platform administrator." };
  }
  return { ok: true, user, membership, gym, gymId: membership.gymId, role: membership.role };
}
