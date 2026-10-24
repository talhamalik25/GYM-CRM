import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import EntitledReports from "../../../components/reports/entitled-reports";

export default async function ReportsPage() {
  await requirePublicGymOperationalPage();
  return <EntitledReports />;
}
