export const GYM_ROLES = Object.freeze(["gym_owner", "gym_admin", "trainer"]);

export function authorizeGymMembership({ user, membership, gym, allowedRoles = GYM_ROLES }) {
  if (!user || user.isActive === false) return { ok: false, status: 401, error: "Authentication is required." };
  if (!membership || String(membership.userId) !== String(user._id)) {
    return { ok: false, status: 403, error: "An authorized gym membership is required." };
  }
  if (membership.status !== "active" || !allowedRoles.includes(membership.role)) {
    return { ok: false, status: 403, error: "You do not have permission to access this gym." };
  }
  if (!gym || String(gym._id) !== String(membership.gymId) || gym.status !== "active") {
    return { ok: false, status: 403, error: "This gym is unavailable." };
  }
  return { ok: true, user, membership, gym, gymId: membership.gymId, role: membership.role };
}
