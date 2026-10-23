"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarCheck2, CalendarClock, Dumbbell, Minus, ReceiptText, Users } from "lucide-react";
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

const number = (value) => Number.isFinite(value) ? value.toLocaleString("en-PK") : "—";
const money = (value) => Number.isFinite(value) ? `PKR ${number(value)}` : "—";
const dateLabel = (value) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

function MiniBarChart({ points, label, tone = "brand", categories = false }) {
  if (!points.length) return <div className="owner-kpi-chart-empty" role="img" aria-label={`${label}: no data`}>No data yet</div>;
  const chartLabel = `${label}: ${points.map(({ tooltip }) => tooltip).join("; ")}`;
  return <div className={`owner-kpi-chart is-${tone}`} role="img" aria-label={chartLabel}>
    <div className="owner-kpi-bars" aria-hidden="true">{points.map((point) => <span className="owner-kpi-bar-slot" key={point.key} title={point.tooltip}>
      <i style={{ height: `${point.heightPercent}%` }} />
    </span>)}</div>
    <div className="owner-kpi-axis" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }} aria-hidden="true">{points.map((point, index) => <span key={point.key} title={point.label}>{categories ? (point.label === "Other members" ? "Other" : index + 1) : point.label}</span>)}</div>
  </div>;
}

function KpiTrend({ comparison, periodLabel }) {
  if (!comparison) return <span className="owner-kpi-trend neutral"><Minus size={14} aria-hidden="true" />No comparable period</span>;
  const direction = comparison.direction || (comparison.difference > 0 ? "up" : comparison.difference < 0 ? "down" : "neutral");
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const percent = comparison.percent;
  const tone = direction === "up" ? "positive" : direction === "down" ? "negative" : "neutral";
  const change = percent == null ? `${number(Math.abs(comparison.difference))} ${comparison.difference >= 0 ? "more" : "fewer"}` : `${Math.abs(percent)}% ${direction === "up" ? "up" : "down"}`;
  return <span className={`owner-kpi-trend ${tone}`}><Icon size={14} aria-hidden="true" />{direction === "neutral" ? "No change" : change}<span> · {periodLabel}</span></span>;
}

function OwnerKpiCard({ label, value, icon: Icon, visual, trend, description, tone = "violet", loading, error }) {
  return <Card className={`owner-kpi-card tone-${tone}`} aria-busy={loading || undefined}>
    <div className="owner-kpi-top"><div className="owner-kpi-label">{label}</div><span className="owner-kpi-icon" aria-hidden="true"><Icon size={19} strokeWidth={1.8} /></span></div>
    {loading ? <><Skeleton className="owner-kpi-skeleton" /><span className="sr-only">Loading {label}</span></> : <>
      <div className="owner-kpi-value">{value}</div>
      <div className="owner-kpi-visual-row">{visual}</div>
      {!error && trend?.comparison && <div className="owner-kpi-meta"><KpiTrend comparison={trend.comparison} periodLabel={trend.periodLabel} /></div>}
      <div className="owner-kpi-description">{error ? "Analytics unavailable" : description}</div>
    </>}
  </Card>;
}

function MembershipRing({ active, total }) {
  const ratio = total > 0 ? Math.min(100, active / total * 100) : 0;
  return <div className="owner-kpi-ring" style={{ "--kpi-progress": `${ratio}%` }} role="img" aria-label={`${number(active)} active subscriptions out of ${number(total)} total subscriptions`}><span>{total ? `${Math.round(ratio)}%` : "—"}</span></div>;
}

function DuesBars({ members }) {
  return <MiniBarChart points={buildDuesChart(members)} tone="amber" categories label="Outstanding dues by member balance; top four members plus the remaining balance" />;
}

