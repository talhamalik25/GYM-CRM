"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Card from "../ui/card";

function Metric({ label, value, detail }) {
  return <Card className="p-5">
    <p className="text-sm text-ink-muted">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value.toLocaleString()}</p>
    <p className="mt-2 text-xs text-ink-subtle">{detail}</p>
  </Card>;
}

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        let result;
        try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load platform overview.");
        return result.data;
      })
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message || "Could not load platform overview."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return <>
    <section aria-label="Platform summary" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {loading ? ["Gyms", "Active gyms", "Suspended gyms", "User accounts", "Active accounts", "Inactive accounts", "Superadmin accounts"].map((label) => <Card key={label} className="p-5"><p className="text-sm text-ink-muted">{label}</p><p className="mt-3 text-3xl font-semibold text-ink" aria-label={`Loading ${label.toLowerCase()}`}>—</p><p className="mt-2 text-xs text-ink-subtle" role="status">Loading platform counts…</p></Card>) : error ? <Card className="p-5 sm:col-span-2 xl:col-span-4"><p className="text-sm text-error" role="alert">{error}</p></Card> : <>
        <Metric label="Gyms" value={overview.gyms.total} detail="Registered Gym workspaces" />
        <Metric label="Active gyms" value={overview.gyms.active} detail="Workspaces not administratively suspended" />
        <Metric label="Suspended gyms" value={overview.gyms.suspended} detail="Workspaces with access suspended" />
        <Metric label="User accounts" value={overview.userAccounts.total} detail="All platform accounts" />
        <Metric label="Active accounts" value={overview.userAccounts.active} detail="Accounts enabled to sign in" />
        <Metric label="Inactive accounts" value={overview.userAccounts.inactive} detail="Accounts disabled from signing in" />
        <Metric label="Superadmin accounts" value={overview.userAccounts.platformSuperadmins} detail="Accounts with platform-wide administration role" />
      </>}
    </section>
    {!loading && !error && overview.gyms.total === 0 && <Card className="mt-5 p-5"><p className="text-sm text-ink-muted">No Gym workspaces have been registered yet.</p></Card>}
    {!loading && !error && <section aria-label="Operational attention" className="mt-5 grid gap-4 sm:grid-cols-3">
      <Metric label="Gyms without an owner" value={overview.operations.gymsWithoutOwner} detail="Workspaces needing owner assignment" />
      <Metric label="Open Fitivo invoices" value={overview.operations.openInvoices} detail="Awaiting verified manual reconciliation" />
      <Metric label="Restricted SaaS subscriptions" value={overview.operations.restrictedSaaSGyms} detail="Past due, cancelled, or beyond term dates" />
    </section>}
    {!loading && !error && <section className="mt-7 grid gap-4 sm:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-ink">Gym management</h2><p className="mt-2 text-sm text-ink-muted">Review workspaces, owner assignments, and access status.</p><Link className="mt-4 inline-block text-sm font-medium text-brand hover:underline" href="/admin/gyms">Manage Gyms →</Link></Card>
      <Card className="p-5"><h2 className="font-semibold text-ink">User administration</h2><p className="mt-2 text-sm text-ink-muted">Review account status and create staff accounts.</p><Link className="mt-4 inline-block text-sm font-medium text-brand hover:underline" href="/admin/users">Manage accounts →</Link></Card>
      <Card className="p-5"><h2 className="font-semibold text-ink">Fitivo subscriptions</h2><p className="mt-2 text-sm text-ink-muted">Configure SaaS tiers, Gym subscription terms, and manual invoices.</p><Link className="mt-4 inline-block text-sm font-medium text-brand hover:underline" href="/admin/billing">Manage plans &amp; billing →</Link></Card>
    </section>}
  </>;
}
