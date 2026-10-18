import { NextResponse } from "next/server";
import connectToDatabase from "./db";
import { getAuthenticatedUserFromRequest } from "./auth";
import Gym from "../models/Gym";
import GymMembership from "../models/GymMembership";
import { authorizeGymMembership } from "./tenantAuthorization";

function contextError(status, message) {
  return NextResponse.json({ success: false, error: { message } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Resolve a single authorized gym from the verified session and an explicit active membership. */
export async function resolveTenantContext(request, { allowedRoles = ["gym_owner", "gym_admin"] } = {}) {
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
    const decision = authorizeGymMembership({ user, membership, gym, allowedRoles });
    if (!decision.ok) return { error: contextError(decision.status, decision.error) };
    return { context: decision };
  } catch {
    return { error: contextError(503, "Tenant authorization is temporarily unavailable.") };
  }
}
