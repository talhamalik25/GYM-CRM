import { requirePublicGymOperationalPage } from "../../../../lib/ownerPageAccess.js";
import MemberForm from '../../../../components/members/member-form';
export default async function NewMemberPage() {
  await requirePublicGymOperationalPage(); return <MemberForm/>; }
