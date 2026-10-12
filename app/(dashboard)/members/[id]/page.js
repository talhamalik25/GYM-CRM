import MemberDetail from "../../../../components/members/member-detail";

export default async function MemberDetailPage({ params }) {
  const { id } = await params;
  return <MemberDetail memberId={id} />;
}
