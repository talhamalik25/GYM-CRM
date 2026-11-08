"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarClock,
  Dumbbell,
  ReceiptText,
  Users,
} from "lucide-react";
import Avatar from "../ui/avatar";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import ChartCard from "../ui/chart-card";
import DataTable from "../ui/data-table";
import Drawer from "../ui/drawer";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import Skeleton from "../ui/skeleton";
import StatusPill from "../ui/status-pill";
import { derivePaymentStatus } from "../../lib/paymentHelpers";
import { buildDashboardTimeSeries, buildDuesChart } from "../../lib/dashboardChartRules.js";
import OwnerRevenueChart from "./owner-revenue-chart";
import useDashboardResource from "./use-dashboard-resource";

const number = (value) => (Number.isFinite(value) ? value.toLocaleString("en-PK") : "—");
const money = (value) => (Number.isFinite(value) ? `PKR ${number(value)}` : "—");
const dateLabel = (value) =>
  value
    ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

function MiniBarChart({ points, label, tone = "brand", categories = false }) {
  if (!points || !points.length || !points.some((p) => p.value > 0)) {
    return null;
  }

  const chartLabel = `${label}: ${points.map(({ tooltip }) => tooltip).join("; ")}`;
  const barColors = {
    brand: "bg-indigo-600",
    green: "bg-emerald-600",
    amber: "bg-amber-600",
  };
  const activeBarColor = barColors[tone] || barColors.brand;

  return (
    <div className="w-full pt-1" role="img" aria-label={chartLabel}>
      <div className="flex h-7 items-end gap-1" aria-hidden="true">
        {points.map((point) => (
          <span
            key={point.key}
            title={point.tooltip}
            className="group relative flex h-full flex-1 items-end rounded-t-[2px] bg-slate-100 transition-colors hover:bg-slate-200"
          >
            <i
              className={`w-full rounded-t-[2px] transition-all duration-300 ${activeBarColor}`}
              style={{ height: `${Math.max(point.heightPercent, point.value > 0 ? 10 : 0)}%` }}
            />
          </span>
        ))}
      </div>
      <div
        className="mt-1 grid gap-0.5 text-[9px] text-ink-subtle"
        style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {points.map((point, index) => (
          <span key={point.key} title={point.label} className="truncate text-center font-medium">
            {categories ? (point.label === "Other members" ? "Other" : index + 1) : point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function KpiTrend({ comparison, periodLabel }) {
  if (!comparison || (comparison.difference === 0 && comparison.percent == null)) {
    return null;
  }

  const direction =
    comparison.direction ||
    (comparison.difference > 0 ? "up" : comparison.difference < 0 ? "down" : "neutral");
  if (direction === "neutral") return null;

  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  const percent = comparison.percent;
  const change =
    percent != null
      ? `${Math.abs(percent)}%`
      : `${number(Math.abs(comparison.difference))}`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        direction === "up"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      <span>{change}</span>
      {periodLabel && <span className="font-normal text-ink-subtle/80 ml-0.5">· {periodLabel}</span>}
    </span>
  );
}

function OwnerKpiCard({
  label,
  value,
  icon: Icon,
  visual,
  trend,
  description,
  tone = "indigo",
  loading,
  error,
}) {
  const toneMap = {
    indigo: {
      iconBg: "bg-indigo-50/80 text-indigo-600 border-indigo-100/60",
    },
    emerald: {
      iconBg: "bg-emerald-50/80 text-emerald-600 border-emerald-100/60",
    },
    amber: {
      iconBg: "bg-amber-50/80 text-amber-600 border-amber-100/60",
    },
  };
  const styling = toneMap[tone] || toneMap.indigo;

  return (
    <Card
      className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-line-strong min-w-0"
      aria-busy={loading || undefined}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-ink-muted">
            {label}
          </span>
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg border text-xs ${styling.iconBg}`}
            aria-hidden="true"
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        </div>

        {loading ? (
          <div className="my-3 space-y-2">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-4 w-36 rounded-md" />
            <span className="sr-only">Loading {label}</span>
          </div>
        ) : (
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</div>
              {!error && trend?.comparison && (
                <KpiTrend comparison={trend.comparison} periodLabel={trend.periodLabel} />
              )}
            </div>
            {visual && <div className="mt-2">{visual}</div>}
            <div className="mt-2 text-xs text-ink-subtle truncate">
              {error ? "Analytics unavailable" : description}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function MembershipRing({ active, total }) {
  if (!total || total <= 0) return null;
  const ratio = Math.min(100, Math.round((active / total) * 100));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratio / 100) * circumference;

  return (
    <div
      className="flex items-center gap-2.5 mt-2 pt-2 border-t border-line/60"
      role="img"
      aria-label={`${number(active)} active subscriptions out of ${number(total)} total subscriptions`}
    >
      <div className="relative size-9 shrink-0">
        <svg className="size-full -rotate-90" viewBox="0 0 38 38">
          <circle
            cx="19"
            cy="19"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="19"
            cy="19"
            r={radius}
            className="stroke-indigo-600 transition-all duration-500 ease-out"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ink">
          {ratio}%
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">
          {number(active)} <span className="font-normal text-ink-muted">active</span>
        </p>
        <p className="text-[11px] text-ink-subtle truncate">of {number(total)} total</p>
      </div>
    </div>
  );
}

function DuesBars({ members }) {
  const points = buildDuesChart(members);
  if (!points.length || !points.some((p) => p.value > 0)) return null;
  return (
    <MiniBarChart
      points={points}
      tone="amber"
      categories
      label="Outstanding dues by member balance; top four members plus the remaining balance"
    />
  );
}

function PanelHeading({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3.5 border-b border-line">
      <div>
        <h2 className="text-sm font-bold tracking-tight text-ink">{title}</h2>
        {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function PanelSkeleton({ label }) {
  return (
    <div className="space-y-2.5 py-3" role="status">
      <span className="sr-only">Loading {label}</span>
      <Skeleton className="h-9 w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

function ExpiringList({ resource, paginated = false }) {
  if (resource.loading) return <PanelSkeleton label="expiring memberships" />;
  if (resource.error) {
    return (
      <ErrorState
        title="Could not load expiring memberships"
        description={resource.error}
        onRetry={resource.retry}
      />
    );
  }

  const members = resource.data?.items?.filter(({ status }) => status === "Expiring") || [];
  if (!members.length) {
    return (
      <EmptyState
        icon={<CalendarClock size={20} strokeWidth={1.8} />}
        title="No expiring memberships"
        description={
          paginated || resource.data.total > resource.data.items.length
            ? "No current memberships are expiring in this page of results."
            : "No current memberships end in the next seven days."
        }
        className="py-5 border-0 bg-transparent shadow-none"
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {members.map((member) => (
        <li key={member._id} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1">
          <Link
            href={`/members/${member._id}`}
            className="flex items-center gap-2.5 min-w-0 transition-opacity hover:opacity-80"
          >
            <Avatar name={member.fullName} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{member.fullName}</p>
              <p className="text-[11px] text-ink-subtle truncate">
                {member.plan?.name || "Plan unavailable"}
              </p>
            </div>
          </Link>
          <Badge tone={member.daysRemaining === 0 ? "error" : "warning"} className="shrink-0 text-[11px] font-semibold">
            {member.daysRemaining === 0
              ? "Today"
              : `In ${member.daysRemaining} ${member.daysRemaining === 1 ? "day" : "days"}`}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function ExpiringDirectory() {
  const [page, setPage] = useState(1);
  const resource = useDashboardResource(
    `/api/members?status=expiring&accountStatus=active&limit=10&page=${page}`
  );

  return (
    <div className="space-y-4">
      <ExpiringList resource={resource} paginated />
      <nav
        className="flex items-center justify-between border-t border-line pt-4"
        aria-label="Expiring memberships pages"
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={resource.loading || page === 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </Button>
        <span aria-live="polite" className="text-xs font-medium text-ink-muted">
          Page {page}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={resource.loading || !!resource.error || page * 10 >= (resource.data?.total ?? 0)}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}

const paymentColumns = [
  {
    key: "member",
    label: "Member",
    render: (row) =>
      row.member ? (
        <Link
          className="flex items-center gap-2.5 transition-colors hover:text-brand"
          href={`/members/${row.memberId}`}
        >
          <Avatar name={row.member.fullName} size="sm" />
          <strong className="font-semibold text-ink text-xs">{row.member.fullName}</strong>
        </Link>
      ) : (
        "Member unavailable"
      ),
  },
  { key: "plan", label: "Plan", render: (row) => row.plan?.name || "Plan unavailable" },
  {
    key: "amountPaid",
    label: "Amount",
    render: (row) => <span className="font-semibold text-ink text-xs">{money(row.amountPaid)}</span>,
  },
  { key: "paymentDate", label: "Date", render: (row) => dateLabel(row.paymentDate) },
  {
    key: "status",
    label: "Status",
    render: (row) => <StatusPill status={derivePaymentStatus(row.amountPaid, row.amountDue)} />,
  },
];

const revenueColumns = [
  {
    key: "month",
    label: "Month",
    render: (row) =>
      new Date(`${row.month}-01T00:00:00Z`).toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
  },
  {
    key: "paymentCollected",
    label: "Revenue",
    render: (row) => <span className="font-semibold text-ink">{money(row.paymentCollected)}</span>,
  },
];

function MembersByPlan({ resource }) {
  if (resource.loading) return <PanelSkeleton label="members by plan" />;
  if (resource.error) {
    return (
      <ErrorState
        title="Could not load plan totals"
        description={resource.error}
        onRetry={resource.retry}
      />
    );
  }

  const plans = [...(Array.isArray(resource.data) ? resource.data : [])].sort(
    (a, b) => Number(a.durationDays) - Number(b.durationDays) || a.name.localeCompare(b.name)
  );
  const total = plans.reduce((sum, plan) => sum + plan.memberCount, 0);

  if (!total) {
    return (
      <EmptyState
        icon={<Dumbbell size={20} strokeWidth={1.8} />}
        title="No plan members yet"
        description="Plan distribution will appear as members enroll."
        className="py-5 border-0 bg-transparent shadow-none"
        action={
          <Button variant="secondary" size="sm" href="/memberships">
            View plans
          </Button>
        }
      />
    );
  }

  const colors = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6"];
  const getColor = (index) => colors[index % colors.length];

  return (
    <div className="space-y-3.5 pt-1">
      {/* Distribution bar */}
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`Members by plan: ${plans
          .map((plan) => `${plan.name}, ${number(plan.memberCount)}`)
          .join("; ")}`}
      >
        {plans
          .filter((plan) => plan.memberCount > 0)
          .map((plan, index) => (
            <span
              key={plan._id}
              className="h-full transition-all duration-300"
              style={{
                flexGrow: plan.memberCount,
                backgroundColor: getColor(index),
              }}
            />
          ))}
      </div>

      {/* Legend list */}
      <ul className="divide-y divide-line/60">
        {plans
          .filter((plan) => plan.memberCount > 0)
          .map((plan, index) => {
            const percent = Math.round((plan.memberCount / total) * 100);
            return (
              <li
                key={plan._id}
                className="flex items-center justify-between py-2 text-xs font-medium text-ink first:pt-0 last:pb-0"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: getColor(index) }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{plan.name}</span>
                </span>
                <span className="text-ink-muted shrink-0 tabular-nums">
                  {number(plan.memberCount)} <span className="text-ink-subtle">({percent}%)</span>
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default function OwnerDashboardAnalytics({ counts }) {
  const report = useDashboardResource("/api/reports?dashboard=1");
  const attendance = useDashboardResource("/api/attendance/summary");
  const expiring = useDashboardResource(
    "/api/members?status=expiring&accountStatus=active&limit=5&page=1"
  );
  const payments = useDashboardResource("/api/payments?limit=5&page=1");
  const dues = useDashboardResource("/api/payments/dues");
  const plans = useDashboardResource("/api/plans?includeMemberCounts=true");
  const [expiringOpen, setExpiringOpen] = useState(false);

  const outstandingMembers = (dues.data || []).filter(
    ({ balance }) => Number.isFinite(balance) && balance > 0
  );
  const pendingDuesTotal = outstandingMembers.reduce((sum, member) => sum + member.balance, 0);
  const signupKpi = report.data?.dashboardKpis?.signups;
  const signupPoints = buildDashboardTimeSeries(signupKpi?.series || [], {
    dateKey: "date",
    valueKey: "count",
    unit: "new members",
  });
  const attendancePoints = buildDashboardTimeSeries(attendance.data?.history || [], {
    dateKey: "date",
    valueKey: "count",
    unit: "check-ins",
  });
  const membershipTotal = report.data?.dashboardKpis?.totalSubscriptions;

  return (
    <div className="space-y-6">
      {/* 1. Primary Operational KPIs */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        aria-label="Gym overview"
        aria-busy={report.loading || attendance.loading || dues.loading || undefined}
      >
        <OwnerKpiCard
          label="Total members"
          value={number(counts.members)}
          icon={Users}
          tone="indigo"
          loading={report.loading}
          error={report.error}
          visual={
            <MiniBarChart
              points={signupPoints}
              label="New member signups per day · Last 7 complete days"
            />
          }
          trend={{ comparison: signupKpi?.comparison, periodLabel: "vs prev 7d" }}
          description="New signups · Last 7 days"
        />

        <OwnerKpiCard
          label="Active memberships"
          value={number(report.data?.summary?.activeSubscriptions)}
          icon={Dumbbell}
          tone="indigo"
          loading={report.loading}
          error={report.error}
          visual={
            <MembershipRing active={report.data?.summary.activeSubscriptions || 0}
              total={membershipTotal || 0} />
          }
          description={`${number(membershipTotal || 0)} total subscriptions`}
        />

        <OwnerKpiCard
          label="Today's check-ins"
          value={number(attendance.data?.checkedInToday)}
          icon={CalendarCheck2}
          tone="emerald"
          loading={attendance.loading}
          error={attendance.error}
          visual={
            <MiniBarChart
              points={attendancePoints}
              label="Daily check-ins · Last 7 gym-local days"
              tone="green"
            />
          }
          trend={{ comparison: attendance.data?.comparison, periodLabel: "vs yesterday" }}
          description={`${number(attendance.data?.currentlyInside)} currently inside`}
        />

        <OwnerKpiCard
          label="Pending dues"
          value={
            dues.error ? (
              "—"
            ) : (
              <span className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-amber-700">PKR</span>
                <span>{number(pendingDuesTotal)}</span>
              </span>
            )
          }
          icon={ReceiptText}
          tone="amber"
          loading={dues.loading}
          error={dues.error}
          visual={<DuesBars members={outstandingMembers} />}
          description={`${number(outstandingMembers.length)} members with balance`}
        />
      </section>

      {attendance.error && (
        <ErrorState
          title="Could not load today's check-ins"
          description={attendance.error}
          onRetry={attendance.retry}
        />
      )}
      {dues.error && (
        <ErrorState
          title="Could not load pending dues"
          description={dues.error}
          onRetry={dues.retry}
        />
      )}

      {/* 2. Revenue Overview & Membership Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Revenue and plans">
        <div className="lg:col-span-2">
          <ChartCard
            className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs h-full"
            title="Revenue"
            description="Member payments collected · Last 6 months · PKR"
            action={
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                href="/reports"
              >
                View reports
                <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
            }
            ariaLabel="Revenue collected by month"
            loading={report.loading}
            loadingLabel="revenue"
            table={{
              caption: "Revenue collected by month",
              columns: revenueColumns,
              rows: report.data?.months || [],
              getRowKey: (row) => row.month,
            }}
          >
            {report.error ? (
              <ErrorState
                title="Could not load revenue and memberships"
                description={report.error}
                onRetry={report.retry}
              />
            ) : (
              <OwnerRevenueChart months={report.data?.months || []} />
            )}
          </ChartCard>
        </div>

        <Card className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <PanelHeading
              title="Members by plan"
              description="Active members enrolled in each plan"
            />
            <MembersByPlan resource={plans} />
          </div>
        </Card>
      </section>

      {/* 3. Operational Priorities: Upcoming Expirations & Outstanding Dues */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Operational priorities">
        {/* Expiring Soon Card */}
        <Card className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <PanelHeading
              title="Expiring soon"
              description="Memberships ending in the next 7 days"
              action={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  onClick={() => setExpiringOpen(true)}
                >
                  View all expiring
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              }
            />
            <div className="mt-3">
              <ExpiringList resource={expiring} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={() => setExpiringOpen(true)}
            >
              Open directory
            </Button>
          </div>
        </Card>

        {/* Outstanding Dues Card */}
        <Card className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <PanelHeading
              title="Outstanding dues"
              description="Members with pending fee balances"
              action={
                <Link
                  href="/payments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  View payments
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                </Link>
              }
            />
            <div className="mt-3">
              {dues.loading ? (
                <PanelSkeleton label="outstanding dues" />
              ) : outstandingMembers.length === 0 ? (
                <EmptyState
                  icon={<ReceiptText size={20} strokeWidth={1.8} />}
                  title="No outstanding dues"
                  description="All recorded member accounts are settled."
                  className="py-5 border-0 bg-transparent shadow-none"
                />
              ) : (
                <ul className="divide-y divide-line">
                  {outstandingMembers.slice(0, 5).map((member, idx) => (
                    <li
                      key={member.memberId || idx}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
                    >
                      <Link
                        href={`/members/${member.memberId}`}
                        className="flex items-center gap-2.5 min-w-0 transition-opacity hover:opacity-80"
                      >
                        <Avatar name={member.memberName} size="sm" />
                        <span className="text-xs font-semibold text-ink truncate">
                          {member.memberName}
                        </span>
                      </Link>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-700">
                          {money(member.balance)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center">
            <span className="text-xs text-ink-muted">
              Total: <strong className="text-ink font-semibold">{money(pendingDuesTotal)}</strong>
            </span>
            <Button href="/payments" variant="secondary" size="sm" className="text-xs">
              Manage dues
            </Button>
          </div>
        </Card>
      </section>

      {/* 4. Recent Payments Table */}
      <section aria-label="Recent payments">
        <Card className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
          <PanelHeading
            title="Recent payments"
            description="Latest member payments recorded in the workspace"
            action={
              <Link
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                href="/payments"
              >
                View all payments
                <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-4 overflow-x-auto">
            {payments.error ? (
              <ErrorState
                title="Could not load recent payments"
                description={payments.error}
                onRetry={payments.retry}
              />
            ) : (
              <DataTable
                columns={paymentColumns}
                rows={payments.data?.items || []}
                getRowKey={(row) => row._id}
                caption="Recent payments"
                loading={payments.loading}
                emptyMessage="No payments recorded yet"
                emptyDescription="Record your first payment to see it here."
                emptyAction={
                  <Button href="/payments" variant="secondary" size="sm">
                    Record payment
                  </Button>
                }
              />
            )}
          </div>
        </Card>
      </section>

      {/* Drawer for Expiring Directory */}
      <Drawer
        open={expiringOpen}
        onClose={() => setExpiringOpen(false)}
        title="Expiring memberships"
        description="Active member accounts ending in the next seven days."
      >
        {expiringOpen && <ExpiringDirectory />}
      </Drawer>
    </div>
  );
}
