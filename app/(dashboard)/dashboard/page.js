import DashboardOverview from "../../../components/dashboard/dashboard-overview";
import { dashboardMockData } from "../../../lib/mockData";

export default function DashboardPage() {
  return <DashboardOverview data={dashboardMockData} />;
}
