"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import Skeleton from "../ui/skeleton";
import { getSubscription, renewSubscription, cancelSubscription, recordSubscriptionPayment } from "../../lib/subscriptionsService";

const money = (value) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-PK", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }) : "—";
const requestKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

function todayInGym() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
}

function statusTone(status) {
  if (status === "active" || status === "paid") return "success";
  if (status === "partial" || status === "pending") return "warning";
  if (status === "expired" || status === "cancelled") return "error";
  return "neutral";
}

function validatePayment(amount, method, maximum) {
  const errors = {};
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value <= 0) errors.amountPaid = "Enter a positive whole amount.";
  else if (value > maximum) errors.amountPaid = "Payment cannot exceed the outstanding balance.";
  if (!method) errors.method = "Choose a payment method.";
  return errors;
}

export default function MembershipRecord({ id, renewal = false }) {
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amountPaid, setAmountPaid] = useState("0");
  const [method, setMethod] = useState("cash");
  const [startDate, setStartDate] = useState(todayInGym);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItem(await getSubscription(id));
    } catch (loadError) {
      setError(loadError.message || "Could not load this membership.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function renew(event) {
    event.preventDefault();
    const nextErrors = validatePayment(amountPaid, method, item.agreedPrice);
    if (item.status !== "active" && startDate < todayInGym()) nextErrors.startDate = "Choose today or a future date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await renewSubscription(id, {
        amountPaid: Number(amountPaid),
        method,
        ...(item.status !== "active" ? { startDate } : {}),
      }, requestKey());
      setNotice("Membership renewed successfully.");
      await load();
    } catch (saveError) {
      setErrors(saveError.fields || {});
      setError(saveError.message || "Could not renew this membership.");
    } finally {
      setSaving(false);
    }
  }

  async function recordPayment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = form.elements.amountPaid.value;
    const paymentMethod = form.elements.method.value;
    const nextErrors = validatePayment(amount, paymentMethod, item.balance);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await recordSubscriptionPayment(id, {
        amountPaid: Number(amount),
        method: paymentMethod,
      }, requestKey());
      form.reset();
      setNotice("Payment recorded successfully.");
      await load();
    } catch (saveError) {
      setErrors(saveError.fields || {});
      setError(saveError.message || "Could not record this payment.");
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (!window.confirm("Cancel this membership? Financial records will be preserved.")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await cancelSubscription(id);
      setNotice("Membership cancelled. Its financial history has been kept.");
      await load();
    } catch (cancelError) {
      setError(cancelError.message || "Could not cancel this membership.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-8" role="status" aria-label="Loading membership"><Skeleton className="h-8 max-w-64" /><Skeleton className="h-24" /><Skeleton className="h-48" /></main>;
  if (error && !item) return <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-8"><ErrorState title="Could not load membership" description={error} onRetry={load} loading={loading} /><Button href="/memberships" variant="secondary">Back to memberships</Button></main>;
  if (!item) return <main className="mx-auto max-w-4xl p-4 md:p-8"><Card className="p-4 md:p-5"><EmptyState title="Membership not found" description="This record may have been removed or belongs to another gym." action={<Button href="/memberships" variant="secondary">Back to memberships</Button>} /></Card></main>;

  const currentTitle = item.member?.fullName || "Membership";
  const statusDescription = <span className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(item.status)}>{item.status}</Badge><span>{item.planSnapshot?.name || item.plan?.name || "Plan unavailable"}</span></span>;

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 md:space-y-6 md:p-8">
      <PageHeader
        eyebrow={renewal ? "MEMBERSHIP RENEWAL" : "MEMBERSHIP RECORD"}
        title={currentTitle}
        description={statusDescription}
        actions={<Button href="/memberships" variant="secondary">Back to memberships</Button>}
      />
      {error && <ErrorState title="Membership action failed" description={error} />}
      {notice && <Card className="border-success bg-success-soft p-3 text-sm text-success" role="status">{notice}</Card>}

      <Card className="p-4 md:p-6">
        <h2 className="text-base font-semibold text-ink">Subscription summary</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-medium text-ink-muted">Start date</dt><dd className="mt-1 text-sm font-medium text-ink">{dateLabel(item.startDate)}</dd></div>
          <div><dt className="text-xs font-medium text-ink-muted">Expiry date</dt><dd className="mt-1 text-sm font-medium text-ink">{dateLabel(item.expiryDate)}</dd></div>
          <div><dt className="text-xs font-medium text-ink-muted">Original plan price</dt><dd className="mt-1 text-sm font-medium text-ink">{money(item.originalPrice)}</dd></div>
          <div><dt className="text-xs font-medium text-ink-muted">Agreed subscription price</dt><dd className="mt-1 text-sm font-medium text-ink">{money(item.agreedPrice)}</dd></div>
          <div><dt className="text-xs font-medium text-ink-muted">Payment status</dt><dd className="mt-1"><Badge tone={statusTone(item.paymentStatus)}>{item.paymentStatus}</Badge></dd></div>
          <div><dt className="text-xs font-medium text-ink-muted">Outstanding balance</dt><dd className="mt-1 text-sm font-semibold text-ink">{money(item.balance)}</dd></div>
        </dl>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-base font-semibold text-ink">Renewal history</h2>
        {item.renewalHistory?.length ? <ol className="mt-3 divide-y divide-line">{item.renewalHistory.map((term, index) => <li key={`${term.renewalKey}-${index}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{term.planSnapshot.name} · {dateLabel(term.startDate)} – {dateLabel(term.expiryDate)}</span><strong>{money(term.planSnapshot.agreedPrice)}</strong></li>)}</ol> : <EmptyState title="No renewal history" description="Renewal terms will appear here." />}
      </Card>

      {item.balance > 0 && !renewal && <Card className="p-4 md:p-6"><form onSubmit={recordPayment} className="space-y-4" noValidate><div><h2 className="font-semibold text-ink">Record payment</h2><p className="mt-1 text-sm text-ink-muted">Outstanding balance: {money(item.balance)}</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input id="membership-payment-amount" name="amountPaid" label="Amount received (PKR)" type="number" min="1" max={item.balance} step="1" inputMode="numeric" required error={errors.amountPaid} /><Select id="membership-payment-method" name="method" label="Payment method" required error={errors.method}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option></Select></div><Button type="submit" loading={saving} loadingLabel="Recording payment…">Record payment</Button></form></Card>}

      {renewal ? <Card className="p-4 md:p-6"><form onSubmit={renew} className="space-y-4" noValidate><div><h2 className="font-semibold text-ink">Renew subscription</h2><p className="mt-1 text-sm text-ink-muted">{item.status === "active" ? `The next period starts after ${dateLabel(item.expiryDate)}.` : "The next period starts today or on a selected future date."} The saved plan determines the price and expiry.</p></div>{item.status !== "active" && <Input id="membership-renewal-date" label="Renewal start date" type="date" min={todayInGym()} value={startDate} onChange={(event) => { setStartDate(event.target.value); setErrors((current) => ({ ...current, startDate: undefined })); }} error={errors.startDate} />}<Input id="membership-renewal-payment" label="Payment received (PKR)" type="number" min="0" max={item.agreedPrice} step="1" inputMode="numeric" value={amountPaid} onChange={(event) => { setAmountPaid(event.target.value); setErrors((current) => ({ ...current, amountPaid: undefined })); }} error={errors.amountPaid} /><p className="text-sm text-ink-muted">Plan price: {money(item.agreedPrice)}</p>{Number(amountPaid) > 0 && <Select id="membership-renewal-method" label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)} error={errors.method}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option></Select>}<Button type="submit" disabled={item.status === "cancelled"} loading={saving} loadingLabel="Renewing…">Confirm renewal</Button></form></Card> : <div className="flex flex-wrap gap-2"><Button href={`/memberships/${id}/renew`} disabled={item.status === "cancelled"} variant="secondary">Renew membership</Button>{item.status !== "cancelled" && <Button type="button" variant="danger" disabled={saving} onClick={cancel}>Cancel membership</Button>}<Link className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={`/members/${item.memberId}`}>View member</Link></div>}
    </main>
  );
}
