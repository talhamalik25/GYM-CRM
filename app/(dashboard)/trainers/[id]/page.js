import TrainerDetail from "../../../../components/trainers/trainer-detail";
export default async function TrainerPage({ params }) { const { id } = await params; return <TrainerDetail trainerId={id} />; }
