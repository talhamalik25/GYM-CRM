import DashboardAttendanceData from "../../../components/dashboard/dashboard-attendance-data";
import { dashboardMockData } from "../../../lib/mockData";

export default function DashboardPage() {
  return <DashboardAttendanceData mockData={dashboardMockData} />;
}
