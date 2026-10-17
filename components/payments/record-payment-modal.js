"use client";

import { useEffect, useRef, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Input from "../ui/input";
import Modal from "../ui/modal";
import Select from "../ui/select";
import { derivePaymentStatus, getInitialPaymentMembers, getPaymentMembers, paymentMethods, savePayment } from "../../lib/paymentsService";

const blankValues = { memberId: "", memberName: "", invoiceKey: "", amountPaid: "", method: "Cash", date: "", notes: "" };

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
  const charge = member?.charges?.find((item) => `${item.subscriptionId}|${item.renewalKey}` === values.invoiceKey);
  if (member?.charges?.length > 1 && !charge) errors.invoiceKey = "Choose the invoice this payment applies to.";
  if (values.amountPaid.trim() === "" || !Number.isFinite(Number(values.amountPaid)) || Number(values.amountPaid) <= 0) {
    errors.amountPaid = "Enter a positive amount.";
  } else if (!Number.isSafeInteger(Number(values.amountPaid))) {
    errors.amountPaid = "Enter a whole number of rupees.";
  } else if (member && Number(values.amountPaid) > (charge?.balance ?? member.amountDue)) {
    errors.amountPaid = "Amount paid cannot be greater than the outstanding balance.";
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
  const selectedCharge = selectedMember?.charges?.find((item) => `${item.subscriptionId}|${item.renewalKey}` === values.invoiceKey);
  const displayedBalance = selectedCharge?.balance ?? selectedMember?.amountDue;
  const previewStatus = selectedMember && values.amountPaid !== ""
    ? derivePaymentStatus(values.amountPaid, displayedBalance)
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
      if (selected) setValues((current) => ({ ...current, memberName: selected.name, invoiceKey: selected.charges?.length === 1 ? `${selected.charges[0].subscriptionId}|${selected.charges[0].renewalKey}` : "" }));
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
      const initialCharge = selected?.charges?.length === 1 ? selected.charges[0] : null;
      setValues((current) => ({ ...current, memberName: value, memberId: selected?.id || "", invoiceKey: initialCharge ? `${initialCharge.subscriptionId}|${initialCharge.renewalKey}` : "" }));
      setErrors((current) => ({ ...current, memberId: undefined, invoiceKey: undefined, amountPaid: undefined }));
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
      const [subscriptionId, renewalKey] = values.invoiceKey.split("|");
      const saved = await savePayment({ ...values, ...(subscriptionId ? { subscriptionId, renewalKey } : {}) }, requestKey.current);
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
        {selectedMember?.charges?.length > 1 && <Select id="payment-invoice" label="Outstanding invoice" value={values.invoiceKey} onChange={(event) => updateValue("invoiceKey", event.target.value)} error={errors.invoiceKey}>
          <option value="">Choose an invoice</option>
          {selectedMember.charges.map((charge) => <option key={`${charge.subscriptionId}|${charge.renewalKey}`} value={`${charge.subscriptionId}|${charge.renewalKey}`}>{charge.planName} · {formatCurrency(charge.balance)} outstanding</option>)}
        </Select>}
        <Input id="payment-plan" label="Plan / invoice" value={selectedCharge?.planName || selectedMember?.planName || ""} readOnly hint="The original agreed invoice price is preserved." />
        <Input id="payment-amount-due" label="Outstanding balance (PKR)" value={selectedMember ? formatCurrency(displayedBalance) : ""} readOnly />
        {selectedMember?.hasUnallocatedLegacyBalance && <p className="text-sm text-warning" role="status">Older payment history for this member has not been allocated to an invoice. Reconcile it before recording another payment.</p>}
        <Input id="payment-amount-paid" label="Amount paid (PKR)" type="number" min="1" step="1" inputMode="numeric" value={values.amountPaid} onChange={(event) => updateValue("amountPaid", event.target.value)} error={errors.amountPaid} />
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
