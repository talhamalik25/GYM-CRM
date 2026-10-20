"use client";

import { useEffect, useState } from "react";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";

export default function OwnerProfile() {
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    fetch("/api/account/profile", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load your profile.");
      if (active) setProfile(result.data);
    }).catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess(""); setFieldErrors({});
    try {
      const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: profile.fullName, phone: profile.phone }) });
      const result = await response.json();
      if (!response.ok || !result.success) {
        const requestError = new Error(result.error?.message || "Could not save your profile.");
        requestError.fields = result.error?.fields || {};
        throw requestError;
      }
      setProfile(result.data); setSuccess("Your profile was updated.");
    } catch (requestError) { setError(requestError.message); setFieldErrors(requestError.fields || {}); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6"><PageHeader title="Owner profile" description="Update your personal display name and contact number." />
    <Card className="max-w-2xl p-5 md:p-7">
      {loading ? <p role="status" className="text-sm text-ink-muted">Loading profile…</p> : <form className="space-y-4" onSubmit={save}>
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        {success && <p className="text-sm text-success" role="status">{success}</p>}
        <Input id="owner-profile-name" label="Full name" autoComplete="name" required maxLength={120} value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} error={fieldErrors.fullName} />
        <Input id="owner-profile-email" label="Sign-in email" type="email" value={profile.email} readOnly hint="Contact Fitivo support to change your sign-in email." />
        <Input id="owner-profile-phone" label="Contact phone" type="tel" autoComplete="tel" maxLength={24} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} error={fieldErrors.phone} />
        <div className="flex justify-end border-t border-line pt-4"><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save profile"}</Button></div>
      </form>}
    </Card>
  </div>;
}
