import TrainerForm from "../../../../../components/trainers/trainer-form";
export default async function EditTrainerPage({ params }) { const { id } = await params; return <TrainerForm trainerId={id} />; }
