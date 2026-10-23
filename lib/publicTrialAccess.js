import { isSaaSAccessAllowed } from "./tenantAuthorization.js";

// Only new public registrations participate. No fallback based on creation date,
// missing subscriptions, or other attributes that could select an existing gym.
export function publicGymOperationalRedirect(gym, role, now = new Date()) {
  if (gym?.publicTrial?.version !== 1) return null;
  if (gym.status === "active" && isSaaSAccessAllowed(gym.saasSubscription, now, true)) return null;
  return role === "gym_owner" ? "/billing" : "/profile";
}

export function trialSummary(gym, now = new Date()) {
  const subscription = gym.saasSubscription;
  const startedAt = subscription?.trialStartedAt || gym.publicTrial?.startedAt;
  const endsAt = subscription?.trialEndsAt || gym.publicTrial?.endsAt;
  if (!startedAt || !endsAt) return null;
  const remainingMs = Math.max(0, new Date(endsAt).getTime() - now.getTime());
  const status = subscription?.status === "active" ? "converted" : remainingMs === 0 ? "expired" : subscription?.status === "trialing" ? "trialing" : "ended";
  return {
    startedAt, endsAt, remainingDays: status === "trialing" ? Math.ceil(remainingMs / 86400000) : 0, status,
  };
}
