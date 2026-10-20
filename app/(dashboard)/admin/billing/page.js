import { redirect } from "next/navigation";
import AdminBillingManager from "../../../../components/admin/admin-billing-manager";
import { getCurrentUser } from "../../../../lib/auth";
import { isSuperadmin } from "../../../../lib/adminUserRules.js";

export default async function AdminBillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperadmin(user)) redirect("/dashboard");
  return <AdminBillingManager />;
}
