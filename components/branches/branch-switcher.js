"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function BranchSwitcher() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/branches", { cache: "no-store" }).then((response) => response.json()).then((result) => { if (active && result.success) setData(result.data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function select(branchId) {
    if (!branchId) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/branches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "select", branchId }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message);
      // Reload clears all client caches and forms from the previous branch.
      window.location.assign(branchId === "all" ? "/reports" : "/dashboard");
    } catch (error) { setError(error.message); setBusy(false); }
  }
  if (!data?.enabled) return null;
  return <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="branch-switcher">Switch branch</label><select id="branch-switcher" aria-label="Switch branch" disabled={busy} defaultValue="" onChange={(event) => select(event.target.value)} className="max-w-44 rounded border border-line bg-surface px-2 py-1 text-sm"><option value="" disabled>Switch branch</option>{data.branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}{branch.status === "inactive" ? " (history only)" : ""}</option>)}{data.role === "gym_owner" && data.consolidated && <option value="all">All branches · Reports</option>}</select>{data.role === "gym_owner" && <Link href="/branches" className="text-xs text-brand">Manage</Link>}{error && <p role="alert" className="text-xs text-error">{error}</p>}</div>;
}
