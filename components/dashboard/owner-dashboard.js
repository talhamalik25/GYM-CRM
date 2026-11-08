"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Circle,
  CreditCard,
  Dumbbell,
  Plus,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import { PageSkeleton } from "../ui/skeleton";
import StatusPill from "../ui/status-pill";
import OwnerDashboardAnalytics from "./owner-dashboard-analytics";
import { getOwnerSetupSteps } from "../../lib/ownerDashboardRules.js";

// Workspace routes contract preserved for testing
const workspaceRoutes = [
  { href: "/members", label: "Members" },
  { href: "/memberships", label: "Plans" },
  { href: "/trainers", label: "Trainers" },
  { href: "/attendance", label: "Attendance" },
  { href: "/payments", label: "Payments" },
];

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/owner", { cache: "no-store" })
      .then(async (response) => {
        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error("The server returned an unreadable response.");
        }
        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Could not load your gym dashboard.");
        }
        if (!cancelled) setData(result.data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.message === "Select an account with exactly one active gym membership."
              ? "Your account needs exactly one active Gym assignment. Ask a platform superadmin to assign your staff account under Gym accounts, then try again."
              : requestError.message || "Could not load your gym dashboard."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  function retry() {
    setLoading(true);
    setError("");
    setRetryCount((count) => count + 1);
  }

  if (loading) return <PageSkeleton label="Loading gym dashboard" />;
  if (error) return <ErrorState title="Could not load your dashboard" description={error} onRetry={retry} />;
  if (!data?.gym || !data?.counts) {
    return (
      <Card className="p-8">
        <EmptyState
          title="Your gym workspace could not be found"
          description="Ask your platform administrator to check your owner access."
        />
      </Card>
    );
  }

  const steps = getOwnerSetupSteps(data.counts);
  const completedCount = steps.filter(({ complete }) => complete).length;
  const setupComplete = steps.every(({ complete }) => complete);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Operational Command Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
            <StatusPill status={data.gym.status}>
              {data.gym.status === "active"
                ? "Gym active"
                : data.gym.status === "suspended"
                ? "Gym suspended"
                : "Gym unavailable"}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-ink-muted">
            <span className="font-semibold text-ink">{data.gym.name || "Your gym"}</span> · Daily overview of members, revenue, and attendance.
          </p>
        </div>

        {/* Quick Operational Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button href="/members/new" className="h-9 px-3.5 text-xs font-semibold shadow-xs">
            <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
            Add member
          </Button>
          <Button href="/payments" variant="secondary" className="h-9 px-3.5 text-xs font-semibold">
            <CreditCard size={14} strokeWidth={1.8} aria-hidden="true" />
            Record payment
          </Button>
          <Button href="/attendance" variant="secondary" className="h-9 px-3.5 text-xs font-semibold">
            <CalendarCheck2 size={14} strokeWidth={1.8} aria-hidden="true" />
            Check-in
          </Button>
        </div>
      </div>

      {/* Main Analytics or Non-entitled Fallback */}
      {data.entitlements?.features?.advancedAnalytics ? (
        <OwnerDashboardAnalytics counts={data.counts} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(data.counts).map(([label, count]) => (
              <Card key={label} className="p-6 rounded-2xl border border-line bg-surface shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted capitalize">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-ink">{count}</p>
              </Card>
            ))}
          </div>
          <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                <Sparkles size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Unlock Advanced Operations Analytics</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Real-time revenue trends, attendance tracking, and dues breakdown are available with Pro and Professional.
                </p>
              </div>
            </div>
            <Button href="/billing" className="h-10 px-4 text-xs font-semibold shrink-0">
              Compare plans
            </Button>
          </Card>
        </div>
      )}

      {/* Onboarding Setup Guidance Card */}
      {!setupComplete && (
        <Card className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Finish setting up your gym</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Complete these steps to start managing your membership workflow.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-ink-muted whitespace-nowrap">
                {completedCount} of {steps.length} steps complete
              </span>
              <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${(completedCount / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.key}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  step.complete
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-line bg-surface-raised hover:border-line-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid size-7 place-items-center rounded-full shrink-0 text-xs ${
                      step.complete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-surface border border-line text-ink-subtle"
                    }`}
                    aria-hidden="true"
                  >
                    {step.complete ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <Circle size={14} strokeWidth={2} />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{step.label}</p>
                    <p className="text-[11px] text-ink-subtle mt-0.5">
                      {step.complete ? "Setup verified" : "Action required"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  {step.complete ? (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Check size={12} strokeWidth={2.5} /> Complete
                    </span>
                  ) : (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                    >
                      Start setup <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
