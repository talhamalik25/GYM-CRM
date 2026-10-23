import { requirePublicGymOperationalPage } from "../../../../lib/ownerPageAccess.js";
import TrainerDetail from "../../../../components/trainers/trainer-detail";
export default async function TrainerPage({ params }) {
  await requirePublicGymOperationalPage(); const { id } = await params; return <TrainerDetail trainerId={id} />; }
