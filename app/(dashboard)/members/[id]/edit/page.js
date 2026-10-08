import { notFound } from 'next/navigation';
import MemberForm from '../../../../../components/members/member-form';
import { getMemberById } from '../../../../../lib/mock-members';
export default async function EditMemberPage({ params }) { const { id } = await params; const member = getMemberById(id); if (!member) notFound(); return <MemberForm member={member}/>; }

