"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../ui/card";
import Button from "../ui/button";
import Input from "../ui/input";

export default function AcceptStaffInvitation({ token }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function accept(event) { event.preventDefault(); setLoading(true); setError(""); try { const response = await fetch("/api/staff/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, fullName, password }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "Invitation could not be accepted."); router.replace(result.data?.redirectTo || "/dashboard"); router.refresh(); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  return <main className="mx-auto max-w-lg p-6"><Card className="space-y-4 p-6"><h1 className="text-xl font-semibold">Accept gym invitation</h1><p className="text-sm text-ink-muted">If you already have an account, sign in to that account first, then reopen this link. Otherwise, create your account below.</p><form onSubmit={accept} className="space-y-4"><Input id="invite-name" label="Full name (new accounts)" value={fullName} onChange={e => setFullName(e.target.value)} /><Input id="invite-password" label="Password (new accounts)" type="password" value={password} onChange={e => setPassword(e.target.value)} /><Button type="submit" disabled={loading || !token}>{loading ? "Accepting…" : "Accept invitation"}</Button></form>{error && <p role="alert" className="text-sm text-error">{error}</p>}</Card></main>;
}
