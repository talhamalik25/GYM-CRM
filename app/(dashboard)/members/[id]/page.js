import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusBadge from '../../../../components/ui/status-badge';
import { ActivityTimeline, AttendanceSummary, FitnessOverview, MembershipSummary, PaymentSummary, PersonalInformation, WorkoutSummary } from '../../../../components/members/member-profile';
import { getMemberById } from '../../../../lib/mock-members';
import MemberAvatar from '../../../../components/members/member-avatar';

export default async function MemberDetailPage({ params }) {
  const { id } = await params;
  const member = getMemberById(id);
  if (!member) notFound();

  return <div className="member-detail-page"><div className="member-detail-heading"><div className="member-heading-person"><MemberAvatar member={member}/><div><div className="member-detail-eyebrow">MEMBER PROFILE <span>·</span> {member.id.toUpperCase()}</div><h1>{member.name}</h1><div className="member-heading-meta"><span>Joined {new Date(`${member.membership.startDate}T12:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</span><StatusBadge>{member.membership.status}</StatusBadge></div></div></div><div className="member-detail-actions"><Link className="button button-secondary" href={`/members/${member.id}/edit`}>Edit member</Link><details className="member-detail-more"><summary aria-label="More member actions">···</summary><div><Link href={`/members/${member.id}/edit`}>Edit profile</Link><Link href="/payments">Record payment</Link><button type="button">Deactivate member</button></div></details></div></div>
  <div className="member-profile-columns"><div className="member-profile-main"><PersonalInformation member={member}/><FitnessOverview member={member}/><AttendanceSummary member={member}/><PaymentSummary member={member}/><WorkoutSummary member={member}/></div><aside className="member-profile-aside"><MembershipSummary member={member}/><ActivityTimeline activities={member.activityTimeline}/></aside></div></div>;
}


