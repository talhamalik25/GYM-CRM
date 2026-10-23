"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Card from "../ui/card";
import ErrorState from "../ui/error-state";
import StatCard from "../ui/stat-card";
import AnalyticsBarChart from "../dashboard/analytics-bar-chart";

function monthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

function Metric({ label, value, detail }) {
  return <StatCard label={label} value={Number(value).toLocaleString("en-PK")} description={detail} />;
}

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

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
  }, [retryCount]);

  return <div className="admin-dashboard">
    <section aria-label="Platform summary" className="dashboard-platform-section">
      <div className="dashboard-section-heading"><h2>Platform footprint</h2><p>Current Gym workspace and user account totals.</p></div>
      <div className="dashboard-metrics-grid dashboard-platform-metrics">
      {loading ? ["Gyms", "Active gyms", "Suspended gyms", "User accounts", "Active accounts", "Inactive accounts", "Superadmin accounts"].map((label) => <StatCard key={label} label={label} loading description="Loading platform counts…" />) : error ? <Card className="dashboard-state-card p-5"><ErrorState title="Could not load platform overview" description={error} onRetry={() => { setError(""); setLoading(true); setRetryCount((count) => count + 1); }} loading={loading} /></Card> : <>
        <Metric label="Gyms" value={overview.gyms.total} detail="Registered Gym workspaces" />
        <Metric label="Active gyms" value={overview.gyms.active} detail="Workspaces not administratively suspended" />
        <Metric label="Suspended gyms" value={overview.gyms.suspended} detail="Workspaces with access suspended" />
        <Metric label="User accounts" value={overview.userAccounts.total} detail="All platform accounts" />
        <Metric label="Active accounts" value={overview.userAccounts.active} detail="Accounts enabled to sign in" />
        <Metric label="Inactive accounts" value={overview.userAccounts.inactive} detail="Accounts disabled from signing in" />
        <Metric label="Superadmin accounts" value={overview.userAccounts.platformSuperadmins} detail="Accounts with platform-wide administration role" />
      </>}
      </div>
    </section>
    {!loading && !error && overview.gyms.total === 0 && <Card className="mt-5 p-5"><p className="text-sm text-ink-muted">No Gym workspaces have been registered yet.</p></Card>}
    {!loading && !error && <section aria-label="Operational attention" className="dashboard-section">
      <div className="dashboard-section-heading"><h2>Operational attention</h2><p>Items that may need platform follow-up.</p></div>
      <Metric label="Gyms without an owner" value={overview.operations.gymsWithoutOwner} detail="Workspaces needing owner assignment" />
      <Metric label="Open Fitivo invoices" value={overview.operations.openInvoices} detail="Awaiting verified manual reconciliation" />
      <Metric label="Restricted SaaS subscriptions" value={overview.operations.restrictedSaaSGyms} detail="Past due, cancelled, or beyond term dates" />
    </section>}
    {loading && <section aria-label="Platform analytics" className="dashboard-analytics-grid admin-analytics-grid" role="status">
      {["Gym status", "SaaS subscription status", "Fitivo invoices and collections", "Gym onboarding"].map((label) => <Card className="dashboard-chart-card dashboard-chart-loading p-5" key={label}><h3>{label}</h3><div className="dashboard-chart-skeleton" /></Card>)}
    </section>}
    {!loading && !error && <section aria-label="Platform analytics" className="dashboard-analytics-grid admin-analytics-grid">
      <AnalyticsBarChart
        title="Gym status"
        description="Administrative access state across all workspaces"
        categories={[{ key: "active", label: "Active", color: "var(--success)" }, { key: "suspended", label: "Suspended", color: "var(--danger)" }]}
        series={[{ key: "gyms", label: "Gyms", color: "var(--brand)", values: overview.analytics.gymStatus }]}
        emptyMessage="No Gym workspaces have been registered yet."
      />
      <AnalyticsBarChart
        title="SaaS subscription status"
        description="Subscription state includes terms that have passed their end date"
        categories={[{ key: "trialing", label: "Trialing", color: "var(--brand)" }, { key: "active", label: "Active", color: "var(--success)" }, { key: "past_due", label: "Past due", color: "var(--warning)" }, { key: "expired", label: "Expired", color: "var(--danger)" }, { key: "cancelled", label: "Cancelled", color: "var(--ink-subtle)" }, { key: "unconfigured", label: "Unconfigured", color: "var(--ink-subtle)" }]}
        series={[{ key: "subscriptions", label: "Gyms", color: "var(--brand)", values: overview.analytics.saasStatus }]}
        emptyMessage="No Gym workspaces have been registered yet."
      />
      <AnalyticsBarChart
        title="Fitivo invoices and collections"
        description="Invoice amounts issued versus manually verified collections · last six months"
        categories={overview.analytics.months.map((month) => ({ key: month.month, label: monthLabel(month.month) }))}
        series={[
          { key: "invoiced", label: "Invoiced", color: "var(--warning)", values: Object.fromEntries(overview.analytics.months.map((month) => [month.month, month.invoiced])) },
          { key: "collected", label: "Collected", color: "var(--success)", values: Object.fromEntries(overview.analytics.months.map((month) => [month.month, month.collected])) },
        ]}
        formatValue={money}
        className="dashboard-chart-wide"
        emptyMessage="No non-zero Fitivo invoice amounts were issued in this period."
      />
      <AnalyticsBarChart
        title="Gym onboarding"
        description="New Gym workspaces by creation month · last six months"
        categories={overview.analytics.months.map((month) => ({ key: month.month, label: monthLabel(month.month) }))}
        series={[{ key: "gyms-onboarded", label: "New Gyms", color: "var(--brand)", values: Object.fromEntries(overview.analytics.months.map((month) => [month.month, month.gymsOnboarded])) }]}
        className="dashboard-chart-wide"
        emptyMessage="No Gym workspaces were created in this period."
      />
    </section>}
    {!loading && !error && <section aria-label="Platform management" className="dashboard-section dashboard-management-section">
      <div className="dashboard-section-heading"><h2>Platform management</h2><p>Shortcuts to the main administration workflows.</p></div>
      <div className="dashboard-actions-grid">
        <Card className="dashboard-action-card p-5"><h3 className="font-semibold text-ink">Gym management</h3><p className="mt-2 text-sm text-ink-muted">Review workspaces, owner assignments, and access status.</p><Link className="dashboard-action-link mt-4 inline-block text-sm font-medium text-brand hover:underline" href="/admin/gyms">Manage Gyms →</Link></Card>
        <Card className="dashboard-action-card p-5"><h3 className="font-semibold text-ink">User administration</h3><p className="mt-2 text-sm text-ink-muted">Review account status and create staff accounts.</p><Link className="dashboard-action-link mt-4 inline-block text-sm font-medium text-brand hover:underline" href="/admin/users">Manage accounts →</Link></Card>
        <Card className="dashboard-action-card p-5"><h3 className="font-semibold text-ink">Fitivo subscriptions</h3><p className="mt-2 text-sm text-ink-muted">Configure SaaS tiers, Gym subscription terms, and manual invoices.</p><Link className="dashboard-action-link mt-4 inline-block text-sm font-medium text-brand hover:underline" href="/admin/billing">Manage plans &amp; billing →</Link></Card>
      </div>
    </section>}
  </div>;
}
