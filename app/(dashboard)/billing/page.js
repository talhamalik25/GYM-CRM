import { redirect } from "next/navigation";
import OwnerBilling from "../../../components/billing/owner-billing";
import { getCurrentUser } from "../../../lib/auth";
import GymMembership from "../../../models/GymMembership";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ownerMembership = await GymMembership.exists({ userId: user._id, role: "gym_owner", status: "active" });
  if (!ownerMembership) redirect("/dashboard");
  return <OwnerBilling />;
}
