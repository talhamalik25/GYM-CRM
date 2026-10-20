import { NextResponse } from "next/server.js";
import connectToDatabase from "./db.js";
import { getAuthenticatedUserFromRequest } from "./auth.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import { authorizeGymMembership } from "./tenantAuthorization.js";

function contextError(status, message) {
  return NextResponse.json({ success: false, error: { message } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Resolve a single authorized gym from the verified session and an explicit active membership. */
export async function resolveTenantContext(request, { allowedRoles = ["gym_owner", "gym_admin"], allowSaaSInactive = false, allowSuspendedGym = false } = {}) {
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) return { error: contextError(401, "Authentication is required.") };

  try {
    await connectToDatabase();
    const memberships = await GymMembership.find({ userId: user._id, status: "active" }).lean();
    if (memberships.length !== 1) {
      return { error: contextError(403, "Select an account with exactly one active gym membership.") };
    }
    const membership = memberships[0];
    const gym = await Gym.findById(membership.gymId).lean();
    const decision = authorizeGymMembership({ user, membership, gym, allowedRoles, allowSaaSInactive, allowSuspendedGym });
    if (!decision.ok) return { error: contextError(decision.status, decision.error) };
    return { context: decision };
  } catch {
    return { error: contextError(503, "Tenant authorization is temporarily unavailable.") };
  }
}
