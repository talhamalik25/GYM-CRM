"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "../ui/card";
import ReportsManager from "./reports-manager";

function PaymentAnalysis() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/payment-reports", { cache: "no-store" }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message); if (active) setData(result.data); }).catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  return <Card className="p-6"><h2 className="text-lg font-semibold">Payment methods · Last 30 days</h2>{error && <p role="alert" className="text-error">{error}</p>}{!data && !error && <p role="status">Loading payment analysis…</p>}<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data?.methods.map((method) => <div key={method._id} className="rounded-lg bg-canvas p-4"><p className="capitalize">{method._id.replaceAll("_", " ")}</p><p className="mt-2 text-xl font-semibold">PKR {method.collected.toLocaleString("en-PK")}</p><p className="mt-1 text-sm text-ink-muted">{method.transactions} transactions · average PKR {Math.round(method.averagePayment).toLocaleString("en-PK")}</p></div>)}</div>{data && !data.methods.length && <p className="mt-3 text-ink-muted">No payments recorded in this period.</p>}</Card>;
}

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
    {entitlements.features.advancedAnalytics ? <ReportsManager /> : <><h1 className="text-2xl font-semibold">Basic reports</h1><p className="text-ink-muted">Last 30 days · {report?.period.timezone}</p><div className="grid gap-4 sm:grid-cols-3">{report && [["Active members", report.members], ["Attendance visits", report.attendance], ["Collected (PKR)", report.collected]].map(([label, value]) => <Card className="p-6" key={label}><h2 className="text-sm text-ink-muted">{label}</h2><p className="mt-3 text-3xl font-semibold">{value.toLocaleString("en-PK")}</p></Card>)}</div><Card className="p-6"><h2 className="font-semibold">More insight with Pro</h2><p className="my-2 text-sm text-ink-muted">Unlock growth trends, period comparisons, payment analysis and CSV exports.</p><Link className="text-brand" href="/billing">Compare plans</Link></Card></>}
    {entitlements.features.advancedPaymentReports && <PaymentAnalysis />}
    {entitlements.features.csvExports && <Card className="p-6"><h2 className="font-semibold">Export this branch</h2><div className="mt-4 flex flex-wrap gap-4">{["members", "payments", "attendance"].map((resource) => <a key={resource} className="text-brand capitalize" href={`/api/exports?resource=${resource}`}>{resource} CSV ↓</a>)}</div><p className="mt-3 text-xs text-ink-muted">Select a single branch before exporting. Exports include all records in the selected branch.</p></Card>}
  </div>;
}
