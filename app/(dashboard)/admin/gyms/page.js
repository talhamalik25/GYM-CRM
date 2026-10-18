import { redirect } from "next/navigation";
import AdminGymManager from "../../../../components/admin/admin-gym-manager";
import PageHeading from "../../../../components/ui/page-heading";
import { getCurrentUser } from "../../../../lib/auth";
import { isSuperadmin } from "../../../../lib/adminUserRules.js";

export default async function AdminGymsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperadmin(user)) redirect("/dashboard");

  return <>
    <PageHeading eyebrow="SUPERADMIN" title="Gym accounts" description="Review gym ownership and workspace status. Suspending a gym blocks its tenant access." />
    <AdminGymManager />
  </>;
}
