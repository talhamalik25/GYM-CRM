"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Label, Line, LineChart, Pie, PieChart,
  Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ChartCard from "../ui/chart-card";
import ErrorState from "../ui/error-state";
import PageHeading from "../ui/page-heading";
import { formatReportCurrency } from "../../lib/reportRules.js";

const DEFAULT_FILTERS = { range: "30d", granularity: "day", startDate: "", endDate: "" };
const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
];
const STATUS_COLORS = ["var(--success)", "var(--warning)", "var(--chart-plan-medium)", "var(--danger)", "var(--grey-400)"];
const STATUS_LABELS = [
  ["active", "Active"],
  ["expiring", "Expiring soon"],
  ["upcoming", "Upcoming"],
  ["expired", "Expired"],
  ["cancelled", "Cancelled"],
];

const number = (value) => Number(value || 0).toLocaleString("en-PK");
const money = formatReportCurrency;

function defaultGranularity(range) {
  if (range === "6m" || range === "12m") return "month";
  if (range === "90d") return "week";
  return "day";
}

function comparison(current, previous, metric = "") {
  const suffix = metric ? ` ${metric}` : "";
  if (previous === 0) {
    return current === 0
      ? { direction: "neutral", tone: "neutral", label: `No change${suffix} vs prior period` }
      : { direction: "up", tone: "success", label: `New${suffix} this period` };
  }
  const difference = current - previous;
  const percent = Math.round((difference / previous) * 100);
  if (difference === 0) return { direction: "neutral", tone: "neutral", label: `No change${suffix} vs prior period` };
  return {
    direction: difference > 0 ? "up" : "down",
    tone: difference > 0 ? "success" : "warning",
    label: `${difference > 0 ? "+" : "−"}${Math.abs(percent)}%${suffix} vs prior period`,
  };
}

function TooltipContent({ active, payload, label, formatValue, valueLabel, dateContext = "" }) {
  if (!active || !payload?.length) return null;
  const periodLabel = payload[0]?.payload?.tooltipLabel || label;
  return <div className="reports-tooltip">
    <span>{dateContext ? `${periodLabel} · ${dateContext}` : periodLabel}</span>
    {payload.map((item) => <strong key={item.dataKey}>
      {payload.length > 1 ? `${item.name}: ` : `${valueLabel}: `}{formatValue(Number(item.value || 0))}
    </strong>)}
  </div>;
}

function DateRangeControls({ filters, report, onPreset, onCustomStart, onCustomEnd, onApplyCustom, onGranularity }) {
  const applied = report?.period;
  return <section className="reports-filters" aria-label="Report filters">
    <div className="reports-filter-main">
      <div className="reports-presets" role="group" aria-label="Choose a report period">
        {RANGE_OPTIONS.map((option) => <button
          key={option.value}
          type="button"
          className="reports-preset"
          aria-pressed={filters.range === option.value}
          onClick={() => onPreset(option.value)}
        >{option.label}</button>)}
        <button
          type="button"
          className="reports-preset"
          aria-pressed={filters.range === "custom"}
          onClick={() => onPreset("custom")}
        >Custom</button>
      </div>
      <label className="reports-interval-field">
        <span>Chart interval</span>
        <select value={filters.granularity} onChange={(event) => onGranularity(event.target.value)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </label>
    </div>
    {filters.range === "custom" && <form className="reports-custom-range" onSubmit={onApplyCustom}>
      <label><span>From</span><input type="date" value={filters.startDate} max={applied?.today || undefined} onChange={(event) => onCustomStart(event.target.value)} required /></label>
      <span className="reports-range-separator" aria-hidden="true">to</span>
      <label><span>To</span><input type="date" value={filters.endDate} max={applied?.today || undefined} onChange={(event) => onCustomEnd(event.target.value)} required /></label>
      <button className="reports-apply" type="submit">Apply range</button>
      <p>Choose up to 366 calendar days. Dates use the gym’s timezone.</p>
    </form>}
    {applied && <p className="reports-period-note">
      Showing {applied.startDate} – {applied.endDate} · {applied.timezone}
      {filters.range === "custom" && (filters.startDate !== applied.startDate || filters.endDate !== applied.endDate || filters.granularity !== applied.granularity) && " · Apply to update"}
    </p>}
  </section>;
}

function ChartFrame({ children, height = 300 }) {
  return <div className="reports-chart-scroll">
    <div className="reports-chart-frame" style={{ width: "100%", height }}>
      {children}
    </div>
  </div>;
}

function RevenueChart({ data }) {
  if (!data.some(({ paymentCollected }) => paymentCollected > 0)) {
    return <p className="reports-chart-empty" role="status">No member payments were recorded for this period.</p>;
  }
  return <ChartFrame>
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 300 }}>
      <BarChart data={data} accessibilityLayer margin={{ top: 14, right: 12, left: 8, bottom: 14 }}>
        <CartesianGrid vertical={false} stroke="var(--divider)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 11 }} tickMargin={12} interval="preserveStartEnd" minTickGap={20}>
          <Label value="Period" position="insideBottom" offset={-8} className="reports-axis-label" />
        </XAxis>
        <YAxis domain={[0, "auto"]} axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 11 }} tickFormatter={(value) => Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(value)} width={58} label={{ value: "PKR", angle: -90, position: "insideLeft", fill: "var(--ink-subtle)", fontSize: 11 }} />
        <Tooltip content={<TooltipContent formatValue={money} valueLabel="Member payments" />} />
        <Bar dataKey="paymentCollected" name="Member payments" fill="var(--brand)" radius={[5, 5, 0, 0]} maxBarSize={38} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

