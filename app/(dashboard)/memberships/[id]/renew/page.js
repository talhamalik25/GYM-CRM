import { notFound } from 'next/navigation';
import MembershipRenewalForm from '../../../../../components/memberships/membership-renewal-form';
import { getMemberById } from '../../../../../lib/mock-members';
import { getMembershipById, membershipPlans } from '../../../../../lib/mock-memberships';
export default async function RenewMembershipPage({params}){const{id}=await params;const membership=getMembershipById(id);if(!membership)notFound();const member=getMemberById(membership.memberId);if(!member)notFound();const plans=membershipPlans.filter(plan=>plan.status==='Active'||plan.id===membership.planId);return <MembershipRenewalForm membership={membership} member={member} plans={plans}/>;}
