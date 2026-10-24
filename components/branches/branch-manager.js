"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "../ui/card";
import Input from "../ui/input";
import Button from "../ui/button";
import PageHeading from "../ui/page-heading";

export default function BranchManager() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", status: "active" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/branches", { cache: "no-store" }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message); if (active) setData(result.data); }).catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [revision]);
  async function save(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/branches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message);
      setForm({ name: "", address: "", status: "active" }); setRevision((value) => value + 1);
    } catch (error) { setError(error.message); } finally { setSaving(false); }
  }
  return <div className="space-y-6"><PageHeading title="Organization branches" description="Manage locations within your gym organization. Member and staff limits apply across every branch." />
    {error && <p className="text-error" role="alert">{error}</p>}
    {!data ? <p role="status">Loading branches…</p> : !data.enabled ? <Card className="p-6"><h2 className="font-semibold">Grow with Professional</h2><p className="my-3">Multi-branch management is exclusive to Professional.</p><Link className="text-brand" href="/billing">Compare plans</Link></Card> : <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.branches.map((branch) => <Card key={branch._id} className="p-5"><h2 className="text-lg font-semibold">{branch.name}</h2><p className="mt-1 text-sm text-ink-muted">{branch.address || "No address added"}</p><p className="my-3 text-sm capitalize">{branch.status}{branch.isDefault ? " · Main location" : ""}</p>{data.role === "gym_owner" && <Button variant="secondary" onClick={() => setForm({ id: branch._id, name: branch.name, address: branch.address, status: branch.status })}>Edit branch</Button>}</Card>)}</div>
      {data.role === "gym_owner" ? <Card className="p-6"><h2 className="mb-4 text-lg font-semibold">{form.id ? "Edit location" : "Add a branch"}</h2><form onSubmit={save} className="space-y-4"><Input label="Branch name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input label="Address" maxLength={400} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /><label className="block text-sm">Status<select className="ml-3 rounded border border-line p-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><p className="text-sm text-ink-muted">Deactivation blocks staff access and new activity. History is preserved. The main branch stays active.</p><div className="flex gap-3"><Button disabled={saving}>{saving ? "Saving…" : "Save branch"}</Button>{form.id && <Button type="button" variant="secondary" onClick={() => setForm({ name: "", address: "", status: "active" })}>Cancel edit</Button>}</div></form></Card> : <p className="text-sm text-ink-muted">Only the organization owner can edit branch details.</p>}
    </>}
  </div>;
}
