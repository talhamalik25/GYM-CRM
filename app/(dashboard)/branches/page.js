import BranchManager from "../../../components/branches/branch-manager.js";
import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
export default async function BranchesPage() {
  await requirePublicGymOperationalPage();
  return <BranchManager />;
}
