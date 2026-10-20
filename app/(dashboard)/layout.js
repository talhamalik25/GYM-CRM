import DashboardShell from "../../components/layout/dashboard-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import GymMembership from "../../models/GymMembership";
import { isSuperadmin } from "../../lib/adminUserRules.js";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const memberships = user.role === "staff" ? await GymMembership.find({ userId: user._id, status: "active" }).select("role").lean() : [];
  const canManageStaff = memberships.some(({ role }) => role === "gym_owner");
  const isTrainer = memberships.length === 1 && memberships[0].role === "trainer";
  return <DashboardShell isSuperadmin={isSuperadmin(user)} canManageStaff={canManageStaff} isTrainer={isTrainer}>{children}</DashboardShell>;
}
