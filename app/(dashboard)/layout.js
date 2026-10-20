import DashboardShell from "../../components/layout/dashboard-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import GymMembership from "../../models/GymMembership";
import { isSuperadmin } from "../../lib/adminUserRules.js";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const canManageStaff = user.role === "staff" && Boolean(await GymMembership.exists({ userId: user._id, role: "gym_owner", status: "active" }));
  return <DashboardShell isSuperadmin={isSuperadmin(user)} canManageStaff={canManageStaff}>{children}</DashboardShell>;
}
