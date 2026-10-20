import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth.js";
import GymMembership from "../../../models/GymMembership.js";
import TrainerWorkspace from "../../../components/trainers/trainer-workspace.js";

export default async function TrainerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await GymMembership.findOne({ userId: user._id, role: "trainer", status: "active" }).lean();
  if (!membership) redirect("/dashboard");
  return <TrainerWorkspace />;
}
