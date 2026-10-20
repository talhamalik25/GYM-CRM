import OwnerDashboard from "../../../components/dashboard/owner-dashboard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth";
import { isSuperadmin } from "../../../lib/adminUserRules.js";
import GymMembership from "../../../models/GymMembership.js";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (isSuperadmin(user)) redirect("/admin");
  if (user) {
    const activeMemberships = await GymMembership.find({ userId: user._id, status: "active" }).select("role").lean();
    if (activeMemberships.length === 1 && activeMemberships[0].role === "trainer") redirect("/trainer");
  }
  return <OwnerDashboard />;
}
