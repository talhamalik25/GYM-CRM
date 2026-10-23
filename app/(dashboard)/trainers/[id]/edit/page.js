import { requirePublicGymOperationalPage } from "../../../../../lib/ownerPageAccess.js";
import TrainerForm from "../../../../../components/trainers/trainer-form";
import { gymToday } from "../../../../../lib/subscriptionRules.js";
export default async function EditTrainerPage({ params }) {
  await requirePublicGymOperationalPage(); const { id } = await params; return <TrainerForm trainerId={id} initialDate={gymToday()} />; }
