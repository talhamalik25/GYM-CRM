"use client";

import { useEffect, useState } from "react";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import { adminUserRoleLabel } from "../../lib/adminUserRules.js";

async function requestUsers(options) {
  const response = await fetch("/api/admin/users", {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not access user accounts.");
    error.fields = result.error?.fields || {};
    throw error;
  }
  return result.data;
}

function createdDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default function AdminUserManager() {
  const [users, setUsers] = useState([]);
  const [values, setValues] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestUsers().then((data) => {
      if (!cancelled) setUsers(data.items);
    }).catch((error) => {
      if (!cancelled) setLoadError(error.message || "Could not load user accounts.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    setLoadError("");
    if (values.password !== values.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      const created = await requestUsers({ method: "POST", body: JSON.stringify({ email: values.email, password: values.password }) });
      setUsers((current) => [...current, created]);
      setValues({ email: "", password: "", confirmPassword: "" });
      setMessage("Staff account created. Share its sign-in details securely with the account owner.");
    } catch (error) {
      setErrors(error.fields || {});
      if (!Object.keys(error.fields || {}).length) setLoadError(error.message || "Could not create the account.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user) {
    const nextActive = !user.isActive;
    const action = nextActive ? "reactivate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;
    setLoadError("");
    setMessage("");
    try {
      const result = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      let payload;
      try { payload = await result.json(); } catch { throw new Error("The server returned an unreadable response."); }
      if (!result.ok || !payload.success) throw new Error(payload.error?.message || `Could not ${action} this account.`);
      setUsers((current) => current.map((entry) => entry.id === user.id ? payload.data : entry));
    } catch (error) {
      setLoadError(error.message || `Could not ${action} this account.`);
    }
  }

  return <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
    <Card className="p-5 md:p-7">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">Workspace accounts</h2>
        <p className="mt-1 text-sm text-ink-muted">Superadmins can create staff accounts. Passwords are stored as password hashes and are never shown here.</p>
      </div>
      {loadError && <p className="mb-4 rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{loadError}</p>}
      {loading ? <p className="py-8 text-center text-sm text-ink-muted" role="status">Loading accounts…</p> : loadError && !users.length ? null : users.length ? <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Action</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.id} className="border-b border-line last:border-0"><td className="px-3 py-3 text-ink">{user.fullName || "Name unavailable"}</td><td className="px-3 py-3 font-medium text-ink">{user.email}</td><td className="px-3 py-3 text-ink-muted">{adminUserRoleLabel(user)}</td><td className="px-3 py-3 text-ink-muted">{user.isActive ? "Active" : "Inactive"}</td><td className="px-3 py-3 text-ink-muted">{createdDate(user.createdAt)}</td><td className="px-3 py-3"><Button type="button" variant="secondary" onClick={() => toggleUser(user)}>{user.isActive ? "Deactivate" : "Reactivate"}</Button></td></tr>)}</tbody>
        </table>
      </div> : <p className="py-8 text-center text-sm text-ink-muted">No accounts found.</p>}
    </Card>

    <Card className="p-5 md:p-7">
      <h2 className="text-lg font-semibold text-ink">Add a staff account</h2>
      <p className="mb-5 mt-1 text-sm text-ink-muted">The new account needs an active Gym membership before it can open a workspace. Assign owner access under Gym accounts or invite it from an existing Gym Owner account.</p>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Input id="new-user-email" label="Email address" type="email" autoComplete="off" required value={values.email} onChange={(event) => update("email", event.target.value)} error={errors.email} />
        <Input id="new-user-password" label="Temporary password" type="password" autoComplete="new-password" required value={values.password} onChange={(event) => update("password", event.target.value)} error={errors.password} />
        <Input id="new-user-confirm-password" label="Confirm password" type="password" autoComplete="new-password" required value={values.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} error={errors.confirmPassword} />
        <p className="text-xs leading-5 text-ink-muted">Use at least 12 characters. Give the temporary password to the account owner through a secure channel.</p>
        {message && <p className="rounded-lg border border-success/20 bg-success-soft px-3 py-2.5 text-sm text-success" role="status">{message}</p>}
        {loadError && users.length > 0 && <p className="rounded-lg border border-error/20 bg-error-soft px-3 py-2.5 text-sm text-error" role="alert">{loadError}</p>}
        <div className="flex justify-end border-t border-line pt-4"><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Creating account…" : "Create staff account"}</Button></div>
      </form>
    </Card>
  </div>;
}
