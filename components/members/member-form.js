"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, UserRound } from "lucide-react";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import { getInitialMemberPlans, getMemberById, getMemberPlans, getMembershipExpiryDate, saveMember } from "../../lib/membersService";

const blankValues = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  planId: "",
  startDate: "",
  notes: "",
};

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter the member's full name.";
  if (!values.phone.trim()) {
    errors.phone = "Enter a phone number.";
  } else {
    const digits = values.phone.replace(/\D/g, "");
    if (!/^\+?[0-9\s().-]+$/.test(values.phone.trim()) || digits.length < 7 || digits.length > 15) {
      errors.phone = "Enter a valid phone number with 7 to 15 digits.";
    }
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address or leave this field blank.";
  }
  if (!values.gender) errors.gender = "Choose a gender option.";
  if (!values.planId) errors.planId = "Choose a membership plan.";
  if (!values.startDate) errors.startDate = "Choose a membership start date.";
  return errors;
}

function toValues(member) {
  if (!member) return blankValues;
  return {
    name: member.name || "",
    phone: member.phone || "",
    email: member.email || "",
    gender: member.gender || "",
    dateOfBirth: member.dateOfBirth || "",
    planId: member.planId || "",
    startDate: member.startDate || "",
    notes: member.notes || "",
  };
}

export default function MemberForm({ memberId = null }) {
  const router = useRouter();
  const editing = Boolean(memberId);
  const [values, setValues] = useState(blankValues);
  const [errors, setErrors] = useState({});
  const [ready, setReady] = useState(!editing);
  const [memberMissing, setMemberMissing] = useState(false);
  const [plans, setPlans] = useState(getInitialMemberPlans);

  useEffect(() => {
    const timer = window.setTimeout(() => setPlans(getMemberPlans()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!memberId) return;
    const timer = window.setTimeout(() => {
      const existing = getMemberById(memberId);
      if (existing) {
        setValues(toValues(existing));
      } else {
        setMemberMissing(true);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memberId]);

  const selectedPlan = plans.find((plan) => plan.id === values.planId);
  const expiryDate = useMemo(
    () => getMembershipExpiryDate(values.startDate, selectedPlan?.durationDays),
    [values.startDate, selectedPlan]
  );

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const saved = saveMember(values, memberId);
    router.push("/members/" + saved.id);
    router.refresh();
  }

  if (!ready) {
    return <Card className="p-6"><p className="text-sm text-ink-muted">Loading member details…</p></Card>;
  }

  if (memberMissing) {
    return (
      <Card className="p-5 md:p-6">
        <EmptyState
          icon={<UserRound size={25} strokeWidth={1.7} />}
          title="Member not found"
          description="This member is not available in the current mock data."
          action={<Button href="/members" variant="secondary">Back to members</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? "Edit Member" : "Add Member"}
        description={editing ? "Update this member's contact and membership details." : "Add a member to your gym roster."}
        actions={<Button href={editing ? "/members/" + memberId : "/members"} variant="secondary">Cancel</Button>}
      />
      <Card className="p-5 md:p-7">
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <Input
              id="member-name"
              name="name"
              label="Full name"
              autoComplete="name"
              required
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              error={errors.name}
            />
            <Input
              id="member-phone"
              name="phone"
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+92 300 1234567"
              required
              value={values.phone}
              onChange={(event) => updateValue("phone", event.target.value)}
              error={errors.phone}
            />
            <Input
              id="member-email"
              name="email"
              label="Email (optional)"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              error={errors.email}
            />
            <Select
              id="member-gender"
              name="gender"
              label="Gender"
              required
              value={values.gender}
              onChange={(event) => updateValue("gender", event.target.value)}
              error={errors.gender}
            >
              <option value="">Choose an option</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </Select>
            <Input
              id="member-date-of-birth"
              name="dateOfBirth"
              label="Date of birth (optional)"
              type="date"
              autoComplete="bday"
              value={values.dateOfBirth}
              onChange={(event) => updateValue("dateOfBirth", event.target.value)}
            />
            <Select
              id="member-plan"
              name="planId"
              label="Membership plan"
              required
              value={values.planId}
              onChange={(event) => updateValue("planId", event.target.value)}
              error={errors.planId}
            >
              <option value="">Choose a plan</option>
              {plans.map((plan) => {
                const months = plan.durationDays % 30 === 0;
                const duration = months ? plan.durationDays / 30 : plan.durationDays;
                const unit = months ? "month" : "day";
                return <option key={plan.id} value={plan.id}>{plan.name} · {duration} {duration === 1 ? unit : `${unit}s`}</option>;
              })}
            </Select>
            <Input
              id="member-start-date"
              name="startDate"
              label="Membership start date"
              type="date"
              required
              value={values.startDate}
              onChange={(event) => updateValue("startDate", event.target.value)}
              error={errors.startDate}
            />
            <Input
              id="member-expiry-date"
              name="expiryDate"
              label="Expiry date"
              type="date"
              value={expiryDate}
              readOnly
              hint={selectedPlan ? "Calculated from the selected plan duration." : "Choose a plan and start date to calculate expiry."}
            />
            <label className="ui-field md:col-span-2">
              <span className="ui-label">Notes (optional)</span>
              <textarea
                id="member-notes"
                name="notes"
                rows={4}
                className="ui-input"
                value={values.notes}
                onChange={(event) => updateValue("notes", event.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Button href={editing ? "/members/" + memberId : "/members"} variant="secondary">Cancel</Button>
            <Button type="submit"><CalendarDays size={16} aria-hidden="true" />{editing ? "Save Changes" : "Add Member"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
