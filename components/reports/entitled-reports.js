"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "../ui/card";
import ReportsManager, { PaymentMethodSummary } from "./reports-manager";

export default function EntitledReports() {
  const [entitlements, setEntitlements] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/gym/entitlements", { cache: "no-store" });
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message);
      if (active) setEntitlements(result.data);
      if (!result.data.features.advancedAnalytics) {
        const summaryResponse = await fetch("/api/reports?basic=1&range=30d", { cache: "no-store" });
        const summary = await summaryResponse.json(); if (!summaryResponse.ok) throw new Error(summary.error?.message);
        if (active) setReport(summary.data);
      }
    }
    load().catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  if (error) return <Card className="p-6"><p role="alert">{error}</p><Link className="text-brand" href="/billing">View plan and billing</Link></Card>;
  if (!entitlements) return <p role="status">Loading your reports…</p>;
  return <div className="space-y-6">
    {entitlements.features.advancedAnalytics ? <ReportsManager /> : <><h1 className="text-2xl font-semibold">Basic reports</h1><p className="text-ink-muted">Last 30 days · {report?.period.timezone}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{report && [["Active members", report.members], ["New members", report.newMembers], ["Attendance visits", report.attendance], ["Collected (PKR)", report.collected]].map(([label, value]) => <Card className="p-6" key={label}><h2 className="text-sm text-ink-muted">{label}</h2><p className="mt-3 text-3xl font-semibold">{Number(value || 0).toLocaleString("en-PK")}</p></Card>)}</div><Card className="p-6"><h2 className="font-semibold">More insight with Pro</h2><p className="my-2 text-sm text-ink-muted">Unlock period comparisons, advanced analytics and CSV exports.</p><Link className="text-brand" href="/billing">Compare plans</Link></Card></>}
    {!entitlements.features.advancedAnalytics && report && <PaymentMethodSummary methods={report.paymentMethods} />}
    {entitlements.features.csvExports && <Card className="p-6"><h2 className="font-semibold">Export this branch</h2><div className="mt-4 flex flex-wrap gap-4">{["members", "payments", "attendance"].map((resource) => <a key={resource} className="text-brand capitalize" href={`/api/exports?resource=${resource}`}>{resource} CSV ↓</a>)}</div><p className="mt-3 text-xs text-ink-muted">Select a single branch before exporting. Exports include all records in the selected branch.</p></Card>}
  </div>;
}
