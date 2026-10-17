import TrainerForm from "../../../../../components/trainers/trainer-form";
import { gymToday } from "../../../../../lib/subscriptionRules.js";
export default async function EditTrainerPage({ params }) { const { id } = await params; return <TrainerForm trainerId={id} initialDate={gymToday()} />; }
