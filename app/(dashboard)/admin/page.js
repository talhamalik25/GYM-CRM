import { redirect } from "next/navigation";
import AdminOverview from "../../../components/admin/admin-overview";
import PageHeading from "../../../components/ui/page-heading";
import { getCurrentUser } from "../../../lib/auth";
import { isSuperadmin } from "../../../lib/adminUserRules.js";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperadmin(user)) redirect("/dashboard");

  return <>
    <PageHeading eyebrow="SUPERADMIN" title="Platform overview" description="A current snapshot of Fitivo Gym workspaces and user accounts." />
    <AdminOverview />
  </>;
}
