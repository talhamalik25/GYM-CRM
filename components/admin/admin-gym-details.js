"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import ErrorState from "../ui/error-state";
import PageHeader from "../ui/page-header";

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

  return <div className="admin-gym-detail-page">
    <div className="admin-gym-back"><Button href="/admin/gyms" variant="secondary" size="sm">← Back to gyms</Button></div>
    {loading ? <Card className="admin-surface admin-state-message"><p role="status">Loading gym details…</p></Card> : missing ? <Card className="admin-surface admin-state-message">
      <p role="status">This gym account was not found.</p>
      <Link href="/admin/gyms">Return to gym accounts</Link>
    </Card> : error ? <Card className="admin-surface admin-inline-error"><ErrorState title="Could not load gym details" description={error} /></Card> : gym ? <>
      <PageHeader eyebrow="GYM ACCOUNT" title={gym.name || "Gym details"} description={gym.slug || "Gym slug unavailable"} />
      <Card className="admin-surface admin-gym-details-card">
        <div className="admin-panel-heading admin-panel-heading-stacked"><div><h2>Workspace details</h2><p>Account status, timezone, and owner access.</p></div></div>
        <dl className="admin-gym-detail-grid">
          <div><dt>Status</dt><dd><Badge tone={gym.status === "active" ? "success" : "warning"}>{gym.status === "active" ? "Active" : gym.status === "suspended" ? "Suspended" : "Unavailable"}</Badge></dd></div>
          <div><dt>Timezone</dt><dd>{gym.timezone || "Not set"}</dd></div>
          <div><dt>Created</dt><dd>{dateLabel(gym.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{dateLabel(gym.updatedAt)}</dd></div>
          <div className="admin-gym-detail-owners"><dt>Active gym owners</dt><dd>{gym.owners?.length ? <ul>{gym.owners.map((owner, index) => <li key={`${owner.email}-${index}`}><span>{owner.name || "Name unavailable"}</span><small>{owner.email || "Email unavailable"}</small></li>)}</ul> : <span>No active owner assigned</span>}</dd></div>
        </dl>
      </Card>
    </> : <Card className="admin-surface admin-state-message"><p role="status">Gym details are unavailable.</p></Card>}
  </div>;
}
