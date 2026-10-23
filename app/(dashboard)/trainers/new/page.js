import { requirePublicGymOperationalPage } from "../../../../lib/ownerPageAccess.js";
import TrainerForm from "../../../../components/trainers/trainer-form";
import { gymToday } from "../../../../lib/subscriptionRules.js";
export default async function NewTrainerPage() {
  await requirePublicGymOperationalPage(); return <TrainerForm initialDate={gymToday()} />; }
