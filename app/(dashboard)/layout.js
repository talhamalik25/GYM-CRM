import DashboardShell from "../../components/layout/dashboard-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import GymMembership from "../../models/GymMembership";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const canManageStaff = user.role === "staff" && Boolean(await GymMembership.exists({ userId: user._id, role: "gym_owner", status: "active" }));
  return <DashboardShell isSuperadmin={user.role === "superadmin" || user.role === "platform_super_admin"} canManageStaff={canManageStaff}>{children}</DashboardShell>;
}