function PanelHeading({ title, description, action }) {
  return <div className="owner-panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

function PanelSkeleton({ label }) {
  return <div className="owner-panel-skeleton" role="status"><span className="sr-only">Loading {label}</span><Skeleton /><Skeleton /><Skeleton /></div>;
}

function ExpiringList({ resource, paginated = false }) {
  if (resource.loading) return <PanelSkeleton label="expiring memberships" />;
  if (resource.error) return <ErrorState title="Could not load expiring memberships" description={resource.error} onRetry={resource.retry} />;
  // The existing date filter can also return cancelled terms; honor its serialized status.
  const members = resource.data.items.filter(({ status }) => status === "Expiring");
  if (!members.length) return <EmptyState icon={<CalendarClock size={24} strokeWidth={1.75} />} title="No expiring memberships to show"
    description={paginated || resource.data.total > resource.data.items.length ? "No current memberships are expiring in this page of results." : "No current memberships end in the next seven days."} />;
  return <ul className="owner-expiring-list">{members.map((member) => <li key={member._id}>
    <Link href={`/members/${member._id}`} className="owner-member-link"><Avatar name={member.fullName} size="sm" /><span><strong>{member.fullName}</strong><small>{member.plan?.name || "Plan unavailable"}</small></span></Link>
    <Badge tone="warning">{member.daysRemaining === 0 ? "Today" : `In ${member.daysRemaining} ${member.daysRemaining === 1 ? "day" : "days"}`}</Badge>
  </li>)}</ul>;
}

function ExpiringDirectory() {
  const [page, setPage] = useState(1);
  const resource = useDashboardResource(`/api/members?status=expiring&accountStatus=active&limit=10&page=${page}`);
  return <div className="owner-expiring-directory">
    <ExpiringList resource={resource} paginated />
    <nav className="owner-list-pagination" aria-label="Expiring memberships pages">
      <Button type="button" variant="secondary" size="sm" disabled={resource.loading || page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
      <span aria-live="polite">Page {page}</span>
      <Button type="button" variant="secondary" size="sm" disabled={resource.loading || !!resource.error || page * 10 >= (resource.data?.total ?? 0)} onClick={() => setPage((value) => value + 1)}>Next</Button>
    </nav>
  </div>;
}

const paymentColumns = [
  { key: "member", label: "Member", render: (row) => row.member ? <Link className="owner-member-link" href={`/members/${row.memberId}`}><Avatar name={row.member.fullName} size="sm" /><strong>{row.member.fullName}</strong></Link> : "Member unavailable" },
  { key: "plan", label: "Plan", render: (row) => row.plan?.name || "Plan unavailable" },
  { key: "amountPaid", label: "Amount", render: (row) => <span className="owner-money">{money(row.amountPaid)}</span> },
  { key: "paymentDate", label: "Date", render: (row) => dateLabel(row.paymentDate) },
  { key: "status", label: "Status", render: (row) => <StatusPill status={derivePaymentStatus(row.amountPaid, row.amountDue)} /> },
];

const revenueColumns = [
  { key: "month", label: "Month", render: (row) => new Date(`${row.month}-01T00:00:00Z`).toLocaleDateString("en-PK", { month: "long", year: "numeric", timeZone: "UTC" }) },
  { key: "paymentCollected", label: "Revenue", render: (row) => <span className="owner-money">{money(row.paymentCollected)}</span> },
];

function MembersByPlan({ resource }) {
  if (resource.loading) return <PanelSkeleton label="members by plan" />;
  if (resource.error) return <ErrorState title="Could not load plan totals" description={resource.error} onRetry={resource.retry} />;
  const plans = [...(Array.isArray(resource.data) ? resource.data : [])].sort((a, b) => Number(a.durationDays) - Number(b.durationDays) || a.name.localeCompare(b.name));
  const total = plans.reduce((sum, plan) => sum + plan.memberCount, 0);
  if (!total) return <EmptyState icon={<Dumbbell size={24} strokeWidth={1.75} />} title="No members assigned to plans" description="Your plan breakdown will appear as members join." action={<Button variant="secondary" size="sm" href="/memberships">View plans</Button>} />;
  const colors = ["var(--chart-plan-short)", "var(--chart-plan-medium)", "var(--chart-plan-long)"];
  const getColor = (index) => colors[Math.round(index / Math.max(1, plans.length - 1) * (colors.length - 1))];
  return <div className="owner-plan-breakdown">
    <div className="owner-plan-bar" role="img" aria-label={`Members by plan: ${plans.map((plan) => `${plan.name}, ${number(plan.memberCount)}`).join("; ")}`}>
      {plans.filter((plan) => plan.memberCount > 0).map((plan) => {
        const index = plans.indexOf(plan);
        return <span key={plan._id} style={{ flexGrow: plan.memberCount, backgroundColor: getColor(index) }} />;
      })}
    </div>
    <ul className="owner-plan-legend">{plans.filter((plan) => plan.memberCount > 0).map((plan) => {
      const percent = Math.round((plan.memberCount / total) * 100);
      return <li key={plan._id}>
        <span className="owner-plan-legend-name"><i style={{ backgroundColor: getColor(plans.indexOf(plan)) }} aria-hidden="true" />{plan.name}</span>
        <span>{number(plan.memberCount)} · {percent}%</span>
      </li>;
    })}</ul>
  </div>;
}

export default function OwnerDashboardAnalytics({ counts }) {
  const report = useDashboardResource("/api/reports?dashboard=1");
  const attendance = useDashboardResource("/api/attendance/summary");
  const expiring = useDashboardResource("/api/members?status=expiring&accountStatus=active&limit=5&page=1");
  const payments = useDashboardResource("/api/payments?limit=5&page=1");
  const dues = useDashboardResource("/api/payments/dues");
  const plans = useDashboardResource("/api/plans?includeMemberCounts=true");
  const [expiringOpen, setExpiringOpen] = useState(false);
  const outstandingMembers = (dues.data || []).filter(({ balance }) => Number.isFinite(balance) && balance > 0);
  const pendingDuesTotal = outstandingMembers.reduce((sum, member) => sum + member.balance, 0);
  const signupKpi = report.data?.dashboardKpis?.signups;
  const signupPoints = buildDashboardTimeSeries(signupKpi?.series || [], { dateKey: "date", valueKey: "count", unit: "new members" });
  const attendancePoints = buildDashboardTimeSeries(attendance.data?.history || [], { dateKey: "date", valueKey: "count", unit: "check-ins" });
  const membershipTotal = report.data?.dashboardKpis?.totalSubscriptions;

  return <>
    <section className="owner-stats" aria-label="Gym overview" aria-busy={report.loading || attendance.loading || dues.loading || undefined}>
      <OwnerKpiCard label="Total members" value={number(counts.members)} icon={Users} tone="violet" loading={report.loading} error={report.error}
        visual={<MiniBarChart points={signupPoints} label="New member signups per day · Last 7 complete days" />}
        trend={{ comparison: signupKpi?.comparison, periodLabel: "vs previous 7 days" }} description="New signups · Last 7 complete days" />
      <OwnerKpiCard label="Active memberships" value={number(report.data?.summary.activeSubscriptions)} icon={Dumbbell} tone="blue" loading={report.loading} error={report.error}
        visual={<MembershipRing active={report.data?.summary.activeSubscriptions || 0} total={membershipTotal || 0} />}
        description={`${number(membershipTotal || 0)} total subscriptions · current status`} />
      <OwnerKpiCard label="Today's check-ins" value={number(attendance.data?.checkedInToday)} icon={CalendarCheck2} tone="green" loading={attendance.loading} error={attendance.error}
        visual={<MiniBarChart points={attendancePoints} label="Daily check-ins · Last 7 gym-local days" tone="green" />}
        trend={{ comparison: attendance.data?.comparison, periodLabel: "vs same time yesterday" }} description={`${number(attendance.data?.currentlyInside)} currently inside · gym local`} />
      <OwnerKpiCard label="Pending dues" value={dues.error ? "—" : <><span className="owner-currency">PKR</span>{number(pendingDuesTotal)}</>} icon={ReceiptText} tone="amber" loading={dues.loading} error={dues.error}
        visual={<DuesBars members={outstandingMembers} />} description={`${number(outstandingMembers.length)} members · largest balances`} />
    </section>
    {attendance.error && <ErrorState title="Could not load today's check-ins" description={attendance.error} onRetry={attendance.retry} />}
    {dues.error && <ErrorState title="Could not load pending dues" description={dues.error} onRetry={dues.retry} />}

    <section className="owner-dashboard-row" aria-label="Revenue">
      <ChartCard
        className="owner-revenue-wide owner-revenue-card"
        title="Revenue"
        description="Member payments collected · Last 6 months · PKR"
        action={<Link className="owner-text-link" href="/reports">View reports<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" /></Link>}
        ariaLabel="Revenue collected by month"
        loading={report.loading}
        loadingLabel="revenue"
        table={{ caption: "Revenue collected by month", columns: revenueColumns, rows: report.data?.months || [], getRowKey: (row) => row.month }}
      >
        {report.error ? <ErrorState title="Could not load revenue and memberships" description={report.error} onRetry={report.retry} /> : <OwnerRevenueChart months={report.data?.months || []} />}
      </ChartCard>
    </section>

    <section className="owner-dashboard-row" aria-label="Payments and plans">
      <Card className="owner-panel owner-payments-card">
        <PanelHeading title="Recent payments" description="Latest recorded member payments" action={<Link className="owner-text-link" href="/payments">View all<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" /></Link>} />
        {payments.error ? <ErrorState title="Could not load recent payments" description={payments.error} onRetry={payments.retry} /> : <DataTable columns={paymentColumns} rows={payments.data?.items || []} getRowKey={(row) => row._id} caption="Recent payments" loading={payments.loading}
          emptyMessage="No payments recorded yet" emptyDescription="Record your first payment to see it here." emptyAction={<Button href="/payments" variant="secondary" size="sm">View payments</Button>} />}
      </Card>
      <div className="owner-dashboard-stack">
        <Card className="owner-panel owner-plan-card">
          <PanelHeading title="Members by plan" description="All member accounts assigned to each plan" />
          <MembersByPlan resource={plans} />
        </Card>
        <Card className="owner-panel owner-expiring-card">
          <PanelHeading title="Expiring soon" description="Memberships ending in the next 7 days" />
          <ExpiringList resource={expiring} />
          <button type="button" className="owner-text-link owner-panel-link" onClick={() => setExpiringOpen(true)}>View all expiring<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" /></button>
        </Card>
      </div>
    </section>

    <Drawer open={expiringOpen} onClose={() => setExpiringOpen(false)} title="Expiring memberships" description="Active member accounts ending in the next seven days.">
      {expiringOpen && <ExpiringDirectory />}
    </Drawer>
  </>;
}
