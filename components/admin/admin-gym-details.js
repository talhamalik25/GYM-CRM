"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import PageHeading from "../ui/page-heading";

async function getGym(gymId) {
  const response = await fetch(`/api/admin/gyms/${encodeURIComponent(gymId)}`, { cache: "no-store" });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not load gym details.");
    error.status = response.status;
    throw error;
  }
  return result.data;
}

function dateLabel(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

export default function AdminGymDetails({ gymId }) {
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getGym(gymId).then((value) => {
      if (!cancelled) setGym(value);
    }).catch((requestError) => {
      if (!cancelled && requestError.status === 404) setMissing(true);
      else if (!cancelled) setError(requestError.message || "Could not load gym details.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [gymId]);

  return <>
    <div className="mb-4"><Button href="/admin/gyms" variant="secondary" size="sm">← Back to Gyms</Button></div>
    {loading ? <Card className="p-6"><p className="py-8 text-center text-sm text-ink-muted" role="status">Loading gym details…</p></Card> : missing ? <Card className="p-6">
      <p className="text-sm text-ink-muted" role="status">This gym account was not found.</p>
      <Link className="mt-3 inline-block text-sm font-medium text-brand" href="/admin/gyms">Return to Gym accounts</Link>
    </Card> : error ? <Card className="p-6"><p className="text-sm text-error" role="alert">{error}</p></Card> : gym ? <>
      <PageHeading eyebrow="GYM ACCOUNT" title={gym.name || "Gym details"} description={gym.slug || "Gym slug unavailable"} />
      <Card className="mt-6 p-5 md:p-7">
        <h2 className="text-lg font-semibold text-ink">Workspace details</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><dt className="text-xs font-medium uppercase text-ink-subtle">Status</dt><dd className="mt-2"><Badge tone={gym.status === "active" ? "success" : "warning"}>{gym.status === "active" ? "Active" : gym.status === "suspended" ? "Suspended" : "Unavailable"}</Badge></dd></div>
          <div><dt className="text-xs font-medium uppercase text-ink-subtle">Timezone</dt><dd className="mt-2 text-sm text-ink">{gym.timezone || "Not set"}</dd></div>
          <div><dt className="text-xs font-medium uppercase text-ink-subtle">Created</dt><dd className="mt-2 text-sm text-ink">{dateLabel(gym.createdAt)}</dd></div>
          <div><dt className="text-xs font-medium uppercase text-ink-subtle">Last updated</dt><dd className="mt-2 text-sm text-ink">{dateLabel(gym.updatedAt)}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase text-ink-subtle">Active gym owners</dt><dd className="mt-2">{gym.owners?.length ? <ul className="space-y-3">{gym.owners.map((owner, index) => <li key={`${owner.email}-${index}`} className="text-sm text-ink"><span className="block font-medium">{owner.name || "Name unavailable"}</span><span className="text-ink-muted">{owner.email || "Email unavailable"}</span></li>)}</ul> : <span className="text-sm text-ink-muted">No active owner assigned</span>}</dd></div>
        </dl>
      </Card>
    </> : <Card className="p-6"><p className="text-sm text-ink-muted" role="status">Gym details are unavailable.</p></Card>}
  </>;
}
