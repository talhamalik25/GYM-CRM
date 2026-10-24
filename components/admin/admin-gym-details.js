"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import ErrorState from "../ui/error-state";
import PageHeader from "../ui/page-header";
import Input from "../ui/input";
import Select from "../ui/select";
import Modal from "../ui/modal";

async function getGym(gymId) {
  const response = await fetch(`/api/admin/gyms/${encodeURIComponent(gymId)}`, { cache: "no-store" });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not load gym details.");
    error.status = response.status;
    throw error;
  }
  return result.data;
}

function dateLabel(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

function amount(value) { return `PKR ${Number(value || 0).toLocaleString("en-PK")}`; }
function subscriptionStatus(gym) {
  const subscription = gym.subscription;
  if (!subscription) return gym.trial?.status === "active" ? "Trial" : gym.trial ? "Expired" : "Not assigned";
  if (gym.status === "suspended") return "Suspended";
  if (subscription.pendingInvoiceId) return "Pending payment";
  if (subscription.status === "trialing") return subscriptionStatusDate(subscription.trialEndsAt) ? "Trial" : "Expired";
  if (subscription.status === "trial_ended") return "Expired";
  if (subscription.status === "past_due") return subscription.pendingInvoiceId ? "Pending payment" : "Expired";
  if (subscription.status === "active" && !subscriptionStatusDate(subscription.periodEnd)) return "Expired";
  return subscription.status === "cancelled" ? "Cancelled" : subscription.status === "active" ? "Active" : "Expired";
}
function subscriptionStatusDate(value) { return Boolean(value && new Date(value).getTime() > Date.now()); }
function remainingDays(value) { return value ? Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)) : null; }

