"use client";

import { useEffect, useState } from "react";
import PlanComparison from "./plan-comparison";
import Badge from "../ui/badge";
import Card from "../ui/card";
import PageHeading from "../ui/page-heading";

function amount(value) { return `PKR ${Number(value || 0).toLocaleString("en-PK")}`; }
function date(value) { return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "—"; }
function exactDate(value) { return value ? new Date(value).toISOString().replace("T", " ").replace("Z", " UTC") : "—"; }
function tone(status) { return status === "active" || status === "paid" ? "success" : status === "trialing" ? "brand" : status === "open" || status === "past_due" || status === "trial_ended" || status === "Pending payment" ? "warning" : "neutral"; }
function invoiceLabel(status) { return status === "open" ? "Pending" : status === "void" ? "Voided" : status; }
function daysRemaining(value) { return value ? Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)) : null; }

export default function OwnerBilling() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [claimReference, setClaimReference] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");

  const pendingInvoice = data?.subscription?.invoices?.find((invoice) => invoice.id === data.subscription.pendingInvoiceId && invoice.status === "open") || null;
  const noPaidPlan = data?.subscription?.status === "past_due" && Boolean(pendingInvoice) && !data.subscription.invoices?.some((invoice) => invoice.status === "paid");
  const statusLabel = data?.subscription?.status === "past_due" && pendingInvoice ? "Pending payment" : data?.subscription?.status?.replaceAll("_", " ");

  async function submitPaymentClaim(event) {
    event.preventDefault();
    if (!pendingInvoice || !claimReference.trim()) return;
    setClaimBusy(true); setClaimError(""); setClaimMessage("");
    try {
      const response = await fetch("/api/gym/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit_payment_claim", invoiceId: pendingInvoice.id, reference: claimReference }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not submit the payment reference.");
      setClaimReference(""); setClaimMessage(result.data.message || "Payment reference submitted for review."); setRetry((value) => value + 1);
    } catch (requestError) { setClaimError(requestError.message || "Could not submit the payment reference."); }
    finally { setClaimBusy(false); }
  }

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/gym/billing", { cache: "no-store" });
        let result;
        try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load Fitivo billing details.");
        if (!cancelled) setData(result.data);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Could not load Fitivo billing details.");
      } finally { if (!cancelled) setLoading(false); }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [retry]);

  return <div className="space-y-6">
    <PageHeading eyebrow="FITIVO ACCOUNT" title="Plan & billing" description="Your Gym’s Fitivo subscription and platform invoices. This is separate from member payments." />
    {error && <Card className="p-5"><p className="text-sm text-error" role="alert">{error}</p><button className="mt-3 text-sm font-medium text-brand" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></Card>}
    {loading ? <Card className="p-6" role="status"><p className="text-sm text-ink-muted">Loading Fitivo billing…</p></Card> : !error && data && <>
      {!data.subscription ? <Card className="p-6"><h2 className="font-semibold text-ink">No Fitivo plan assigned</h2><p className="mt-2 text-sm text-ink-muted">Contact a Fitivo platform administrator for subscription information.</p></Card> : <Card className="p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-ink-muted">Current plan</p><h2 className="mt-1 text-2xl font-semibold text-ink">{noPaidPlan ? "No active paid plan" : data.subscription.plan?.name || "Plan unavailable"}</h2><p className="mt-2 text-sm text-ink-muted">{noPaidPlan ? "Your selected plan is pending payment verification." : data.subscription.plan?.description || ""}</p></div><Badge tone={tone(statusLabel)}>{statusLabel}</Badge></div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs font-medium uppercase text-ink-subtle">Price / billing cycle</dt><dd className="mt-2 text-sm text-ink">{amount(data.subscription.plan?.price)} / {data.subscription.plan?.interval || "—"}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Activation date</dt><dd className="mt-2 text-sm text-ink">{exactDate(data.subscription.periodStart || data.subscription.trialStartedAt)}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Expiry date</dt><dd className="mt-2 text-sm text-ink">{date(data.subscription.periodEnd || data.subscription.trialEndsAt)}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Days remaining</dt><dd className="mt-2 text-sm text-ink">{daysRemaining(data.subscription.periodEnd || data.subscription.trialEndsAt) ?? "—"}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Next renewal due</dt><dd className="mt-2 text-sm text-ink">{date(data.subscription.renewalDate)}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Auto-renew</dt><dd className="mt-2 text-sm text-ink">{data.subscription.autoRenew ? "On" : "Off"}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Latest payment status</dt><dd className="mt-2 text-sm text-ink">{data.subscription.invoices?.[0] ? invoiceLabel(data.subscription.invoices[0].status) : "No invoice"}{data.subscription.invoices?.[0]?.paymentReference ? ` · ${data.subscription.invoices[0].paymentReference}` : ""}</dd></div></dl>
        <div className="mt-5 rounded-lg bg-canvas p-4"><p className="text-sm font-medium text-ink">Plan limits</p><p className="mt-1 text-sm text-ink-muted">{data.subscription.plan?.limits?.members == null ? "Unlimited members" : `Up to ${data.subscription.plan.limits.members} members`} · {data.subscription.plan?.limits?.trainers == null ? "unlimited trainers" : `up to ${data.subscription.plan.limits.trainers} trainers`}</p></div>
        <p className="mt-4 text-xs text-ink-muted">Fitivo online payment processing is not configured. Open invoices require manual payment through the method provided by Fitivo.</p>
      </Card>}
      {pendingInvoice && <Card className="space-y-4 border border-warning-soft p-5">
        <div><h2 className="font-semibold text-ink">Invoice awaiting payment</h2><p className="mt-1 text-sm text-ink-muted">{pendingInvoice.invoiceNumber} · {pendingInvoice.planSnapshot?.name} · {amount(pendingInvoice.amountDue)} · issued {date(pendingInvoice.issuedAt)}</p><p className="mt-2 text-sm text-ink-muted">Invoice: {invoiceLabel(pendingInvoice.status)}. A reference submission is an unverified claim. It does not mark the invoice paid or activate your plan.</p></div>
        {claimMessage && <p role="status" className="text-sm text-success">{claimMessage}</p>}{claimError && <p role="alert" className="text-sm text-error">{claimError}</p>}
        {pendingInvoice.paymentClaims?.map((claim) => <div className="rounded-lg bg-canvas p-3 text-sm" key={claim.id}><p className="font-medium">Your reference: {claim.reference}</p><p className="mt-1 text-ink-muted">Claim {claim.status} · submitted {date(claim.submittedAt)}{claim.rejectionReason ? ` · ${claim.rejectionReason}` : ""}</p></div>)}
        {pendingInvoice.paymentClaims?.at(-1)?.status !== "submitted" && <form className="flex flex-wrap items-end gap-3" onSubmit={submitPaymentClaim}><div className="min-w-[240px] flex-1"><label htmlFor="owner-payment-reference" className="mb-1 block text-sm font-medium text-ink">Unverified payment reference</label><input id="owner-payment-reference" required maxLength={200} value={claimReference} onChange={(event) => setClaimReference(event.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm" placeholder="Enter your bank or wallet transaction reference" /></div><button type="submit" disabled={claimBusy || !claimReference.trim()} className="ui-button ui-button-primary ui-button-md">{claimBusy ? "Submitting…" : "Submit reference"}</button></form>}
      </Card>}
      {(data.paymentInstructions?.some((item) => item.instructions) || data.manualBillingInstructions || pendingInvoice) && <Card className="space-y-4 p-5"><div><h2 className="font-semibold text-ink">Manual payment instructions</h2><p className="mt-1 text-sm text-ink-muted">Use the instructions configured by Fitivo. Do not send account credentials or passwords.</p></div>{data.paymentInstructions?.filter((item) => item.instructions).map((item) => <div key={item.type}><h3 className="text-sm font-medium text-ink">{{ bank_transfer: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa" }[item.type] || "Payment method"}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{item.instructions}</p></div>)}{data.manualBillingInstructions && <p className="whitespace-pre-wrap text-sm text-ink-muted">{data.manualBillingInstructions}</p>}{pendingInvoice && !data.paymentInstructions?.some((item) => item.instructions) && !data.manualBillingInstructions && <p className="text-sm text-warning">Fitivo has not configured payment instructions yet. Contact Fitivo support before paying this invoice.</p>}</Card>}
      <PlanComparison data={data} onRequested={() => setRetry((value) => value + 1)} />
      <Card className="overflow-x-auto p-4 md:p-6"><h2 className="mb-4 text-lg font-semibold text-ink">Fitivo invoices</h2>{!data.subscription?.invoices?.length ? <p className="py-5 text-center text-sm text-ink-muted">No Fitivo invoices have been issued.</p> : <table className="w-full min-w-[780px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Invoice</th><th className="px-3 py-3">Plan period</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Invoice status</th><th className="px-3 py-3">Payment claim / verification</th></tr></thead><tbody>{data.subscription.invoices.map((invoice) => { const claim = invoice.paymentClaims?.at(-1); return <tr key={invoice.id} className="border-b border-line last:border-0"><td className="px-3 py-3"><span className="font-medium text-ink">{invoice.invoiceNumber}</span><span className="block text-xs text-ink-muted">Issued {date(invoice.issuedAt)}</span></td><td className="px-3 py-3 text-ink-muted">{date(invoice.periodStart)} – {date(invoice.periodEnd)}</td><td className="px-3 py-3 text-ink-muted">{amount(invoice.amountDue)}</td><td className="px-3 py-3"><Badge tone={tone(invoice.status)}>{invoiceLabel(invoice.status)}</Badge></td><td className="px-3 py-3 text-ink-muted">{claim ? <>{claim.reference} · claim {claim.status}</> : invoice.verifiedReference ? `Verified: ${invoice.verifiedReference}` : "No claim submitted"}{claim?.rejectionReason ? <span className="block text-xs text-error">{claim.rejectionReason}</span> : null}{invoice.status === "paid" ? <span className="block text-xs">Verified {date(invoice.verifiedAt || invoice.paidAt)} · {amount(invoice.verifiedAmount)}</span> : null}</td></tr>; })}</tbody></table>}</Card>
    </>}
  </div>;
}
