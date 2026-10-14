"use client";

import { useEffect, useRef, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Input from "../ui/input";
import Modal from "../ui/modal";
import Select from "../ui/select";
import { derivePaymentStatus, getInitialPaymentMembers, getPaymentMembers, paymentMethods, savePayment } from "../../lib/paymentsService";

const blankValues = { memberId: "", memberName: "", amountPaid: "", method: "Cash", date: "", notes: "" };

function localDateValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatCurrency(amount) {
  return `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;
}

function validate(values, members) {
  const errors = {};
  const member = members.find((item) => item.id === values.memberId);
  if (!member || member.name !== values.memberName) errors.memberId = "Choose a member from the list.";
  if (values.amountPaid.trim() === "" || !Number.isFinite(Number(values.amountPaid)) || Number(values.amountPaid) < 0) {
    errors.amountPaid = "Enter an amount of zero or more.";
  } else if (!Number.isSafeInteger(Number(values.amountPaid))) {
    errors.amountPaid = "Enter a whole number of rupees.";
  } else if (member && Number(values.amountPaid) > member.amountDue) {
    errors.amountPaid = "Amount paid cannot be greater than the amount due.";
  }
  if (!values.date) errors.date = "Choose a payment date.";
  if (!values.method) errors.method = "Choose a payment method.";
  return errors;
}

function statusTone(status) {
  if (status === "Paid") return "success";
  if (status === "Partial") return "warning";
  return "neutral";
}

export default function RecordPaymentModal({ open, onClose, initialMemberId = "", onSaved }) {
  const [members, setMembers] = useState(getInitialPaymentMembers);
  const [values, setValues] = useState(blankValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const requestKey = useRef(null);
  const selectedMember = members.find((member) => member.id === values.memberId);
  const previewStatus = selectedMember && values.amountPaid !== ""
    ? derivePaymentStatus(values.amountPaid, selectedMember.amountDue)
    : null;

  useEffect(() => {
    if (!open) return;
    setValues({
      ...blankValues,
      date: localDateValue(),
      memberId: initialMemberId || "",
      memberName: "",
    });
    requestKey.current = null;
    setSubmitting(false);
    getPaymentMembers("", initialMemberId).then((currentMembers) => {
      setMembers(currentMembers);
      const selected = currentMembers.find((member) => member.id === initialMemberId);
      if (selected) setValues((current) => ({ ...current, memberName: selected.name }));
    }).catch((error) => setErrors({ memberId: error.message }));
    setErrors({});
  }, [open, initialMemberId]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      getPaymentMembers(values.memberName, initialMemberId).then((foundMembers) => setMembers((current) => [...new Map([...current, ...foundMembers].map((member) => [member.id, member])).values()])).catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, values.memberName]);

  function updateValue(field, value) {
    requestKey.current = null;
    if (field === "memberName") {
      const selected = members.find((member) => member.name === value);
      setValues((current) => ({ ...current, memberName: value, memberId: selected?.id || "" }));
      setErrors((current) => ({ ...current, memberId: undefined, amountPaid: undefined }));
      return;
    }
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values, members);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setSubmitting(true);
      requestKey.current ||= window.crypto.randomUUID();
      const saved = await savePayment(values, requestKey.current);
      requestKey.current = null;
      onClose();
      onSaved?.(saved);
    } catch (error) {
      setErrors((current) => ({ ...current, ...(error.fields || { memberId: error.message }) }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" description="Enter the amount received from a member." className="payment-form-modal">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="ui-field">
          <label className="ui-label" htmlFor="payment-member">Member</label>
          <input
            id="payment-member"
            className={`ui-input ${errors.memberId ? "ui-input-error" : ""}`}
            type="search"
            list="payment-member-options"
            autoComplete="off"
            placeholder="Search and select a member"
            value={values.memberName}
            onChange={(event) => updateValue("memberName", event.target.value)}
            aria-invalid={errors.memberId ? "true" : undefined}
            aria-describedby={errors.memberId ? "payment-member-error" : undefined}
          />
          <datalist id="payment-member-options">{members.map((member) => <option key={member.id} value={member.name} />)}</datalist>
          {errors.memberId && <span className="ui-field-error" id="payment-member-error">{errors.memberId}</span>}
        </div>
        <Input id="payment-plan" label="Plan" value={selectedMember?.planName || ""} readOnly hint="Filled from the selected member's plan." />
        <Input id="payment-amount-due" label="Amount due (PKR)" value={selectedMember ? formatCurrency(selectedMember.amountDue) : ""} readOnly />
        <Input id="payment-amount-paid" label="Amount paid (PKR)" type="number" min="0" step="1" inputMode="numeric" value={values.amountPaid} onChange={(event) => updateValue("amountPaid", event.target.value)} error={errors.amountPaid} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select id="payment-method" label="Payment method" value={values.method} onChange={(event) => updateValue("method", event.target.value)} error={errors.method}>
            {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input id="payment-date" label="Payment date" type="date" value={values.date} onChange={(event) => updateValue("date", event.target.value)} error={errors.date} />
        </div>
        <label className="ui-field">
          <span className="ui-label">Notes (optional)</span>
          <textarea id="payment-notes" className="ui-input min-h-24 py-2" rows={3} value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} />
        </label>
        {previewStatus && <p className="text-sm text-ink-muted" aria-live="polite">Status: <Badge tone={statusTone(previewStatus)}>{previewStatus}</Badge></p>}
        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Record Payment"}</Button>
        </div>
      </form>
    </Modal>
  );
}
