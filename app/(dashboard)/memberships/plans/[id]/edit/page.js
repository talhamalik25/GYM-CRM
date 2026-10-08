import { notFound } from 'next/navigation';
import MembershipPlanForm from '../../../../../../components/memberships/membership-plan-form';
import { getMembershipPlanById } from '../../../../../../lib/mock-memberships';
export default async function EditPlanPage({params}){const{id}=await params;const plan=getMembershipPlanById(id);if(!plan)notFound();return <MembershipPlanForm plan={plan}/>;}
