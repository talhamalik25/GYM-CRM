"use client";

import { useEffect, useState } from "react";
import Button from "../ui/button";
import Card from "../ui/card";
import AnalyticsBarChart from "./analytics-bar-chart";

const SERIES_COLORS = { attendance: "var(--brand)", payments: "var(--success)", memberships: "var(--brand)" };
const MEMBERSHIP_LABELS = [
  ["active", "Active", "var(--success)"],
  ["expiring", "Expiring", "var(--warning)"],
  ["upcoming", "Upcoming", "var(--brand)"],
  ["expired", "Expired", "var(--danger)"],
  ["cancelled", "Cancelled", "var(--ink-subtle)"],
];

function monthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

export default function OwnerDashboardAnalytics() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports", { cache: "no-store" }).then(async (response) => {
      let result;
      try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load Gym analytics.");
      if (!cancelled) setReport(result.data);
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.message || "Could not load Gym analytics.");
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

  if (loading) return <section className="dashboard-analytics-grid" aria-label="Gym analytics" role="status">
    {["Attendance over time", "Member payment collections", "Membership status"].map((label) => <Card className="dashboard-chart-card dashboard-chart-loading p-5" key={label}><h3>{label}</h3><div className="dashboard-chart-skeleton" /></Card>)}
  </section>;
  if (error) return <Card className="dashboard-chart-error p-5" role="alert"><p>{error}</p><Button variant="secondary" onClick={retry}>Try again</Button></Card>;
  if (!report) return null;

  const categories = report.months.map((month) => ({ key: month.month, label: monthLabel(month.month) }));
  const statuses = report.summary.membershipStatuses;
  const statusCategories = MEMBERSHIP_LABELS.map(([key, label, color]) => ({ key, label, color }));

  return <section aria-label="Gym analytics" className="dashboard-analytics-grid">
    <AnalyticsBarChart
      title="Attendance over time"
      description="Recorded check-ins by Gym-local calendar month · last six months"
      categories={categories}
      series={[{ key: "attendance", label: "Check-ins", color: SERIES_COLORS.attendance, values: Object.fromEntries(report.months.map((month) => [month.month, month.attendanceCount])) }]}
      emptyMessage="No check-ins have been recorded in this period."
    />
    <AnalyticsBarChart
      title="Member payment collections"
      description="Payments recorded for member subscriptions · last six months"
      categories={categories}
      series={[{ key: "payments", label: "Collected", color: SERIES_COLORS.payments, values: Object.fromEntries(report.months.map((month) => [month.month, month.paymentCollected])) }]}
      formatValue={money}
      emptyMessage="No member payment collections were recorded in this period."
    />
    <AnalyticsBarChart
      title="Membership status"
      description="Current member terms, based on the Gym-local date"
      categories={statusCategories}
      series={[{ key: "memberships", label: "Members", color: SERIES_COLORS.memberships, values: statuses }]}
      className="dashboard-chart-wide"
      emptyMessage="No member records are available for status breakdown."
    />
  </section>;
}
