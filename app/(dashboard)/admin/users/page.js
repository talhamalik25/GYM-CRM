import { redirect } from "next/navigation";
import PageHeading from "../../../../components/ui/page-heading";
import AdminUserManager from "../../../../components/admin/admin-user-manager";
import { getCurrentUser } from "../../../../lib/auth";
import { isSuperadmin } from "../../../../lib/adminUserRules.js";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperadmin(user)) redirect("/dashboard");

  return <>
    <PageHeading eyebrow="SUPERADMIN" title="User accounts" description="Create staff accounts for people who need access to this gym workspace." />
    <AdminUserManager />
  </>;
}