function AttendanceChart({ data }) {
  if (!data.some(({ attendanceCount }) => attendanceCount > 0)) {
    return <p className="reports-chart-empty" role="status">No check-ins were recorded for this period.</p>;
  }
  return <ChartFrame height={280}>
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 280 }}>
      <BarChart data={data} accessibilityLayer margin={{ top: 14, right: 10, left: 4, bottom: 14 }}>
        <CartesianGrid vertical={false} stroke="var(--divider)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 11 }} tickMargin={12} interval="preserveStartEnd" minTickGap={20}>
          <Label value="Period" position="insideBottom" offset={-8} className="reports-axis-label" />
        </XAxis>
        <YAxis domain={[0, "auto"]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 11 }} width={58} label={{ value: "Check-ins", angle: -90, position: "insideLeft", fill: "var(--ink-subtle)", fontSize: 11 }} />
        <Tooltip content={<TooltipContent formatValue={number} valueLabel="Check-ins" />} cursor={{ fill: "var(--brand-soft)" }} />
        <Bar dataKey="attendanceCount" name="Check-ins" fill="var(--chart-plan-medium)" radius={[5, 5, 0, 0]} maxBarSize={34} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

function AttendanceHeatmap({ days }) {
  if (!days.length) return null;
  const firstDate = new Date(`${days[0].date}T00:00:00.000Z`);
  const leadingCells = (firstDate.getUTCDay() + 6) % 7;
  const maxCount = Math.max(0, ...days.map(({ count }) => count));
  const cells = [...Array(leadingCells).fill(null), ...days];
  const intensity = (count) => {
    if (!count || !maxCount) return "var(--grey-100)";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "var(--chart-heat-2)";
    if (ratio <= 0.5) return "var(--chart-heat-3)";
    if (ratio <= 0.75) return "var(--chart-heat-4)";
    return "var(--chart-heat-5)";
  };
  const totalCheckIns = days.reduce((total, day) => total + day.count, 0);
  return <div className="reports-heatmap-section">
    <div className="reports-heatmap-heading">
      <div><h3>Daily attendance</h3><p>{number(totalCheckIns)} check-ins across {days.length} calendar days</p></div>
      <div className="reports-heatmap-key" aria-hidden="true"><span>Less</span>{[0, 0.25, 0.5, 0.75, 1].map((level) => <i key={level} style={{ backgroundColor: intensity(level ? maxCount * level : 0) }} />)}<span>More</span></div>
    </div>
    <div className="reports-heatmap-scroll">
      <div className="reports-heatmap" role="img" aria-label={`Daily attendance calendar from ${days[0].date} through ${days.at(-1).date}. ${number(totalCheckIns)} total check-ins.`}>
        {cells.map((day, index) => day ? <span key={day.date} title={`${day.date}: ${number(day.count)} check-ins`} style={{ backgroundColor: intensity(day.count) }} aria-hidden="true" /> : <span key={`offset-${index}`} className="reports-heatmap-spacer" aria-hidden="true" />)}
      </div>
    </div>
    <div className="reports-heatmap-weekdays" aria-hidden="true"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
  </div>;
}

