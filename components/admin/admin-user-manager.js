"use client";

import { useEffect, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import DataTable from "../ui/data-table";
import ErrorState from "../ui/error-state";
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
  const [values, setValues] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
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
      const created = await requestUsers({ method: "POST", body: JSON.stringify({ fullName: values.fullName, email: values.email, password: values.password }) });
      setUsers((current) => [...current, created]);
      setValues({ fullName: "", email: "", password: "", confirmPassword: "" });
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

  const columns = [
    { key: "fullName", label: "Name", render: (user) => user.fullName || "Name unavailable" },
    { key: "email", label: "Email", render: (user) => <span className="admin-user-email">{user.email}</span> },
    { key: "role", label: "Role", render: (user) => adminUserRoleLabel(user) },
    { key: "status", label: "Status", render: (user) => <Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Active" : "Inactive"}</Badge> },
    { key: "createdAt", label: "Created", render: (user) => createdDate(user.createdAt) },
    { key: "action", label: "Action", render: (user) => <Button type="button" variant="secondary" size="sm" onClick={() => toggleUser(user)}>{user.isActive ? "Deactivate" : "Reactivate"}</Button> },
  ];

  return <div className="admin-users-layout">
    <Card className="admin-surface admin-users-list">
      <div className="admin-panel-heading">
        <div><h2>Workspace accounts</h2><p>Superadmins can create staff accounts. Passwords are stored as password hashes and are never shown here.</p></div>
        {!loading && !loadError && <span className="admin-count-pill">{users.length.toLocaleString("en-PK")} {users.length === 1 ? "account" : "accounts"}</span>}
      </div>
      {loadError && <div className="admin-inline-error"><ErrorState title="Could not access user accounts" description={loadError} /></div>}
      {loading ? <div className="admin-loading-state" role="status">Loading accounts…</div> : loadError && !users.length ? null : users.length ? <DataTable caption="Workspace accounts" columns={columns} rows={users} getRowKey={(user) => user.id} className="admin-users-table" /> : <div className="admin-loading-state">No accounts found.</div>}
    </Card>

    <Card className="admin-surface admin-create-user">
      <div className="admin-panel-heading admin-panel-heading-stacked"><div><h2>Add a staff account</h2><p>The new account needs an active Gym membership before it can open a workspace. Assign owner access under Gym accounts or invite it from an existing Gym Owner account.</p></div></div>
      <form className="admin-create-user-form" onSubmit={submit} noValidate>
        <Input id="new-user-full-name" label="Full name" autoComplete="name" required maxLength={120} value={values.fullName} onChange={(event) => update("fullName", event.target.value)} error={errors.fullName} />
        <Input id="new-user-email" label="Email address" type="email" autoComplete="off" required value={values.email} onChange={(event) => update("email", event.target.value)} error={errors.email} />
        <Input id="new-user-password" label="Temporary password" type="password" autoComplete="new-password" required value={values.password} onChange={(event) => update("password", event.target.value)} error={errors.password} />
        <Input id="new-user-confirm-password" label="Confirm password" type="password" autoComplete="new-password" required value={values.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} error={errors.confirmPassword} />
        <p className="admin-form-hint">Use at least 12 characters. Give the temporary password to the account owner through a secure channel.</p>
        {message && <p className="admin-success-message" role="status">{message}</p>}
        {loadError && users.length > 0 && <p className="admin-error-message" role="alert">{loadError}</p>}
        <div className="admin-form-actions"><Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Creating account…" : "Create staff account"}</Button></div>
      </form>
    </Card>
  </div>;
}
