"use client";

import { useEffect, useState } from "react";
import Card from "../ui/card";
import PageHeader from "../ui/page-header";

function dateLabel(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

export default function TrainerWorkspace() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/trainer/workspace", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load the trainer workspace.");
      if (active) setData(result.data);
    }).catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return <div className="space-y-6"><PageHeader title="Trainer workspace" description="Your assigned member roster and recent attendance. You can only view members assigned to your trainer profile." />
    {loading ? <Card className="p-5" role="status"><p className="text-sm text-ink-muted">Loading trainer workspace…</p></Card> : error ? <Card className="p-5"><p className="text-sm text-error" role="alert">{error}</p><button className="mt-3 text-sm font-medium text-brand" type="button" onClick={() => { setLoading(true); setError(""); setRetry((value) => value + 1); }}>Try again</button></Card> : <>
      <Card className="p-5"><h2 className="text-lg font-semibold text-ink">{data.trainer.name}</h2><p className="text-sm text-ink-muted">{data.trainer.specialization} · {data.members.length} assigned {data.members.length === 1 ? "member" : "members"}</p></Card>
      <Card className="overflow-x-auto p-5"><h2 className="mb-4 text-base font-semibold">Assigned members</h2>{data.members.length ? <table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Member</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Membership</th><th className="px-3 py-3">Expires</th></tr></thead><tbody>{data.members.map((member) => <tr key={member.id} className="border-b border-line last:border-0"><td className="px-3 py-3 font-medium text-ink">{member.name}</td><td className="px-3 py-3 text-ink-muted">{member.phone}</td><td className="px-3 py-3 text-ink-muted">{member.plan}</td><td className="px-3 py-3 text-ink-muted">{member.status}</td><td className="px-3 py-3 text-ink-muted">{dateLabel(member.expiryDate)}</td></tr>)}</tbody></table> : <p className="py-4 text-center text-sm text-ink-muted">No active assigned members yet.</p>}</Card>
      <Card className="overflow-x-auto p-5"><h2 className="mb-4 text-base font-semibold">Recent attendance</h2>{data.attendance.length ? <table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Member</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Check in</th><th className="px-3 py-3">Check out</th></tr></thead><tbody>{data.attendance.map((item) => <tr key={item.id} className="border-b border-line last:border-0"><td className="px-3 py-3 font-medium text-ink">{item.memberName}</td><td className="px-3 py-3 text-ink-muted">{item.date}</td><td className="px-3 py-3 text-ink-muted">{new Date(item.checkInAt).toLocaleTimeString()}</td><td className="px-3 py-3 text-ink-muted">{item.checkOutAt ? new Date(item.checkOutAt).toLocaleTimeString() : "—"}</td></tr>)}</tbody></table> : <p className="py-4 text-center text-sm text-ink-muted">No attendance records for assigned members.</p>}</Card>
    </>}
  </div>;
}