export default function AdminGymDetails({ gymId }) {
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [grantReason, setGrantReason] = useState("");
  const [invoiceDialog, setInvoiceDialog] = useState(null);
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [verifiedReference, setVerifiedReference] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  const pendingInvoice = gym?.subscription?.invoices?.find((invoice) => invoice.id === gym.subscription.pendingInvoiceId && invoice.status === "open") || null;

  async function refreshGym() {
    const value = await getGym(gymId);
    setGym(value);
    setSelectedPlanId("");
  }

  async function billingAction(payload, successMessage) {
    setSaving(true); setActionError(""); setActionMessage("");
    try {
      const response = await fetch("/api/admin/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      let result;
      try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
      if (!response.ok || !result.success) throw new Error(result.error?.message || "The subscription action could not be completed.");
      setActionMessage(successMessage);
      setGrantReason("");
      setInvoiceDialog(null); setVerifiedAmount(""); setVerifiedReference(""); setVerificationNotes(""); setPaymentVerified(false); setVoidReason("");
      await refreshGym();
    } catch (requestError) { setActionError(requestError.message || "The subscription action could not be completed."); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    let cancelled = false;
    getGym(gymId).then((value) => {
      if (!cancelled) setGym(value);
    }).catch((requestError) => {
      if (!cancelled && requestError.status === 404) setMissing(true);
      else if (!cancelled) setError(requestError.message || "Could not load gym details.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [gymId]);

  return <div className="admin-gym-detail-page">
    <div className="admin-gym-back"><Button href="/admin/gyms" variant="secondary" size="sm">← Back to gyms</Button></div>
    {loading ? <Card className="admin-surface admin-state-message"><p role="status">Loading gym details…</p></Card> : missing ? <Card className="admin-surface admin-state-message">
      <p role="status">This gym account was not found.</p>
      <Link href="/admin/gyms">Return to gym accounts</Link>
    </Card> : error ? <Card className="admin-surface admin-inline-error"><ErrorState title="Could not load gym details" description={error} /></Card> : gym ? <>
      <PageHeader eyebrow="GYM ACCOUNT" title={gym.name || "Gym details"} description={gym.slug || "Gym slug unavailable"} />
      <Card className="admin-surface admin-gym-details-card">
        <div className="admin-panel-heading admin-panel-heading-stacked"><div><h2>Workspace details</h2><p>Account status, timezone, and owner access.</p></div></div>
        <dl className="admin-gym-detail-grid">
          <div><dt>Status</dt><dd><Badge tone={gym.status === "active" ? "success" : "warning"}>{gym.status === "active" ? "Active" : gym.status === "suspended" ? "Suspended" : "Unavailable"}</Badge></dd></div>
          <div><dt>Timezone</dt><dd>{gym.timezone || "Not set"}</dd></div>
          <div><dt>Created</dt><dd>{dateLabel(gym.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{dateLabel(gym.updatedAt)}</dd></div>
          <div className="admin-gym-detail-owners"><dt>Active gym owners</dt><dd>{gym.owners?.length ? <ul>{gym.owners.map((owner, index) => <li key={`${owner.email}-${index}`}><span>{owner.name || "Name unavailable"}</span><small>{owner.email || "Email unavailable"}</small></li>)}</ul> : <span>No active owner assigned</span>}</dd></div>
        </dl>
      </Card>
      <Card className="admin-surface admin-gym-subscription-card">
        <div className="admin-panel-heading admin-panel-heading-stacked"><div><h2>Fitivo subscription</h2><p>Paid plans activate only after external payment is verified and reconciled.</p></div><Link href="/admin/billing" className="text-sm font-medium text-brand">Open billing &amp; payment reconciliation →</Link></div>
        {actionMessage && <p className="admin-success-message" role="status">{actionMessage}</p>}
        {actionError && <p className="text-sm text-error" role="alert">{actionError}</p>}
        {pendingInvoice && <section className="admin-pending-invoice" aria-labelledby="pending-invoice-title">
          <div><h3 id="pending-invoice-title">Pending invoice blocks another plan change</h3><p>Resolve this invoice before assigning a different plan or issuing a renewal. No payment has been recorded and the invoice does not activate a paid plan.</p></div>
          <dl>
            <div><dt>Invoice</dt><dd>{pendingInvoice.invoiceNumber}</dd></div>
            <div><dt>Selected plan</dt><dd>{pendingInvoice.planSnapshot?.name || "Plan unavailable"} · {pendingInvoice.planSnapshot?.interval || "—"}</dd></div>
            <div><dt>Amount due</dt><dd>{amount(pendingInvoice.amountDue)}</dd></div>
            <div><dt>Created</dt><dd>{dateLabel(pendingInvoice.issuedAt || pendingInvoice.createdAt)}</dd></div>
            <div><dt>Status</dt><dd><Badge tone="warning">Pending payment</Badge></dd></div>
            <div><dt>Payment details</dt><dd>{pendingInvoice.paymentClaims?.at(-1) ? `${pendingInvoice.paymentClaims.at(-1).reference} · unverified owner claim (${pendingInvoice.paymentClaims.at(-1).status})` : "No owner reference submitted"}</dd></div>
          </dl>
          <div className="admin-inline-actions">
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => { setActionError(""); setInvoiceDialog({ action: "view", invoice: pendingInvoice }); }}>View invoice</Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => { setActionError(""); setVerifiedAmount(String(pendingInvoice.amountDue)); setVerifiedReference(pendingInvoice.paymentClaims?.at(-1)?.reference || ""); setVerificationNotes(""); setPaymentVerified(false); setInvoiceDialog({ action: "reconcile", invoice: pendingInvoice }); }}>Reconcile verified payment</Button>
            <Button type="button" variant="danger" size="sm" disabled={saving} onClick={() => { setActionError(""); setVoidReason(""); setInvoiceDialog({ action: "void", invoice: pendingInvoice }); }}>Void invoice</Button>
          </div>
        </section>}
        {gym.subscription ? <>
          <dl className="admin-gym-detail-grid">
            <div><dt>Gym</dt><dd>{gym.name}</dd></div>
            <div><dt>Status</dt><dd>{subscriptionStatus(gym)}</dd></div>
            <div><dt>Current plan</dt><dd>{gym.subscription.status === "past_due" && !gym.subscription.invoices?.some((invoice) => invoice.status === "paid") ? "No paid plan yet" : gym.subscription.plan?.name || "Plan unavailable"}</dd></div>
            <div><dt>Plan price / cycle</dt><dd>{amount(gym.subscription.plan?.price)} / {gym.subscription.plan?.interval || "—"}</dd></div>
            <div><dt>Activation date</dt><dd>{dateLabel(gym.subscription.status === "past_due" && !gym.subscription.invoices?.some((invoice) => invoice.status === "paid") ? null : gym.subscription.periodStart || gym.subscription.trialStartedAt)}</dd></div>
            <div><dt>Expiry date</dt><dd>{dateLabel(gym.subscription.status === "past_due" && !gym.subscription.invoices?.some((invoice) => invoice.status === "paid") ? null : gym.subscription.periodEnd || gym.subscription.trialEndsAt)}</dd></div>
            <div><dt>Next renewal due</dt><dd>{dateLabel(gym.subscription.renewalDate)}</dd></div>
            <div><dt>Days remaining</dt><dd>{gym.subscription.status === "past_due" && !gym.subscription.invoices?.some((invoice) => invoice.status === "paid") ? "—" : remainingDays(gym.subscription.periodEnd || gym.subscription.trialEndsAt) ?? "—"}</dd></div>
            <div><dt>Billing cycle</dt><dd>{gym.subscription.plan?.interval || "—"}</dd></div>
            <div><dt>Auto-renew</dt><dd>{gym.subscription.autoRenew ? "On" : "Off"}</dd></div>
            <div><dt>Latest invoice / payment</dt><dd>{gym.subscription.invoices?.[0] ? <>{gym.subscription.invoices[0].invoiceNumber} · {gym.subscription.invoices[0].status === "open" ? "Pending payment" : gym.subscription.invoices[0].status}{gym.subscription.invoices[0].paymentReference ? ` · ${gym.subscription.invoices[0].paymentReference}` : ""}</> : "No invoice"}</dd></div>
            <div><dt>Last renewal</dt><dd>{dateLabel(gym.subscription.invoices?.find((invoice) => invoice.status === "paid")?.paidAt)}</dd></div>
            {gym.subscription.complimentaryGrant && <div><dt>Complimentary grant</dt><dd>{gym.subscription.complimentaryGrant.reason} · {gym.subscription.complimentaryGrant.grantedBy?.name || "Superadmin unavailable"} · {dateLabel(gym.subscription.complimentaryGrant.grantedAt)}</dd></div>}
          </dl>
        </> : <p className="mt-4 text-sm text-ink-muted">{gym.trial ? `Trial · expires ${dateLabel(gym.trial.endsAt)} · ${gym.trial.remainingDays} days remaining` : "No plan or trial is currently assigned."}</p>}

        <div className="admin-gym-subscription-actions">
          <div><h3>Assign or change plan</h3><p>Monthly and yearly terms follow the selected plan. Paid plan changes create an invoice and retain existing access until reconciliation.</p>{pendingInvoice && <p className="admin-pending-invoice-blocked" role="status">Plan assignment is unavailable while {pendingInvoice.invoiceNumber} is open. Reconcile verified payment or void it with a reason above.</p>}</div>
          <form onSubmit={(event) => { event.preventDefault(); const selected = gym.plans.find((plan) => plan.id === selectedPlanId); if (!selected) return; if (selected.price === 0) { if (!grantReason.trim()) { setActionError("Enter a reason for the complimentary grant."); return; } billingAction({ action: "grant_complimentary", gymId, planId: selected.id, reason: grantReason }, "Complimentary plan granted and recorded."); } else billingAction({ action: "assign_plan", gymId, planId: selected.id, mode: "invoice" }, "Plan invoice issued. Paid access changes after payment reconciliation."); }}>
            <Select id="gym-subscription-plan" label="Plan" value={selectedPlanId} required disabled={saving || gym.plans.length === 0} onChange={(event) => setSelectedPlanId(event.target.value)}><option value="">Choose a plan</option>{gym.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {amount(plan.price)} / {plan.interval}</option>)}</Select>
            {gym.plans.find((plan) => plan.id === selectedPlanId)?.price === 0 && <Input id="complimentary-reason" label="Reason for complimentary access" required maxLength={300} value={grantReason} onChange={(event) => setGrantReason(event.target.value)} />}
            {gym.plans.find((plan) => plan.id === selectedPlanId)?.price > 0 && <p className="admin-subscription-term-note">One {gym.plans.find((plan) => plan.id === selectedPlanId)?.interval} term. Activation date is set when verified payment is reconciled; the invoice shows the calculated period.</p>}
            <Button type="submit" disabled={saving || !selectedPlanId || Boolean(gym.subscription?.pendingInvoiceId)}>{saving ? "Processing…" : gym.plans.find((plan) => plan.id === selectedPlanId)?.price === 0 ? "Grant complimentary access" : "Issue plan invoice"}</Button>
          </form>
          {gym.subscription && gym.subscription.plan?.price > 0 && <Button type="button" variant="secondary" disabled={saving || Boolean(gym.subscription.pendingInvoiceId) || gym.subscription.status === "cancelled"} onClick={() => billingAction({ action: "renew_invoice", gymId }, "Renewal invoice issued. The term changes after verified payment is reconciled.")}>Create renewal invoice</Button>}
        </div>
        <div className="admin-gym-subscription-history"><h3>Subscription periods and invoice history</h3>{!gym.subscription?.invoices?.length ? <p>No invoices or paid periods are recorded.</p> : <div className="admin-table-scroll"><table><thead><tr><th>Invoice / plan</th><th>Period</th><th>Amount</th><th>Payment</th><th>Superadmin / timestamp</th></tr></thead><tbody>{gym.subscription.invoices.map((invoice) => <tr key={invoice.id}><td>{invoice.invoiceNumber}<small>{invoice.previousPlanSnapshot?.name ? `${invoice.previousPlanSnapshot.name} → ` : ""}{invoice.planSnapshot?.name}</small></td><td>{dateLabel(invoice.periodStart)} – {dateLabel(invoice.periodEnd)}</td><td>{amount(invoice.amountDue)}</td><td>{invoice.status}{invoice.paymentReference ? ` · ${invoice.paymentReference}` : ""}</td><td>{invoice.reconciledBy?.name || invoice.createdBy?.name || "Superadmin unavailable"}<small>{dateLabel(invoice.paidAt || invoice.issuedAt)}</small></td></tr>)}</tbody></table></div>}</div>
      </Card>
      <Modal open={Boolean(invoiceDialog)} onClose={() => { if (!saving) setInvoiceDialog(null); }} title={invoiceDialog?.action === "reconcile" ? "Reconcile external payment" : invoiceDialog?.action === "void" ? "Void pending invoice" : "Pending invoice details"} description={invoiceDialog ? `${invoiceDialog.invoice.invoiceNumber} · ${amount(invoiceDialog.invoice.amountDue)} · ${invoiceDialog.invoice.planSnapshot?.name || "Plan unavailable"}` : ""}>
        {invoiceDialog?.action === "view" && <div className="admin-invoice-detail-modal">
          <p>Invoice details are read only. An open invoice does not activate or extend a subscription.</p>
          <dl><div><dt>Gym</dt><dd>{gym.name}</dd></div><div><dt>Plan</dt><dd>{invoiceDialog.invoice.planSnapshot?.name}</dd></div><div><dt>Billing cycle</dt><dd>{invoiceDialog.invoice.planSnapshot?.interval}</dd></div><div><dt>Amount</dt><dd>{amount(invoiceDialog.invoice.amountDue)}</dd></div><div><dt>Invoice period</dt><dd>{dateLabel(invoiceDialog.invoice.periodStart)} – {dateLabel(invoiceDialog.invoice.periodEnd)}</dd></div><div><dt>Issued</dt><dd>{dateLabel(invoiceDialog.invoice.issuedAt || invoiceDialog.invoice.createdAt)}</dd></div><div><dt>Status</dt><dd>{invoiceDialog.invoice.status === "open" ? "Pending payment" : invoiceDialog.invoice.status}</dd></div><div><dt>Owner payment claim</dt><dd>{invoiceDialog.invoice.paymentClaims?.at(-1) ? `${invoiceDialog.invoice.paymentClaims.at(-1).reference} · ${invoiceDialog.invoice.paymentClaims.at(-1).status} (unverified)` : "None submitted"}</dd></div><div><dt>Verified reference</dt><dd>{invoiceDialog.invoice.verifiedReference || "Not verified"}</dd></div></dl>
        </div>}
        {invoiceDialog?.action === "reconcile" && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); billingAction({ action: "reconcile_invoice", invoiceId: invoiceDialog.invoice.id, verifiedAmount: Number(verifiedAmount), verifiedReference, verificationNotes, paymentIndependentlyVerified: paymentVerified }, "Payment recorded after independent Superadmin verification."); }}>
          <p className="text-sm text-ink-muted">An owner-submitted reference is an unverified claim, not proof. Check the receiving account independently before approving this invoice.</p>
          <Input id="gym-invoice-verified-amount" label="Verified amount (PKR)" type="number" min="1" step="1" required value={verifiedAmount} onChange={(event) => setVerifiedAmount(event.target.value)} />
          <Input id="gym-invoice-verified-reference" label="Verified transaction reference" required maxLength={200} value={verifiedReference} onChange={(event) => setVerifiedReference(event.target.value)} />
          <label className="admin-billing-textarea-label" htmlFor="gym-invoice-verification-notes">Verification notes<textarea id="gym-invoice-verification-notes" required minLength={5} maxLength={1000} rows={3} value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} /></label>
          <label className="flex items-start gap-2 text-sm text-ink"><input type="checkbox" required checked={paymentVerified} onChange={(event) => setPaymentVerified(event.target.checked)} /><span>I independently verified full payment in the receiving account.</span></label>
          <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={saving} onClick={() => setInvoiceDialog(null)}>Cancel</Button><Button type="submit" disabled={saving || !verifiedReference.trim() || !verificationNotes.trim() || Number(verifiedAmount) !== invoiceDialog.invoice.amountDue || !paymentVerified}>{saving ? "Reconciling…" : "Approve and reconcile"}</Button></div>
        </form>}
        {invoiceDialog?.action === "void" && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); billingAction({ action: "void_invoice", invoiceId: invoiceDialog.invoice.id, reason: voidReason }, "Invoice voided. Subscription details and available actions refreshed."); }}>
          <p className="text-sm text-ink-muted">Voiding closes this invoice without recording payment or activating the requested plan. This action requires an audit reason.</p>
          <Input id="gym-invoice-void-reason" label="Reason for voiding" required maxLength={300} value={voidReason} onChange={(event) => setVoidReason(event.target.value)} />
          <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={saving} onClick={() => setInvoiceDialog(null)}>Cancel</Button><Button type="submit" variant="danger" disabled={saving || !voidReason.trim()}>{saving ? "Voiding…" : "Void invoice"}</Button></div>
        </form>}
      </Modal>
      {gym.trial && <Card className="admin-surface p-6">
        <h2 className="font-semibold">Trial details</h2>
        <dl className="admin-gym-detail-grid">
          <div><dt>Status</dt><dd>{gym.trial.status}</dd></div>
          <div><dt>Started (UTC)</dt><dd>{new Date(gym.trial.startedAt).toISOString()}</dd></div>
          <div><dt>Expires (UTC)</dt><dd>{new Date(gym.trial.endsAt).toISOString()}</dd></div>
          <div><dt>Days remaining (rounded up)</dt><dd>{gym.trial.remainingDays}</dd></div>
        </dl>
        <Link href="/admin/billing" className="mt-4 inline-block text-brand">Manage subscription &amp; invoices →</Link>
      </Card>}
    </> : <Card className="admin-surface admin-state-message"><p role="status">Gym details are unavailable.</p></Card>}
  </div>;
}
