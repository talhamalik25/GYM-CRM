import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import StaffManager from "../../../components/staff/staff-manager";
export default async function StaffPage() {
  await requirePublicGymOperationalPage(); return <StaffManager />; }
