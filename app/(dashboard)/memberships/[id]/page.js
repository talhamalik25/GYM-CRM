import MembershipRecord from '../../../../components/memberships/membership-record';
export default async function MembershipDetailPage({ params }) { const { id } = await params; return <MembershipRecord id={id} />; }
