import { requirePublicGymOperationalPage } from "../../../../../lib/ownerPageAccess.js";
import { redirect } from "next/navigation";

export default async function NewMembershipPlanPage() {
  await requirePublicGymOperationalPage();
  redirect("/memberships");
}
