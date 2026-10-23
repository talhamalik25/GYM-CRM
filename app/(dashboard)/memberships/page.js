import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import MembershipManager from '../../../components/memberships/membership-manager';

export default async function MembershipsPage() {
  await requirePublicGymOperationalPage();
  return <MembershipManager />;
}
