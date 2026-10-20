"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck2, CreditCard, Dumbbell, Users, UserRound } from "lucide-react";
import Button from "../ui/button";
import Card from "../ui/card";
import PageHeading from "../ui/page-heading";
import StatusBadge from "../ui/status-badge";
import OwnerDashboardAnalytics from "./owner-dashboard-analytics";
import { getOwnerSetupSteps } from "../../lib/ownerDashboardRules.js";

const features = [
  { label: "Members", href: "/members", Icon: Users },
  { label: "Plans and subscriptions", href: "/memberships", Icon: Dumbbell },
  { label: "Trainers", href: "/trainers", Icon: UserRound },
  { label: "Attendance", href: "/attendance", Icon: CalendarCheck2 },
  { label: "Payments", href: "/payments", Icon: CreditCard },
];

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/owner", { cache: "no-store" }).then(async (response) => {
      let result;
      try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load your gym dashboard.");
      if (!cancelled) setData(result.data);
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.message === "Select an account with exactly one active gym membership."
        ? "Your account needs exactly one active Gym assignment. Ask a platform superadmin to assign your staff account under Gym accounts, then try again."
        : requestError.message || "Could not load your gym dashboard.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [retryCount]);

  function retry() {
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  if (loading) return <div className="loading-page" role="status" aria-label="Loading gym dashboard"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-content" /></div>;
  if (error) return <Card className="p-6"><p className="text-sm text-error" role="alert">{error}</p><Button className="mt-4" variant="secondary" onClick={retry}>Try again</Button></Card>;
  if (!data?.gym || !data?.counts) return <Card className="p-6"><p className="text-sm text-ink-muted" role="status">Your gym workspace could not be found. Ask your platform administrator to check your owner access.</p></Card>;

  const steps = getOwnerSetupSteps(data.counts);
  const setupComplete = steps.every(({ complete }) => complete);
  const metrics = [
    ["Members", data.counts.members, "/members"],
    ["Membership plans", data.counts.plans, "/memberships"],
    ["Trainers", data.counts.trainers, "/trainers"],
  ];

  return <div className="dashboard-page owner-dashboard">
    <PageHeading eyebrow="GYM OWNER WORKSPACE" title={data.gym.name || "Your gym"} description={`${data.gym.slug || "Gym workspace"} · ${data.gym.timezone || "Timezone not set"}`} action={<StatusBadge>{data.gym.status === "active" ? "Active" : data.gym.status === "suspended" ? "Suspended" : "Unavailable"}</StatusBadge>} />

    {!setupComplete && <Card className="p-5 md:p-6">
      <h2 className="text-base font-semibold text-ink">Finish setting up your gym</h2>
      <p className="mt-1 text-sm text-ink-muted">Complete these steps to start managing your membership workflow.</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => <li key={step.key} className="rounded-lg border border-line p-4">
          <p className="text-sm font-medium text-ink">{step.complete ? "✓ " : "○ "}{step.label}</p>
          {step.complete ? <span className="mt-2 inline-block text-xs text-ink-muted">Complete</span> : <Link className="mt-2 inline-block text-sm font-medium text-brand hover:underline" href={step.href}>Start setup →</Link>}
        </li>)}
      </ol>
    </Card>}

    <section aria-label="Gym overview" className="dashboard-metrics-grid owner-metrics-grid">
      {metrics.map(([label, value, href]) => <Link key={label} href={href} className="dashboard-metric-link block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><Card className="dashboard-metric-card p-5"><p className="dashboard-metric-label text-sm text-ink-muted">{label}</p><p className="dashboard-metric-value mt-2 text-2xl font-semibold text-ink">{Number(value).toLocaleString("en-PK")}</p><span className="dashboard-metric-detail">View {label.toLowerCase()}</span></Card></Link>)}
    </section>

    <Card className="dashboard-section-card p-5 md:p-6">
      <div className="dashboard-section-heading"><h2>Gym management</h2><p>Go to the tools for your workspace.</p></div>
      <nav aria-label="Gym management" className="dashboard-owner-actions mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ label, href, Icon }) => <Link key={href} href={href} className="dashboard-owner-action flex items-center gap-3 rounded-lg border border-line p-4 text-sm font-medium text-ink hover:border-brand hover:text-brand"><Icon size={19} aria-hidden="true" />{label}<span className="ml-auto" aria-hidden="true">→</span></Link>)}
      </nav>
    </Card>

    <OwnerDashboardAnalytics />
  </div>;
}
