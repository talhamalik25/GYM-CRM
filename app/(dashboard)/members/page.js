import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import MemberManager from '../../../components/members/member-manager';
export default async function MembersPage() {
  await requirePublicGymOperationalPage(); return <MemberManager/>; }
