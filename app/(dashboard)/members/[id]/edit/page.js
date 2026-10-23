import { requirePublicGymOperationalPage } from "../../../../../lib/ownerPageAccess.js";
import MemberForm from '../../../../../components/members/member-form';

export default async function EditMemberPage({ params }) {
  await requirePublicGymOperationalPage();
  const { id } = await params;
  return <MemberForm memberId={id} />;
}

