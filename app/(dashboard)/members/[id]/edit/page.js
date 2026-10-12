import MemberForm from '../../../../../components/members/member-form';

export default async function EditMemberPage({ params }) {
  const { id } = await params;
  return <MemberForm memberId={id} />;
}

