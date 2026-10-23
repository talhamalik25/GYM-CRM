import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import AttendanceManager from "../../../components/attendance/attendance-manager";

export default async function AttendancePage() {
  await requirePublicGymOperationalPage();
  return <AttendanceManager />;
}
