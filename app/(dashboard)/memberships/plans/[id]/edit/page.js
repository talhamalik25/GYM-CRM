import { requirePublicGymOperationalPage } from "../../../../../../lib/ownerPageAccess.js";
import { redirect } from "next/navigation";

export default async function EditMembershipPlanPage() {
  await requirePublicGymOperationalPage();
  redirect("/memberships");
}
