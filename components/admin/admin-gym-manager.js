"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";

async function requestGyms(id, options) {
  const response = await fetch(id ? `/api/admin/gyms/${encodeURIComponent(id)}` : "/api/admin/gyms", {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not access gym accounts.");
  return result.data;
}

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default function AdminGymManager() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [changingId, setChangingId] = useState("");

  useEffect(() => {
    let cancelled = false;
    requestGyms().then(({ items }) => {
      if (!cancelled) setGyms(items);
    }).catch((error) => {
      if (!cancelled) setLoadError(error.message || "Could not load gym accounts.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function changeStatus(gym) {
    const status = gym.status === "active" ? "suspended" : "active";
    const effect = status === "suspended" ? "block access for this gym's users" : "restore access for this gym's users";
    if (!window.confirm(`Are you sure you want to ${status === "suspended" ? "suspend" : "activate"} ${gym.name} and ${effect}?`)) return;
    setChangingId(gym.id);
    setActionError("");
    setMessage("");
    try {
      const updated = await requestGyms(gym.id, { method: "PATCH", body: JSON.stringify({ status }) });
      setGyms((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${updated.name} is ${updated.status}.`);
    } catch (error) {
      setActionError(error.message || "Could not update this gym. Please try again.");
    } finally {
      setChangingId("");
    }
  }

  return <Card className="mt-6 p-5 md:p-7">
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-ink">Gym workspaces</h2>
      <p className="mt-1 text-sm text-ink-muted">Owner details come from active gym owner memberships. Missing owners are shown as unassigned.</p>
    </div>
    {message && <p className="mb-4 rounded-lg border border-success/20 bg-success-soft p-3 text-sm text-success" role="status">{message}</p>}
    {actionError && <p className="mb-4 rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{actionError}</p>}
    {loadError && <p className="mb-4 rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{loadError}</p>}
    {loading ? <p className="py-8 text-center text-sm text-ink-muted" role="status">Loading gym accounts…</p> : gyms.length ? <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Gym</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Timezone</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Access</th></tr></thead>
        <tbody>{gyms.map((gym) => <tr key={gym.id} className="border-b border-line last:border-0 align-top">
          <td className="px-3 py-4"><Link className="block font-semibold text-brand hover:underline" href={`/admin/gyms/${encodeURIComponent(gym.id)}`}>{gym.name}</Link><span className="text-xs text-ink-muted">{gym.slug}</span></td>
          <td className="px-3 py-4">{gym.owners.length ? <div className="space-y-2">{gym.owners.map((owner) => <div key={owner.email || owner.name}><span className="block text-ink">{owner.name}</span><span className="text-xs text-ink-muted">{owner.email || "Email unavailable"}</span></div>)}</div> : <span className="text-ink-muted">No active owner assigned</span>}</td>
          <td className="px-3 py-4"><Badge tone={gym.status === "active" ? "success" : "warning"}>{gym.status === "active" ? "Active" : "Suspended"}</Badge></td>
          <td className="px-3 py-4 text-ink-muted">{gym.timezone}</td>
          <td className="px-3 py-4 text-ink-muted">{dateLabel(gym.createdAt)}</td>
          <td className="px-3 py-4"><Button type="button" size="sm" variant={gym.status === "active" ? "danger" : "secondary"} disabled={Boolean(changingId)} aria-busy={changingId === gym.id} onClick={() => changeStatus(gym)}>{changingId === gym.id ? "Saving…" : gym.status === "active" ? "Suspend" : "Activate"}</Button></td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="py-8 text-center text-sm text-ink-muted">No gym accounts have been created.</p>}
  </Card>;
}