function GrowthChart({ data }) {
  if (!data.some(({ newMembers, renewals }) => newMembers > 0 || renewals > 0)) {
    return <p className="reports-chart-empty" role="status">No members were registered or renewed during this period.</p>;
  }
  return <ChartFrame height={280}>
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 280 }}>
      <LineChart data={data} accessibilityLayer margin={{ top: 14, right: 10, left: 4, bottom: 14 }}>
        <CartesianGrid vertical={false} stroke="var(--divider)" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 11 }} tickMargin={12} interval="preserveStartEnd" minTickGap={20}>
          <Label value="Period" position="insideBottom" offset={-8} className="reports-axis-label" />
        </XAxis>
        <YAxis domain={[0, "auto"]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 11 }} width={58} label={{ value: "Members / renewals", angle: -90, position: "insideLeft", fill: "var(--ink-subtle)", fontSize: 10 }} />
        <Tooltip content={<TooltipContent formatValue={number} valueLabel="Members" />} />
        <Legend wrapperStyle={{ color: "var(--ink-muted)", fontSize: 11 }} />
        <Line type="linear" dataKey="newMembers" name="New members" stroke="var(--success)" strokeWidth={2.25} dot={data.length <= 31 ? { r: 2, strokeWidth: 0 } : false} activeDot={{ r: 5, strokeWidth: 2 }} isAnimationActive={false} />
        <Line type="linear" dataKey="renewals" name="Renewals" stroke="var(--chart-plan-medium)" strokeWidth={2.25} dot={data.length <= 31 ? { r: 2, strokeWidth: 0 } : false} activeDot={{ r: 5, strokeWidth: 2 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </ChartFrame>;
}

function MembershipChart({ statuses, asOf, total }) {
  const data = STATUS_LABELS.map(([key, label], index) => ({ key, label, count: Number(statuses?.[key] || 0), color: STATUS_COLORS[index] }));
  const activeMemberships = Number(statuses?.active || 0) + Number(statuses?.expiring || 0);
  const columns = [
    { key: "label", label: "Status" },
    { key: "count", label: "Members", render: (row) => number(row.count) },
    { key: "share", label: "Share", render: (row) => `${total ? Math.round((row.count / total) * 100) : 0}%` },
  ];
  return <ChartCard
    title="Membership status"
    description={`Current snapshot, independent of the selected period · As of ${asOf || "today"}`}
    ariaLabel="Current membership status distribution"
    table={{ caption: "Current membership status distribution", columns, rows: data, getRowKey: (row) => row.key }}
  >
    {total ? <div className="reports-status-layout">
      <div className="reports-donut-wrap" role="img" aria-label={`Membership status totals: ${data.map(({ label, count }) => `${label}, ${number(count)}`).join("; ")}`}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 240, height: 220 }}>
          <PieChart accessibilityLayer>
            <Pie data={data.filter(({ count }) => count > 0)} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="84%" paddingAngle={2} stroke="var(--surface)" strokeWidth={2} isAnimationActive={false}>
              {data.filter(({ count }) => count > 0).map((item) => <Cell key={item.key} fill={item.color} />)}
            </Pie>
            <Tooltip content={<TooltipContent formatValue={number} valueLabel="Members" dateContext={`As of ${asOf || "today"}`} />} />
            <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="reports-donut-total">{number(activeMemberships)}</text>
            <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="reports-donut-caption">active / expiring</text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="reports-status-legend">
        {data.map((item) => <li key={item.key}>
          <span className="reports-legend-label"><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span>
          <span>{number(item.count)} <small>{total ? `${Math.round((item.count / total) * 100)}%` : "0%"}</small></span>
        </li>)}
      </ul>
    </div> : <p className="reports-chart-empty" role="status">No member records are available yet.</p>}
    <p className="reports-status-note">Statuses are mutually exclusive: cancelled, upcoming, expired, expiring within 7 days, then active. This snapshot is independent of the selected activity period.</p>
  </ChartCard>;
}

