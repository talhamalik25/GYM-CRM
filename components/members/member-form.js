'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeading from '../ui/page-heading';

function Field({ label, required = false, wide = false, hint, children }) {
  return <label className={`member-form-field${wide ? ' wide' : ''}`}><span>{label}{required && <i aria-hidden="true">*</i>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function FormSection({ title, description, children }) {
  return <section className="member-form-section"><div className="member-form-section-heading"><span className="member-form-section-mark" aria-hidden="true">✳</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="member-form-grid">{children}</div></section>;
}

export default function MemberForm({ member = null }) {
  const editing = Boolean(member);
  const [saved, setSaved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [imagePreview, setImagePreview] = useState(member?.profileImageUrl || '');

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function handleSubmit(event) {
    event.preventDefault();
    setAttempted(true);
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSaved(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => setSaved(false), 5000);
  }

  const personal = member?.personalInformation || {};
  const emergency = member?.emergencyContact || {};
  const fitness = member?.fitnessInformation || {};
  const membership = member?.membership || {};

  return <div className="member-form-page"><PageHeading eyebrow={editing ? 'MEMBER MANAGEMENT · EDIT PROFILE' : 'MEMBER MANAGEMENT · REGISTRATION'} title={editing ? `Edit ${member.name}` : 'Add a member'} description={editing ? 'Keep their information and membership details up to date.' : 'Create a complete member profile to get them started.'} action={<Link className="button button-secondary" href={editing ? `/members/${member.id}` : '/members'}>← Back to {editing ? 'profile' : 'members'}</Link>}/>
    {saved && <div className="member-form-success" role="status"><span>✓</span><div><strong>{editing ? 'Changes saved' : 'Member registered'}</strong><small>{editing ? 'The updated profile is ready in this demo.' : 'The new member profile is ready in this demo.'} No data was sent to a server.</small></div><button type="button" onClick={() => setSaved(false)} aria-label="Dismiss success message">×</button></div>}
    <form className="member-registration-form" onSubmit={handleSubmit} noValidate data-validation={attempted ? 'attempted' : 'idle'}>
      <FormSection title="Personal information" description="A few details to identify your member.">
        <div className="member-field-wide member-image-upload"><span className="member-upload-avatar">{imagePreview ? <img src={imagePreview} alt="Selected member profile"/> : <span aria-hidden="true">{member?.initials || '＋'}</span>}</span><div className="member-upload-copy"><strong>Profile image</strong><small>Choose a clear headshot. PNG or JPG, up to 5 MB.</small><label className="button button-secondary member-upload-button">Browse image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) { event.target.setCustomValidity(file.size > 5 * 1024 * 1024 ? 'Choose a profile image under 5 MB.' : ''); if (file.size <= 5 * 1024 * 1024) setImagePreview(URL.createObjectURL(file)); event.target.reportValidity(); } }} /></label></div></div>
        <Field label="First name" required><input name="firstName" defaultValue={personal.firstName || ''} autoComplete="given-name" placeholder="e.g. Aisha" required maxLength={60}/></Field>
        <Field label="Last name" required><input name="lastName" defaultValue={personal.lastName || ''} autoComplete="family-name" placeholder="e.g. Rahman" required maxLength={60}/></Field>
        <Field label="Date of birth"><input type="date" name="dateOfBirth" defaultValue={personal.dateOfBirth || ''}/></Field>
        <Field label="Gender"><select name="gender" defaultValue={personal.gender || ''}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></Field>
        <Field label="Phone" required><input type="tel" name="phone" defaultValue={personal.phone || ''} autoComplete="tel" placeholder="+1 (555) 000-0000" required minLength={7}/></Field>
        <Field label="Email address"><input type="email" name="email" defaultValue={personal.email || ''} autoComplete="email" placeholder="member@email.com"/></Field>
      </FormSection>
      <FormSection title="Address" description="Where can the team reach your member?"><Field label="Street address"><input name="address" defaultValue={personal.address || ''} autoComplete="street-address" placeholder="Street and number"/></Field><Field label="City"><input name="city" defaultValue={personal.city || ''} autoComplete="address-level2" placeholder="City, state"/></Field></FormSection>
      <FormSection title="Emergency contact" description="Someone to contact if your member needs assistance."><Field label="Contact name"><input name="emergencyName" defaultValue={emergency.name || ''} placeholder="Full name"/></Field><Field label="Contact phone"><input type="tel" name="emergencyPhone" defaultValue={emergency.phone || ''} placeholder="+1 (555) 000-0000"/></Field><Field label="Relationship"><select name="emergencyRelationship" defaultValue={emergency.relationship || ''}><option value="">Select relationship</option><option>Parent</option><option>Spouse</option><option>Sibling</option><option>Friend</option><option>Other</option></select></Field></FormSection>
      <FormSection title="Fitness information" description="A starting point for a more personal training experience."><Field label="Height"><div className="member-input-unit"><input type="number" name="heightCm" defaultValue={fitness.heightCm || ''} min="80" max="250" placeholder="170"/><span>cm</span></div></Field><Field label="Weight"><div className="member-input-unit"><input type="number" name="weightKg" defaultValue={fitness.weightKg || ''} min="25" max="350" placeholder="65"/><span>kg</span></div></Field><Field label="Fitness goal" wide><input name="fitnessGoal" defaultValue={fitness.goal || ''} placeholder="e.g. Build strength and improve endurance" maxLength={160}/></Field><Field label="Medical notes" wide hint="Share only details the coaching team needs to support safe training."><textarea name="medicalNotes" rows="3" defaultValue={fitness.medicalNotes || ''} placeholder="Injuries, restrictions or other relevant notes" maxLength={1000}/></Field></FormSection>
      <FormSection title="Membership" description="Select a plan and set the membership period."><Field label="Membership plan" required><select name="membershipPlan" defaultValue={membership.plan || ''} required><option value="">Choose a plan</option><option>Unlimited</option><option>Strength</option><option>Off-peak</option></select></Field><Field label="Start date" required><input type="date" name="startDate" defaultValue={membership.startDate || '2026-10-06'} required/></Field><Field label="Membership duration" required><select name="durationMonths" defaultValue={membership.durationMonths || ''} required><option value="">Choose duration</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option><option value="24">24 months</option></select></Field><Field label="Initial payment status"><select name="paymentStatus" defaultValue={membership.paymentStatus || 'Pending'}><option>Pending</option><option>Paid</option></select></Field></FormSection>
      <div className="member-form-footer"><p><i aria-hidden="true">*</i> Required fields</p><div><Link className="button button-secondary" href={editing ? `/members/${member.id}` : '/members'}>Cancel</Link><button className="button button-primary" type="submit">{editing ? 'Save changes' : 'Save member'} <span aria-hidden="true">→</span></button></div></div>
    </form>
  </div>;
}

