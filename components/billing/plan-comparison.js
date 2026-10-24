"use client";
import { useState } from "react";
import Link from "next/link";
import Card from "../ui/card";
import Button from "../ui/button";
import { FEATURE_LABELS, snapshotEntitlements } from "../../lib/saasPlanRules.js";

export default function PlanComparison({ data, onRequested }) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function request(planId) {
    setBusy(planId); setError(""); setMessage("");
    try {
      const response = await fetch("/api/gym/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Could not request this plan.");
      setMessage(result.data.message); onRequested();
    } catch (error) { setError(error.message); } finally { setBusy(""); }
  }
  return <section className="space-y-5" aria-label="Compare Fitivo plans">
    <div><h2 className="text-xl font-semibold">Choose the right plan for your gym</h2><p className="mt-2 text-sm text-ink-muted">All prices are in PKR. A plan change starts a full billing term after verified payment. No automatic proration or credit applies.</p></div>
    {data.trial?.status === "trialing" && <Card className="p-5"><strong>{data.trial.remainingDays} days remaining in your free trial</strong><p className="mt-1 text-sm text-ink-muted">Trial features: {data.subscription?.plan?.name}. Request a paid plan before your trial ends.</p></Card>}
    <div className="grid gap-4 sm:grid-cols-3">{["members", "staff", "branches"].map((key) => {
      const used = data.usage?.[key] || 0; const limit = data.entitlements?.limits?.[key];
      return <Card key={key} className="p-5"><p className="text-sm capitalize text-ink-muted">{key === "members" ? "Active members" : key === "staff" ? "Staff accounts" : "Active branches"}</p><p className="mt-2 text-2xl font-semibold">{used} <span className="text-sm font-normal text-ink-muted">/ {limit ?? "Unlimited"}</span></p>{limit != null && <><progress className="mt-3 w-full accent-blue-600" aria-label={`${key} usage`} value={Math.min(used, limit)} max={Math.max(1, limit)} />{used >= limit * 0.8 && <p className="mt-1 text-xs text-warning">{used >= limit ? "Limit reached. Reduce usage or request an upgrade." : "Approaching your plan limit."}</p>}</>}</Card>;
    })}</div>
    {error && <p className="text-error" role="alert">{error}</p>}{message && <p className="text-success" role="status">{message}</p>}
    {data.planChangeRequest && <p className="rounded-lg bg-canvas p-4 text-sm">A plan request is awaiting Superadmin review. Your current access remains unchanged.</p>}
    <div className="grid items-stretch gap-5 lg:grid-cols-3">{data.plans?.map((plan) => {
      const entitlements = snapshotEntitlements(plan);
      const current = data.subscription?.planId === plan.id;
      return <Card className={`flex flex-col p-6 ${current ? "ring-2 ring-blue-600" : ""}`} key={plan.id}>
        <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">{plan.name}</h3>{current && <span className="rounded-full bg-canvas px-3 py-1 text-xs">Current plan</span>}</div>
        <p className="mt-4 text-3xl font-semibold">PKR {plan.price.toLocaleString("en-PK")}</p><p className="mt-1 text-sm text-ink-muted">per {plan.interval === "monthly" ? "month" : "year"}</p>
        <p className="mt-4 text-sm">{entitlements.limits.members ?? "Unlimited"} active members · {entitlements.limits.staff ?? "Unlimited"} staff · {entitlements.limits.branches} branches</p>
        <ul className="my-5 flex-1 space-y-2 text-sm">{Object.entries(FEATURE_LABELS).map(([key, label]) => <li key={key} className={entitlements.features[key] ? "text-ink" : "text-ink-muted"}><span aria-hidden="true">{entitlements.features[key] ? "✓" : "—"}</span> {label}{!entitlements.features[key] && <span className="sr-only">: not included</span>}</li>)}</ul>
        <Button disabled={Boolean(busy) || Boolean(data.subscription?.pendingInvoiceId)} onClick={() => request(plan.id)}>{busy === plan.id ? "Requesting…" : current ? "Request renewal" : "Request plan change"}</Button>
      </Card>;
    })}</div>
    <p className="text-sm text-ink-muted">Staff limits count active non-owner memberships. Branch limits count active locations, including the main branch. Deactivated records and financial history are retained. Priority support identifies your entitlement; response times are arranged with Fitivo support.</p>
    {data.entitlements?.features?.multiBranch && <Link className="text-brand" href="/branches">Manage organization branches →</Link>}
  </section>;
}
