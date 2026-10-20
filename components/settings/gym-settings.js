"use client";

import { useEffect, useState } from "react";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import PageHeading from "../ui/page-heading";

async function requestSettings(options) {
  const response = await fetch("/api/gym/settings", {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not access gym settings.");
    error.fields = result.error?.fields || {};
    throw error;
  }
  return result.data;
}

export default function GymSettings() {
  const [settings, setSettings] = useState(null);
  const [values, setValues] = useState({ name: "", timezone: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    requestSettings().then((data) => {
      if (cancelled) return;
      setSettings(data);
      setValues({ name: data.name || "", timezone: data.timezone || "Asia/Karachi" });
    }).catch((error) => {
      if (!cancelled) setLoadError(error.message || "Could not load gym settings.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setLoadError("");
    setMessage("");
    try {
      const updated = await requestSettings({ method: "PATCH", body: JSON.stringify(values) });
      setSettings(updated);
      setValues({ name: updated.name || "", timezone: updated.timezone || "Asia/Karachi" });
      setMessage("Gym settings saved.");
    } catch (error) {
      setErrors(error.fields || {});
      if (!Object.keys(error.fields || {}).length) setLoadError(error.message || "Could not save gym settings.");
    } finally { setSaving(false); }
  }

  function reset() {
    setValues({ name: settings?.name || "", timezone: settings?.timezone || "Asia/Karachi" });
    setErrors({});
    setMessage("");
  }

  return <>
    <PageHeading eyebrow="YOUR WORKSPACE" title="Gym settings" description="Update your Gym name and timezone. The timezone is used for attendance and membership dates." />
    <Card className="mt-6 max-w-3xl p-5 md:p-7">
      {loading ? <p className="py-8 text-center text-sm text-ink-muted" role="status">Loading gym settings…</p> : <>
        {loadError && <p className="mb-4 rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{loadError}</p>}
        {message && <p className="mb-4 rounded-lg border border-success/20 bg-success-soft p-3 text-sm text-success" role="status">{message}</p>}
        {settings && <form className="space-y-5" onSubmit={submit} noValidate>
          <Input id="gym-name" label="Gym name" required maxLength={120} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} error={errors.name} />
          <Input id="gym-timezone" label="Timezone" required maxLength={100} value={values.timezone} onChange={(event) => setValues((current) => ({ ...current, timezone: event.target.value }))} error={errors.timezone} hint="Use an IANA timezone, such as Asia/Karachi or Europe/London." />
          <div><span className="text-xs font-medium uppercase text-ink-subtle">Gym URL slug</span><p className="mt-2 text-sm text-ink">{settings.slug || "Not available"}</p><p className="mt-1 text-xs text-ink-muted">The Gym slug is fixed and cannot be changed here.</p></div>
          <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={saving} onClick={reset}>Reset</Button><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save settings"}</Button></div>
        </form>}
      </>}
    </Card>
  </>;
}
