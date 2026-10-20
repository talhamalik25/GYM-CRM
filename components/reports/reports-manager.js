"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "../ui/button";
import Card from "../ui/card";

function money(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;
}

function monthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function Metric({ label, value, detail }) {
  return <Card className="p-5"><p className="text-sm text-ink-muted">{label}</p><p className="mt-3 text-2xl font-semibold text-ink">{value}</p><p className="mt-2 text-xs text-ink-subtle">{detail}</p></Card>;
}

export default function ReportsManager() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      let result;
      try { result = await response.json(); }
      catch { throw new Error("The server returned an unreadable response."); }
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load reports.");
      setReport(result.data);
    } catch (requestError) {
      setError(requestError.message || "Could not load reports.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(reload, 0);
    return () => window.clearTimeout(timer);
  }, [reload, retry]);

  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-brand">Insights &amp; analytics</p><h1 className="mt-1 text-3xl font-semibold text-ink">Reports</h1><p className="mt-2 text-sm text-ink-muted">Gym activity for the current month to date and previous five calendar months.</p></header>
    {error && <Card className="space-y-3 p-5" role="alert"><p className="text-sm text-error">{error}</p><Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>Try again</Button></Card>}
    {loading ? <Card className="p-6" role="status"><p className="text-sm text-ink-muted">Loading reports…</p></Card> : !error && report && <>
      <section aria-label="Six month summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Payments collected" value={money(report.summary.paymentCollected)} detail="Recorded payments over six calendar months" />
        <Metric label="New members" value={Number(report.summary.newMembers).toLocaleString("en-PK")} detail="Member accounts created in this period" />
        <Metric label="Average attendance" value={`${report.summary.averageAttendancePerDay} / day`} detail="Check-ins per calendar day in this period" />
        <Metric label="Active subscriptions" value={Number(report.summary.activeSubscriptions).toLocaleString("en-PK")} detail="Currently active membership subscriptions" />
      </section>
      {report.months.every((month) => month.paymentCollected === 0 && month.newMembers === 0 && month.attendanceCount === 0) && <Card className="p-4 text-sm text-ink-muted" role="status">No payment, member, or attendance activity was recorded in this period.</Card>}
      <Card className="overflow-x-auto p-4 md:p-6"><h2 className="mb-4 text-base font-semibold text-ink">Monthly activity</h2><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Month</th><th className="px-3 py-3">Payments collected</th><th className="px-3 py-3">New members</th><th className="px-3 py-3">Check-ins</th></tr></thead><tbody>{report.months.map((month) => <tr key={month.month} className="border-b border-line last:border-0"><th scope="row" className="px-3 py-3 font-medium text-ink">{monthLabel(month.month)}</th><td className="px-3 py-3 text-ink-muted">{money(month.paymentCollected)}</td><td className="px-3 py-3 text-ink-muted">{Number(month.newMembers).toLocaleString("en-PK")}</td><td className="px-3 py-3 text-ink-muted">{Number(month.attendanceCount).toLocaleString("en-PK")}</td></tr>)}</tbody></table></Card>
    </>}
  </div>;
}
