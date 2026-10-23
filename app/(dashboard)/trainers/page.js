import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import TrainerManager from "../../../components/trainers/trainer-manager";
export default async function TrainersPage() {
  await requirePublicGymOperationalPage(); return <TrainerManager />; }
