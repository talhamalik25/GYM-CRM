import { redirect } from "next/navigation";
import AdminGymDetails from "../../../../../components/admin/admin-gym-details";
import { getCurrentUser } from "../../../../../lib/auth";
import { isSuperadmin } from "../../../../../lib/adminUserRules.js";

export default async function AdminGymDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperadmin(user)) redirect("/dashboard");
  const { id } = await params;

  return <AdminGymDetails gymId={id} />;
}
