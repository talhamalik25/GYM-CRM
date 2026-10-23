import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import OwnerDashboard from "../../../components/dashboard/owner-dashboard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth";
import { isSuperadmin } from "../../../lib/adminUserRules.js";
import GymMembership from "../../../models/GymMembership.js";
import Gym from "../../../models/Gym.js";
import TrialCountdown from "../../../components/billing/trial-countdown";

export default async function DashboardPage() {
  await requirePublicGymOperationalPage();
  const user = await getCurrentUser();
  if (isSuperadmin(user)) redirect("/admin");
  let trial = null;
  if (user) {
    const activeMemberships = await GymMembership.find({ userId: user._id, status: "active" }).select("role gymId").lean();
    if (activeMemberships.length === 1 && activeMemberships[0].role === "trainer") redirect("/trainer");
    if (activeMemberships.length === 1 && activeMemberships[0].role === "gym_owner") {
      const gym = await Gym.findById(activeMemberships[0].gymId).lean();
      if (gym?.publicTrial?.version === 1 && gym.saasSubscription?.status === "trialing") trial = gym.saasSubscription;
    }
  }
  return <>{trial && <TrialCountdown endsAt={trial.trialEndsAt.toISOString()} serverNow={new Date().toISOString()} />}<OwnerDashboard /></>;
}
