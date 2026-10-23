import { requirePublicGymOperationalPage } from "../../../../lib/ownerPageAccess.js";
import MemberDetail from "../../../../components/members/member-detail";

export default async function MemberDetailPage({ params }) {
  await requirePublicGymOperationalPage();
  const { id } = await params;
  return <MemberDetail memberId={id} />;
}
