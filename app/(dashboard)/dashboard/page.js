import OwnerDashboard from "../../../components/dashboard/owner-dashboard";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth";
import { isSuperadmin } from "../../../lib/adminUserRules.js";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (isSuperadmin(user)) redirect("/admin");
  return <OwnerDashboard />;
}
