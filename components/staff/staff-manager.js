"use client";

import { useEffect, useState } from "react";
import Card from "../ui/card";
import Button from "../ui/button";
import Input from "../ui/input";
import Select from "../ui/select";
import PageHeader from "../ui/page-header";

export default function StaffManager() {
  const [data, setData] = useState({ staff: [], invitations: [] });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("gym_admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  async function load() {
    setError("");
    try { const response = await fetch("/api/staff/invitations", { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "Staff could not be loaded."); setData(result.data); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/staff/invitations", { cache: "no-store" })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "Staff could not be loaded."); return result.data; })
      .then(result => { if (active) setData(result); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function invite(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice(""); setInviteUrl(""); setCopied(false);
    try { const response = await fetch("/api/staff/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "Invitation failed."); setInviteUrl(result.data.invitationUrl ? new URL(result.data.invitationUrl, window.location.origin).toString() : ""); setNotice("Invitation created. Share the single-use link with the invitee within 7 days."); setEmail(""); await load(); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  async function copyInviteLink() {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); }
    catch { setError("Could not copy the link. Select and copy it from the field."); }
  }
  return <div className="space-y-6"><PageHeader title="Staff" description="Manage access for your gym team." />
    <Card className="p-5"><h2 className="mb-4 text-base font-semibold">Invite staff</h2><form onSubmit={invite} className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_12rem_auto] md:items-end"><Input id="staff-email" label="Email address" type="email" required value={email} onChange={e => setEmail(e.target.value)} /><Select id="staff-role" label="Role" value={role} onChange={e => setRole(e.target.value)}><option value="gym_admin">Gym admin</option><option value="trainer">Trainer</option></Select><Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create invitation"}</Button></form><p className="mt-2 text-xs text-ink-muted">Trainer invitations require an active trainer profile with the same email. Trainers can view their assigned member roster and recent attendance only.</p>{notice && <p className="mt-3 text-sm text-success" role="status">{notice}</p>}{inviteUrl && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input id="staff-invitation-link" label="Single-use invitation link" value={inviteUrl} readOnly onFocus={event => event.target.select()} /><Button type="button" variant="secondary" onClick={copyInviteLink}>{copied ? "Copied" : "Copy link"}</Button></div>}{error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}</Card>
    <Card className="p-5"><h2 className="mb-4 text-base font-semibold">Gym staff</h2>{loading ? <p role="status" className="text-sm text-ink-muted">Loading staff…</p> : error ? <div><p className="text-sm text-error">{error}</p><Button variant="secondary" onClick={load}>Try again</Button></div> : data.staff.length ? <ul className="divide-y divide-line">{data.staff.map(person => <li key={person.id} className="flex justify-between py-3"><span><strong>{person.name}</strong><small className="block text-ink-muted">{person.email}</small></span><span className="text-sm capitalize">{person.role.replace("gym_", "")}</span></li>)}</ul> : <p className="text-sm text-ink-muted">No staff memberships yet.</p>}</Card>
    <Card className="p-5"><h2 className="mb-4 text-base font-semibold">Invitations</h2>{loading ? <p className="text-sm text-ink-muted">Loading invitations…</p> : data.invitations.length ? <ul className="divide-y divide-line">{data.invitations.map(invite => <li key={invite._id} className="flex justify-between py-3"><span>{invite.email}<small className="block text-ink-muted">{invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}</small></span><span className="text-sm capitalize">{invite.status}</span></li>)}</ul> : <p className="text-sm text-ink-muted">No invitations yet.</p>}</Card>
  </div>;
}
