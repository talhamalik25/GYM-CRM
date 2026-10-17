import TrainerForm from "../../../../components/trainers/trainer-form";
import { gymToday } from "../../../../lib/subscriptionRules.js";
export default function NewTrainerPage() { return <TrainerForm initialDate={gymToday()} />; }
