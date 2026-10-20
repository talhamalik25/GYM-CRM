"use client";

import { useEffect, useState } from "react";
import Badge from "../ui/badge";
import Card from "../ui/card";

function amount(value) { return `PKR ${Number(value || 0).toLocaleString("en-PK")}`; }
function date(value) { return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "—"; }
function tone(status) { return status === "active" || status === "paid" ? "success" : status === "trialing" ? "brand" : status === "open" || status === "past_due" || status === "trial_ended" ? "warning" : "neutral"; }

export default function OwnerBilling() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

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
    <header><p className="text-xs font-semibold uppercase tracking-widest text-brand">FITIVO ACCOUNT</p><h1 className="mt-1 text-3xl font-semibold text-ink">Plan &amp; billing</h1><p className="mt-2 text-sm text-ink-muted">Your Gym’s Fitivo subscription and platform invoices. This is separate from member payments.</p></header>
    {error && <Card className="p-5"><p className="text-sm text-error" role="alert">{error}</p><button className="mt-3 text-sm font-medium text-brand" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></Card>}
    {loading ? <Card className="p-6" role="status"><p className="text-sm text-ink-muted">Loading Fitivo billing…</p></Card> : !error && data && <>
      {!data.subscription ? <Card className="p-6"><h2 className="font-semibold text-ink">No Fitivo plan assigned</h2><p className="mt-2 text-sm text-ink-muted">Contact a Fitivo platform administrator for subscription information.</p></Card> : <Card className="p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-ink-muted">Current plan</p><h2 className="mt-1 text-2xl font-semibold text-ink">{data.subscription.plan?.name || "Plan unavailable"}</h2><p className="mt-2 text-sm text-ink-muted">{data.subscription.plan?.description || ""}</p></div><Badge tone={tone(data.subscription.status)}>{data.subscription.status.replaceAll("_", " ")}</Badge></div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs font-medium uppercase text-ink-subtle">Price</dt><dd className="mt-2 text-sm text-ink">{amount(data.subscription.plan?.price)} / {data.subscription.plan?.interval || "—"}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Trial ends</dt><dd className="mt-2 text-sm text-ink">{date(data.subscription.trialEndsAt)}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Renewal date</dt><dd className="mt-2 text-sm text-ink">{date(data.subscription.renewalDate)}</dd></div><div><dt className="text-xs font-medium uppercase text-ink-subtle">Auto-renew</dt><dd className="mt-2 text-sm text-ink">{data.subscription.autoRenew ? "On" : "Off"}</dd></div></dl>
        <div className="mt-5 rounded-lg bg-canvas p-4"><p className="text-sm font-medium text-ink">Plan limits</p><p className="mt-1 text-sm text-ink-muted">{data.subscription.plan?.limits?.members == null ? "Unlimited members" : `Up to ${data.subscription.plan.limits.members} members`} · {data.subscription.plan?.limits?.trainers == null ? "unlimited trainers" : `up to ${data.subscription.plan.limits.trainers} trainers`}</p></div>
        <p className="mt-4 text-xs text-ink-muted">Fitivo online payment processing is not configured. Open invoices require manual payment through the method provided by Fitivo.</p>
      </Card>}
      {data.manualBillingInstructions && <Card className="p-5"><h2 className="font-semibold text-ink">Manual payment instructions</h2><p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{data.manualBillingInstructions}</p></Card>}
      <Card className="overflow-x-auto p-4 md:p-6"><h2 className="mb-4 text-lg font-semibold text-ink">Fitivo invoices</h2>{!data.subscription?.invoices?.length ? <p className="py-5 text-center text-sm text-ink-muted">No Fitivo invoices have been issued.</p> : <table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Invoice</th><th className="px-3 py-3">Plan period</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Payment reference</th></tr></thead><tbody>{data.subscription.invoices.map((invoice) => <tr key={invoice.id} className="border-b border-line last:border-0"><td className="px-3 py-3"><span className="font-medium text-ink">{invoice.invoiceNumber}</span><span className="block text-xs text-ink-muted">Issued {date(invoice.issuedAt)}</span></td><td className="px-3 py-3 text-ink-muted">{date(invoice.periodStart)} – {date(invoice.periodEnd)}</td><td className="px-3 py-3 text-ink-muted">{amount(invoice.amountDue)}</td><td className="px-3 py-3"><Badge tone={tone(invoice.status)}>{invoice.status}</Badge></td><td className="px-3 py-3 text-ink-muted">{invoice.paymentReference || "—"}</td></tr>)}</tbody></table>}</Card>
    </>}
  </div>;
}
