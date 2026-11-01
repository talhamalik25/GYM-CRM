import { redirect } from "next/navigation.js";
import { getCurrentUser } from "./auth.js";
import GymMembership from "../models/GymMembership.js";
import Gym from "../models/Gym.js";
import { publicGymOperationalRedirect } from "./publicTrialAccess.js";

// Run in each operational page, not just a reusable layout. Layouts can remain
// mounted across navigation; API guards independently recheck every request.
export async function requirePublicGymOperationalPage({ allowedRoles } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "staff") { if (allowedRoles) redirect("/dashboard"); return; }
  const memberships = await GymMembership.find({ userId: user._id, status: "active" }).lean();
  if (memberships.length !== 1) { if (allowedRoles) redirect("/dashboard"); return; }
  const membership = memberships[0];
  if (allowedRoles && !allowedRoles.includes(membership.role)) redirect("/dashboard");
  const gym = await Gym.findById(membership.gymId).lean();
  const destination = publicGymOperationalRedirect(gym, membership.role);
  if (destination) redirect(destination);
}
