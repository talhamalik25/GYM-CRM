import StatusBadge from '../ui/status-badge';
import MemberAvatar from './member-avatar';


function DetailCard({ title, description, action, children, className = '' }) {
  return <section className={`detail-panel member-detail-card ${className}`}><div className="member-card-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>;
}

function DetailItem({ label, children }) {
  return <div className="member-detail-item"><small>{label}</small><strong>{children || '—'}</strong></div>;
}

export function PersonalInformation({ member }) {
  const info = member.personalInformation;
  return <DetailCard title="Personal information"><div className="member-profile-detail-grid"><DetailItem label="Full name">{member.name}</DetailItem><DetailItem label="Date of birth">{new Date(`${info.dateOfBirth}T12:00:00`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</DetailItem><DetailItem label="Gender">{info.gender}</DetailItem><DetailItem label="Phone"><a href={`tel:${info.phone}`}>{info.phone}</a></DetailItem><DetailItem label="Email"><a href={`mailto:${info.email}`}>{info.email}</a></DetailItem><DetailItem label="Address">{info.address}, {info.city}</DetailItem><DetailItem label="Emergency contact">{member.emergencyContact.name} · {member.emergencyContact.relationship}</DetailItem><DetailItem label="Emergency phone"><a href={`tel:${member.emergencyContact.phone}`}>{member.emergencyContact.phone}</a></DetailItem></div></DetailCard>;
}

export function MembershipSummary({ member }) {
  const plan = member.membership;
  const today = new Date('2026-10-06T12:00:00Z');
  const expiry = new Date(`${plan.expiryDate}T12:00:00Z`);
  const start = new Date(`${plan.startDate}T12:00:00Z`);
  const daysRemaining = Math.ceil((expiry - today) / 86400000);
  const totalDuration = Math.max(expiry - start, 1);
  const progress = Math.min(100, Math.max(0, Math.round(((today - start) / totalDuration) * 100)));
  const formatDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  return <DetailCard title="Membership" action={<StatusBadge>{plan.status}</StatusBadge>}><div className="member-plan-overview"><span className="member-plan-mark">✳</span><span><strong>{plan.plan}</strong><small>${plan.monthlyPrice} / month · {plan.durationMonths}-month term</small></span></div><div className="member-profile-detail-grid"><DetailItem label="Start date">{formatDate(plan.startDate)}</DetailItem><DetailItem label="Expiry date">{formatDate(plan.expiryDate)}</DetailItem><DetailItem label="Days remaining">{daysRemaining > 0 ? `${daysRemaining} days` : daysRemaining === 0 ? 'Expires today' : `${Math.abs(daysRemaining)} days ago`}</DetailItem><DetailItem label="Payment status"><StatusBadge>{plan.paymentStatus}</StatusBadge></DetailItem></div><div className="member-expiry-progress"><div><span>Membership progress</span><strong>{progress}%</strong></div><progress value={progress} max="100" aria-label={`Membership term ${progress}% elapsed`}/><small>{daysRemaining > 0 ? `${daysRemaining} days until renewal` : 'Renewal is due'}</small></div></DetailCard>;
}

export function FitnessOverview({ member }) {
  const fitness = member.fitnessInformation;
  return <DetailCard title="Fitness overview" description="Health and coaching details shared by the member."><div className="member-profile-detail-grid"><DetailItem label="Height">{fitness.heightCm} cm</DetailItem><DetailItem label="Weight">{fitness.weightKg} kg</DetailItem><DetailItem label="BMI">{fitness.bmi}</DetailItem><DetailItem label="Assigned trainer">{fitness.trainer}</DetailItem><DetailItem label="Fitness goal">{fitness.goal}</DetailItem><DetailItem label="Medical notes">{fitness.medicalNotes || 'No notes provided'}</DetailItem></div></DetailCard>;
}

export function AttendanceSummary({ member }) {
  const summary = member.attendanceSummary;
  return <DetailCard title="Attendance summary" description="Recent visits to your club."><div className="member-summary-metrics"><div><strong>{summary.totalVisits}</strong><small>Total visits</small></div><div><strong>{summary.present}</strong><small>Present this month</small></div><div><strong>{summary.absent}</strong><small>Missed check-ins</small></div><div><strong>{summary.percentage}%</strong><small>Attendance rate</small></div></div><div className="member-history-list">{member.attendanceHistory.length ? member.attendanceHistory.map((visit) => <div className="member-history-row" key={`${visit.date}-${visit.checkIn}`}><span className="member-history-icon attendance">✓</span><span><strong>{new Date(`${visit.date}T12:00:00`).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</strong><small>Checked in at {visit.checkIn}</small></span><StatusBadge>{visit.status}</StatusBadge></div>) : <p className="member-inline-empty">No attendance history recorded for this member.</p>}</div></DetailCard>;
}

export function PaymentSummary({ member }) {
  return <DetailCard title="Payment summary" description="Recent membership payments."><div className="member-summary-metrics member-payment-metrics"><div><strong>${member.paymentSummary.totalPaid.toLocaleString()}</strong><small>Total paid</small></div><div><strong>{member.paymentSummary.lastPaymentAmount}</strong><small>Last payment · {new Date(`${member.paymentSummary.lastPaymentDate}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small></div><div><strong>{member.paymentSummary.outstanding}</strong><small>Outstanding</small></div></div><div className="member-history-list">{member.paymentHistory.map((payment) => <div className="member-history-row" key={payment.date}><span className="member-history-icon payment">$</span><span><strong>{new Date(`${payment.date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</strong><small>{payment.method}</small></span><span className="member-payment-row-end"><strong>{payment.amount}</strong><StatusBadge>{payment.status}</StatusBadge></span></div>)}</div></DetailCard>;
}

export function WorkoutSummary({ member }) {
  const plan = member.workoutPlan;
  return <DetailCard title="Workout plan" description="The member's current coaching plan."><div className="member-workout-heading"><span className="member-plan-mark">⌁</span><span><strong>{plan.name}</strong><small>Coach {plan.trainer}</small></span></div><div className="member-schedule-list">{plan.schedule.map((day) => <span key={day}>{day}</span>)}</div><div className="member-exercise-list">{plan.exercises.map((exercise) => <div key={exercise.name}><span>{exercise.name}</span><small>{exercise.sets} sets × {exercise.reps} reps</small></div>)}</div></DetailCard>;
}

export function ActivityTimeline({ activities }) {
  const icons = { attendance: '✓', payment: '$', membership: '✳', workout: '⌁' };
  return <DetailCard title="Activity timeline" description="A recent history of this member's journey."><div className="member-timeline">{activities.map((activity, index) => <div className="member-timeline-item" key={`${activity.title}-${index}`}><span className={`member-timeline-icon ${activity.type}`}>{icons[activity.type]}</span><span className="member-timeline-line"/><div><strong>{activity.title}</strong><small>{new Date(`${activity.date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} · {activity.time}</small></div></div>)}</div></DetailCard>;
}

