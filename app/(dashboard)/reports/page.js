import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import ReportsManager from "../../../components/reports/reports-manager";

export default async function ReportsPage() {
  await requirePublicGymOperationalPage();
  return <ReportsManager />;
}
