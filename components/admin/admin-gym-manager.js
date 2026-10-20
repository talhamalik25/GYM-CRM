"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import Modal from "../ui/modal";
import Select from "../ui/select";
import { filterAdminGyms } from "../../lib/adminGymRules.js";

async function requestGyms(id, options) {
  const response = await fetch(id ? `/api/admin/gyms/${encodeURIComponent(id)}` : "/api/admin/gyms", {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not access gym accounts.");
    error.fields = result.error?.fields || {};
    throw error;
  }
  return result.data;
}

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default function AdminGymManager() {
  const [gyms, setGyms] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [changingId, setChangingId] = useState("");
  const [ownerGym, setOwnerGym] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerError, setOwnerError] = useState("");
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionValues, setProvisionValues] = useState({ name: "", slug: "", timezone: "Asia/Karachi", ownerEmail: "", accessMode: "trial", planId: "", trialDays: "" });
  const [provisionErrors, setProvisionErrors] = useState({});
  const [provisionSaving, setProvisionSaving] = useState(false);
  const [eligiblePlans, setEligiblePlans] = useState([]);
  const [trialDefault, setTrialDefault] = useState(0);
  const [provisionOptionsError, setProvisionOptionsError] = useState("");
  const [provisionOptionsLoading, setProvisionOptionsLoading] = useState(true);
  const filteredGyms = filterAdminGyms(gyms, { query, status: statusFilter });

  useEffect(() => {
    let cancelled = false;
    requestGyms().then(({ items }) => {
      if (!cancelled) setGyms(items);
    }).catch((error) => {
      if (!cancelled) setLoadError(error.message || "Could not load gym accounts.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    fetch("/api/admin/billing", { cache: "no-store" }).then(async (response) => {
      let result;
      try { result = await response.json(); } catch { throw new Error("Billing options could not be read."); }
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Billing options could not be loaded.");
      if (cancelled) return;
      const plans = (result.data.plans || []).filter((plan) => plan.isActive);
      const configuredTrialDays = result.data.settings?.defaultTrialDays || 0;
      setEligiblePlans(plans);
      setTrialDefault(configuredTrialDays);
      setProvisionValues((current) => ({ ...current, planId: current.planId || plans[0]?.id || "", trialDays: current.trialDays || String(configuredTrialDays || "") }));
      if (!plans.length) setProvisionOptionsError("Create an active SaaS plan before provisioning access. You can still provision with access paused.");
    }).catch((error) => {
      if (!cancelled) setProvisionOptionsError(error.message || "Billing options could not be loaded.");
    }).finally(() => { if (!cancelled) setProvisionOptionsLoading(false); });
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

  async function assignOwner(event) {
    event.preventDefault();
    if (!ownerGym) return;
    setOwnerSaving(true);
    setOwnerError("");
    try {
      const response = await fetch("/api/admin/gym-owners", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId: ownerGym.id, email: ownerEmail }),
      });
      let result;
      try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
      if (!response.ok || !result.success) {
        const error = new Error(result.error?.message || "Could not assign this Gym owner.");
        error.fields = result.error?.fields || {};
        throw error;
      }
      const assignedOwner = result.data.owner;
      setGyms((current) => current.map((gym) => gym.id === ownerGym.id
        ? { ...gym, owners: [...gym.owners.filter((owner) => owner.email !== assignedOwner.email), assignedOwner] }
        : gym));
      setMessage(`${assignedOwner.name} now has owner access to ${ownerGym.name}.`);
      setOwnerGym(null);
      setOwnerEmail("");
    } catch (error) {
      setOwnerError(error.message || "Could not assign this Gym owner.");
    } finally {
      setOwnerSaving(false);
    }
  }

  async function provisionGym(event) {
    event.preventDefault();
    setProvisionSaving(true);
    setProvisionErrors({});
    setActionError("");
    try {
      const payload = { ...provisionValues, ...(provisionValues.accessMode === "trial" ? { trialDays: Number(provisionValues.trialDays || trialDefault) } : {}) };
      if (provisionValues.accessMode !== "trial") delete payload.trialDays;
      if (provisionValues.accessMode === "none") delete payload.planId;
      const data = await requestGyms(null, { method: "POST", body: JSON.stringify(payload) });
      setGyms((current) => [data.gym, ...current.filter((gym) => gym.id !== data.gym.id)]);
      const accessMessage = provisionValues.accessMode === "trial" ? `a ${payload.trialDays}-day trial was assigned` : provisionValues.accessMode === "invoice" ? data.invoice ? "an open manual invoice was issued; access awaits verified payment" : "the free plan was assigned" : "access remains paused until a SaaS plan or trial is assigned";
      setMessage(`${data.gym.name} was created with its initial owner; ${accessMessage}.`);
      setProvisionOpen(false);
      setProvisionValues({ name: "", slug: "", timezone: "Asia/Karachi", ownerEmail: "", accessMode: "trial", planId: eligiblePlans[0]?.id || "", trialDays: String(trialDefault || "") });
    } catch (error) {
      setProvisionErrors(error.fields || {});
      setActionError(error.message || "Could not provision the Gym. No partial Gym or owner assignment was retained.");
    } finally {
      setProvisionSaving(false);
    }
  }

  return <Card className="mt-6 p-5 md:p-7">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <h2 className="text-lg font-semibold text-ink">Gym workspaces</h2>
      <p className="mt-1 text-sm text-ink-muted">Owner details come from active gym owner memberships. Missing owners are shown as unassigned.</p>
      <Button type="button" onClick={() => { setProvisionErrors({}); setActionError(""); setProvisionOpen(true); }}>Provision Gym</Button>
    </div>
    {message && <p className="mb-4 rounded-lg border border-success/20 bg-success-soft p-3 text-sm text-success" role="status">{message}</p>}
    {actionError && <p className="mb-4 rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{actionError}</p>}
    {loadError && <p className="mb-4 rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{loadError}</p>}
    {!loading && !loadError && gyms.length > 0 && <div className="mb-5 grid gap-4 sm:grid-cols-2">
      <Input id="gym-search" label="Search gyms or owners" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, slug, owner, or email" />
      <Select id="gym-status-filter" label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
        <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
      </Select>
    </div>}
    {loading ? <p className="py-8 text-center text-sm text-ink-muted" role="status">Loading gym accounts…</p> : loadError ? null : gyms.length ? filteredGyms.length ? <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Gym</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Timezone</th><th className="px-3 py-3">Created</th><th className="px-3 py-3">Access</th></tr></thead>
        <tbody>{filteredGyms.map((gym) => <tr key={gym.id} className="border-b border-line last:border-0 align-top">
          <td className="px-3 py-4"><Link className="block font-semibold text-brand hover:underline" href={`/admin/gyms/${encodeURIComponent(gym.id)}`}>{gym.name}</Link><span className="text-xs text-ink-muted">{gym.slug}</span></td>
          <td className="px-3 py-4">{gym.owners.length ? <div className="space-y-2">{gym.owners.map((owner) => <div key={owner.email || owner.name}><span className="block text-ink">{owner.name}</span><span className="text-xs text-ink-muted">{owner.email || "Email unavailable"}</span></div>)}</div> : <span className="text-ink-muted">No active owner assigned</span>}<Button className="mt-3" type="button" size="sm" variant="secondary" disabled={gym.status !== "active"} onClick={() => { setOwnerGym(gym); setOwnerEmail(gym.owners[0]?.email || ""); setOwnerError(""); }}>Assign or repair owner access</Button></td>
          <td className="px-3 py-4"><Badge tone={gym.status === "active" ? "success" : "warning"}>{gym.status === "active" ? "Active" : "Suspended"}</Badge></td>
          <td className="px-3 py-4 text-ink-muted">{gym.timezone}</td>
          <td className="px-3 py-4 text-ink-muted">{dateLabel(gym.createdAt)}</td>
          <td className="px-3 py-4"><Button type="button" size="sm" variant={gym.status === "active" ? "danger" : "secondary"} disabled={Boolean(changingId)} aria-busy={changingId === gym.id} onClick={() => changeStatus(gym)}>{changingId === gym.id ? "Saving…" : gym.status === "active" ? "Suspend" : "Activate"}</Button></td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="py-8 text-center text-sm text-ink-muted" role="status">No gyms match the current search and status filters.</p> : <p className="py-8 text-center text-sm text-ink-muted">No gym accounts have been created.</p>}
    <Modal
      open={Boolean(ownerGym)}
      onClose={() => { if (!ownerSaving) setOwnerGym(null); }}
      title="Assign Gym owner"
      description={ownerGym ? `This gives an existing staff account owner access to ${ownerGym.name}.` : ""}
    >
      <form className="space-y-4" onSubmit={assignOwner} noValidate>
        <Input id="gym-owner-email" label="Existing staff account email" type="email" autoComplete="email" required value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} />
        <p className="text-xs leading-5 text-ink-muted">The account must be active and have no other active Gym assignment. Create staff accounts under User accounts first.</p>
        {ownerError && <p className="text-sm text-error" role="alert">{ownerError}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={ownerSaving} onClick={() => setOwnerGym(null)}>Cancel</Button><Button type="submit" disabled={ownerSaving} aria-busy={ownerSaving}>{ownerSaving ? "Assigning…" : "Assign owner"}</Button></div>
      </form>
    </Modal>
    <Modal
      open={provisionOpen}
      onClose={() => { if (!provisionSaving) setProvisionOpen(false); }}
      title="Provision Gym"
      description="Create the Gym, initial owner membership, and selected SaaS access state in one database transaction."
    >
      <form className="space-y-4" onSubmit={provisionGym} noValidate>
        <Input id="provision-gym-name" label="Gym name" required maxLength={120} value={provisionValues.name} onChange={(event) => setProvisionValues({ ...provisionValues, name: event.target.value })} error={provisionErrors.name} />
        <Input id="provision-gym-slug" label="Gym URL slug" required maxLength={80} value={provisionValues.slug} onChange={(event) => setProvisionValues({ ...provisionValues, slug: event.target.value })} error={provisionErrors.slug} />
        <Input id="provision-gym-timezone" label="IANA timezone" required maxLength={100} value={provisionValues.timezone} onChange={(event) => setProvisionValues({ ...provisionValues, timezone: event.target.value })} error={provisionErrors.timezone} />
        <Input id="provision-gym-owner" label="Initial owner: existing staff email" type="email" required value={provisionValues.ownerEmail} onChange={(event) => setProvisionValues({ ...provisionValues, ownerEmail: event.target.value })} error={provisionErrors.ownerEmail} />
        <Select id="provision-access-mode" label="Initial SaaS access" value={provisionValues.accessMode} onChange={(event) => setProvisionValues({ ...provisionValues, accessMode: event.target.value })} error={provisionErrors.accessMode}>
          <option value="trial">Start a trial</option><option value="invoice">Assign plan and issue manual invoice</option><option value="none">Provision with access paused</option>
        </Select>
        {provisionValues.accessMode !== "none" && <Select id="provision-plan" label="Eligible active SaaS plan" value={provisionValues.planId} onChange={(event) => setProvisionValues({ ...provisionValues, planId: event.target.value })} error={provisionErrors.planId}>
          <option value="">Select a plan</option>{eligiblePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · PKR {plan.price.toLocaleString("en-PK")} / {plan.interval}</option>)}
        </Select>}
        {provisionValues.accessMode === "trial" && <Input id="provision-trial-days" label="Trial length in days" type="number" min="1" max="90" required value={provisionValues.trialDays || String(trialDefault || "")} onChange={(event) => setProvisionValues({ ...provisionValues, trialDays: event.target.value })} error={provisionErrors.trialDays} />}
        {provisionOptionsLoading && <p className="text-sm text-ink-muted" role="status">Loading active SaaS plans and trial settings…</p>}
        {provisionOptionsError && <p className="text-sm text-warning" role="status">{provisionOptionsError}</p>}
        <p className="text-xs leading-5 text-ink-muted">The owner must be an active staff account with no active Gym assignment. Trial access starts immediately. Paid plans remain restricted until a Superadmin reconciles the manual invoice with a verified payment reference. Paused access can be enabled later by assigning a plan under Plans &amp; billing.</p>
        {actionError && <p className="text-sm text-error" role="alert">{actionError}</p>}
        {Object.keys(provisionErrors).some((key) => !["name", "slug", "timezone", "ownerEmail"].includes(key)) && <p className="text-sm text-error" role="alert">{Object.values(provisionErrors).join(" ")}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={provisionSaving} onClick={() => setProvisionOpen(false)}>Cancel</Button><Button type="submit" disabled={provisionSaving || (provisionValues.accessMode !== "none" && (provisionOptionsLoading || !eligiblePlans.some((plan) => plan.id === provisionValues.planId)))} aria-busy={provisionSaving}>{provisionSaving ? "Provisioning…" : "Create Gym and assign owner"}</Button></div>
      </form>
    </Modal>
  </Card>;
}
