import { requirePublicGymOperationalPage } from "../../../../../lib/ownerPageAccess.js";
import MembershipRecord from '../../../../../components/memberships/membership-record';
export default async function RenewMembershipPage({ params }) {
  await requirePublicGymOperationalPage(); const { id } = await params; return <MembershipRecord id={id} renewal />; }
