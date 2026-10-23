"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, Check, Circle, CreditCard, Dumbbell, Plus, Users, UserRound } from "lucide-react";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import PageHeader from "../ui/page-header";
import { PageSkeleton } from "../ui/skeleton";
import StatusPill from "../ui/status-pill";
import OwnerDashboardAnalytics from "./owner-dashboard-analytics";
import { getOwnerSetupSteps } from "../../lib/ownerDashboardRules.js";

const features = [
  { label: "Members", href: "/members", Icon: Users },
  { label: "Plans", href: "/memberships", Icon: Dumbbell },
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
    setError("");
    setRetryCount((count) => count + 1);
  }

  if (loading) return <PageSkeleton label="Loading gym dashboard" />;
  if (error) return <ErrorState title="Could not load your dashboard" description={error} onRetry={retry} />;
  if (!data?.gym || !data?.counts) return <Card className="owner-panel"><EmptyState title="Your gym workspace could not be found" description="Ask your platform administrator to check your owner access." /></Card>;

  const steps = getOwnerSetupSteps(data.counts);
  const setupComplete = steps.every(({ complete }) => complete);

  return <div className="owner-dashboard">
    <PageHeader title="Dashboard" description={`${data.gym.name || "Your gym"} · Your daily overview of members, revenue, and attendance.`}
      actions={<Button href="/members/new"><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Add member</Button>} />

    <OwnerDashboardAnalytics counts={data.counts} />

    {!setupComplete && <Card className="owner-panel owner-setup">
      <div className="owner-panel-heading"><div><h2>Finish setting up your gym</h2><p>Complete these steps to start managing your membership workflow.</p></div></div>
      <ol className="owner-setup-steps">
        {steps.map((step) => <li key={step.key}>
          <span className="owner-setup-icon" aria-hidden="true">{step.complete ? <Check size={18} strokeWidth={1.75} /> : <Circle size={18} strokeWidth={1.75} />}</span>
          <div><p>{step.label}</p>{step.complete ? <span className="owner-muted">Complete</span> : <Link className="owner-text-link" href={step.href}>Start setup<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" /></Link>}</div>
        </li>)}
      </ol>
    </Card>}

    <div className="owner-workspace-links">
      <nav aria-label="Gym management">{features.map(({ label, href, Icon }) => <Link key={href} href={href}><Icon size={16} strokeWidth={1.75} aria-hidden="true" />{label}</Link>)}</nav>
      <StatusPill status={data.gym.status}>{data.gym.status === "active" ? "Gym active" : data.gym.status === "suspended" ? "Gym suspended" : "Gym unavailable"}</StatusPill>
    </div>
  </div>;
}
