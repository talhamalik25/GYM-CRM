import { redirect } from "next/navigation.js";
import { getCurrentUser } from "./auth.js";
import GymMembership from "../models/GymMembership.js";
import Gym from "../models/Gym.js";
import { publicGymOperationalRedirect } from "./publicTrialAccess.js";

// Run in each operational page, not just a reusable layout. Layouts can remain
// mounted across navigation; API guards independently recheck every request.
export async function requirePublicGymOperationalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "staff") return;
  const memberships = await GymMembership.find({ userId: user._id, status: "active" }).lean();
  if (memberships.length !== 1) return; // Existing account/assignment policy stays in the API guards.
  const membership = memberships[0];
  const gym = await Gym.findById(membership.gymId).lean();
  const destination = publicGymOperationalRedirect(gym, membership.role);
  if (destination) redirect(destination);
}
