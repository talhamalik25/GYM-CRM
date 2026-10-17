import { redirect } from "next/navigation";
import PageHeading from "../../../../components/ui/page-heading";
import AdminUserManager from "../../../../components/admin/admin-user-manager";
import { getCurrentUser } from "../../../../lib/auth";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "superadmin") redirect("/dashboard");

  return <>
    <PageHeading eyebrow="SUPERADMIN" title="User accounts" description="Create staff accounts for people who need access to this gym workspace." />
    <AdminUserManager />
  </>;
}