function useReport(query) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const reload = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/reports?${query}`, { cache: "no-store", signal });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load reports.");
      setReport(result.data);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Could not load reports.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => reload(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [reload, retry]);
  return { report, loading, error, retry: () => setRetry((value) => value + 1) };
}

export default function ReportsManager() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [customError, setCustomError] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams({ range: appliedFilters.range, granularity: appliedFilters.granularity });
    if (appliedFilters.range === "custom") {
      params.set("startDate", appliedFilters.startDate);
      params.set("endDate", appliedFilters.endDate);
    }
    return params.toString();
  }, [appliedFilters]);
  const { report, loading, error, retry } = useReport(query);
  const compare = report?.summary?.periodComparison;
  function choosePreset(range) {
    if (range === "custom") {
      setFilters((current) => ({
        ...current,
        range,
        startDate: report?.period?.startDate || current.startDate,
        endDate: report?.period?.endDate || current.endDate,
      }));
      setCustomError("");
      return;
    }
    const next = { range, granularity: defaultGranularity(range), startDate: "", endDate: "" };
    setFilters(next);
    setAppliedFilters(next);
    setCustomError("");
  }

  function applyCustom(event) {
    event.preventDefault();
    if (!filters.startDate || !filters.endDate || filters.startDate > filters.endDate) {
      setCustomError("Choose a valid date range with the start on or before the end.");
      return;
    }
    setCustomError("");
    setAppliedFilters(filters);
  }

  const series = report?.series || [];
  const membershipTotal = report?.summary?.totalMembers || 0;
  const revenueTable = [
    { key: "label", label: "Period" },
    { key: "paymentCollected", label: "Member payments", render: (row) => money(row.paymentCollected) },
  ];
  const attendanceTable = [
    { key: "label", label: "Period" },
    { key: "attendanceCount", label: "Check-ins", render: (row) => number(row.attendanceCount) },
  ];
  const growthTable = [
    { key: "label", label: "Period" },
    { key: "newMembers", label: "New members", render: (row) => number(row.newMembers) },
    { key: "renewals", label: "Renewals", render: (row) => number(row.renewals) },
  ];

  return <div className="reports-page">
    <PageHeading eyebrow="INSIGHTS & ANALYTICS" title="Reports & Analytics" description="Explore member registrations, payment collections, attendance, and current membership health." />
    <DateRangeControls
      filters={filters}
      report={report}
      onPreset={choosePreset}
      onCustomStart={(startDate) => { setFilters((current) => ({ ...current, startDate })); setCustomError(""); }}
      onCustomEnd={(endDate) => { setFilters((current) => ({ ...current, endDate })); setCustomError(""); }}
      onApplyCustom={applyCustom}
      onGranularity={(granularity) => {
        const next = { ...filters, granularity };
        setFilters(next);
        if (next.range !== "custom") setAppliedFilters(next);
      }}
    />
    {customError && <p className="reports-filter-error" role="alert">{customError}</p>}
    {error && <ErrorState title="Reports are temporarily unavailable" description={error} onRetry={retry} />}

    <p className="reports-comparison-note">Period comparisons use the immediately preceding range of equal length. Total members and membership status are current snapshots.</p>

    {(report || loading) && <section className="reports-chart-grid" aria-label="Analytics charts" aria-busy={loading || undefined}>
      <ChartCard
        title="Member payment collections"
        description={report ? `Recorded member payments · ${money(report.summary.paymentCollected)} in this period · Fitivo SaaS subscription revenue is excluded` : "Loading member payment collections"}
        ariaLabel="Member payment collections by selected interval"
        loading={loading}
        loadingLabel="member payment collections"
        table={{ caption: "Member payments by interval", columns: revenueTable, rows: series, getRowKey: (row) => row.key }}
      >
        <RevenueChart data={series} />
      </ChartCard>
      <ChartCard
        title="Attendance activity"
        description={report ? `${number(report.summary.attendanceCount)} check-ins · ${number(report.summary.averageAttendancePerDay)} average per day · no schedule baseline is stored for an attendance rate` : "Loading attendance activity"}
        ariaLabel="Attendance check-ins by selected interval"
        loading={loading}
        loadingLabel="attendance activity"
        table={{ caption: "Attendance activity by interval", columns: attendanceTable, rows: series, getRowKey: (row) => row.key }}
      >
        <>
          <AttendanceChart data={series} />
          <AttendanceHeatmap days={report?.attendanceDays || []} />
        </>
      </ChartCard>
      <ChartCard
        title="Member registrations & renewals"
        description={report ? `${number(report.summary.newMembers)} registrations in this period · ${number(report.summary.totalMembers)} member records currently · historical totals are not reconstructed${compare ? ` · ${comparison(report.summary.newMembers, compare.newMembers, "registrations").label}` : ""}` : "Loading member registrations"}
        ariaLabel="New member registrations and membership renewals by selected interval"
        loading={loading}
        loadingLabel="member registrations"
        table={{ caption: "New member registrations by interval", columns: growthTable, rows: series, getRowKey: (row) => row.key }}
      >
        <GrowthChart data={series} />
      </ChartCard>
      {report ? <MembershipChart statuses={report.summary.membershipStatuses} asOf={report.period.today} total={membershipTotal} /> : <ChartCard title="Membership status" description="Current member records" loading loadingLabel="membership status" />}
    </section>}
    <p className="reports-screen-reader" role="status" aria-live="polite">{loading ? "Updating report data." : report ? `Reports loaded for ${report.period.startDate} through ${report.period.endDate}.` : ""}</p>
  </div>;
}
