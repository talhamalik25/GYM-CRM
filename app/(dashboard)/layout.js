import DashboardShell from "../../components/layout/dashboard-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DashboardShell isSuperadmin={user.role === "superadmin"}>{children}</DashboardShell>;
}
