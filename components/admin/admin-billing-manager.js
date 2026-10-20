"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import Modal from "../ui/modal";
import Select from "../ui/select";

const emptyPlan = { id: "", name: "", description: "", price: "", interval: "monthly", members: "", trainers: "" };

async function requestBilling(body) {
  const response = await fetch("/api/admin/billing", {
    cache: "no-store", method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not access platform billing.");
    error.fields = result.error?.fields || {};
    throw error;
  }
  return result.data;
}

function amount(value) { return `PKR ${Number(value || 0).toLocaleString("en-PK")}`; }
function date(value) { return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "—"; }
function statusTone(status) { return status === "active" || status === "paid" ? "success" : status === "trialing" ? "brand" : status === "open" || status === "past_due" || status === "trial_ended" ? "warning" : "neutral"; }

export default function AdminBillingManager() {
  const [data, setData] = useState({ plans: [], gyms: [], invoices: [], settings: { defaultTrialDays: 0, manualBillingInstructions: "" } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [planErrors, setPlanErrors] = useState({});
  const [plan, setPlan] = useState(emptyPlan);
  const [gymId, setGymId] = useState("");
  const [planId, setPlanId] = useState("");
  const [mode, setMode] = useState("invoice");
  const [trialDays, setTrialDays] = useState("14");
  const [reconcileInvoice, setReconcileInvoice] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [settings, setSettings] = useState({ defaultTrialDays: 0, manualBillingInstructions: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await requestBilling(); setData(result); setSettings(result.settings || { defaultTrialDays: 0, manualBillingInstructions: "" }); setTrialDays(String(result.settings?.defaultTrialDays || 14)); }
    catch (requestError) { setError(requestError.message || "Could not load platform billing."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  function startEdit(selected) {
    setPlan({ id: selected.id, name: selected.name, description: selected.description, price: String(selected.price), interval: selected.interval, members: selected.limits.members == null ? "" : String(selected.limits.members), trainers: selected.limits.trainers == null ? "" : String(selected.limits.trainers) });
    setPlanErrors({});
  }

  async function submitPlan(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage(""); setPlanErrors({});
    const payload = {
      action: plan.id ? "update_plan" : "create_plan", ...(plan.id ? { planId: plan.id } : {}),
      name: plan.name, description: plan.description, price: Number(plan.price), interval: plan.interval,
      limits: { members: plan.members === "" ? null : Number(plan.members), trainers: plan.trainers === "" ? null : Number(plan.trainers) },
    };
    try {
      const result = await requestBilling(payload);
      setPlan(emptyPlan); setMessage(plan.id ? "Subscription plan updated." : "Subscription plan created.");
      if (result.plans) setData(result); else await load();
    } catch (requestError) {
      setPlanErrors(requestError.fields || {});
      setError(requestError.message || "Could not save the plan.");
    } finally { setSaving(false); }
  }

  async function action(payload, successText) {
    setSaving(true); setError(""); setMessage("");
    try { await requestBilling(payload); setMessage(successText); setReconcileInvoice(null); setPaymentReference(""); await load(); }
    catch (requestError) { setError(requestError.message || "The billing action could not be completed."); }
    finally { setSaving(false); }
  }

  const selectedPlan = data.plans.find((item) => item.id === planId);
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-brand">SUPERADMIN · BUSINESS OPERATIONS</p><h1 className="mt-1 text-3xl font-semibold text-ink">Fitivo plans &amp; billing</h1><p className="mt-2 text-sm text-ink-muted">Configure SaaS tiers, assign Gym subscriptions, and reconcile manually received payments.</p></header>
    {message && <p className="rounded-lg border border-success/20 bg-success-soft p-3 text-sm text-success" role="status">{message}</p>}
    {error && <p className="rounded-lg border border-error/20 bg-error-soft p-3 text-sm text-error" role="alert">{error}</p>}
    <Card className="border-warning/30 p-4"><p className="text-sm font-medium text-ink">Billing mode: manual</p><p className="mt-1 text-sm text-ink-muted">No payment provider is configured. Invoices are local records only. Mark one paid only after verifying an external payment, and enter its reference.</p></Card>

    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-ink">{plan.id ? "Edit SaaS plan" : "Configure a SaaS plan"}</h2>
        <form className="mt-4 space-y-4" onSubmit={submitPlan} noValidate>
          <Input id="saas-plan-name" label="Plan name" required value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} error={planErrors.name} />
          <Input id="saas-plan-description" label="Description" value={plan.description} onChange={(event) => setPlan({ ...plan, description: event.target.value })} error={planErrors.description} />
          <div className="grid gap-4 sm:grid-cols-2"><Input id="saas-plan-price" label="Price (PKR)" type="number" min="0" step="1" required value={plan.price} onChange={(event) => setPlan({ ...plan, price: event.target.value })} error={planErrors.price} /><Select id="saas-plan-interval" label="Billing interval" value={plan.interval} onChange={(event) => setPlan({ ...plan, interval: event.target.value })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></Select></div>
          <div><p className="text-sm font-medium text-ink">Feature limits</p><p className="mt-1 text-xs text-ink-muted">Blank means unlimited. Limits apply to new members and trainers when the Gym subscription is active or in trial.</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Input id="saas-limit-members" label="Maximum members" type="number" min="0" step="1" value={plan.members} onChange={(event) => setPlan({ ...plan, members: event.target.value })} error={planErrors["limits.members"]} /><Input id="saas-limit-trainers" label="Maximum trainers" type="number" min="0" step="1" value={plan.trainers} onChange={(event) => setPlan({ ...plan, trainers: event.target.value })} error={planErrors["limits.trainers"]} /></div></div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">{plan.id && <Button type="button" variant="secondary" disabled={saving} onClick={() => { setPlan(emptyPlan); setPlanErrors({}); }}>Cancel edit</Button>}<Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Saving…" : plan.id ? "Save plan" : "Create plan"}</Button></div>
        </form>
      </Card>
      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-ink">Assign a Gym plan</h2>
        <form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); action({ action: "assign_plan", gymId, planId, mode, ...(mode === "trial" ? { trialDays: Number(trialDays) } : {}) }, mode === "trial" ? "Trial assigned." : "Invoice issued; subscription awaits manual reconciliation."); }}>
          <Select id="billing-gym" label="Gym" required value={gymId} onChange={(event) => setGymId(event.target.value)}><option value="">Choose a Gym</option>{data.gyms.filter((gym) => gym.status === "active").map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</Select>
          <Select id="billing-plan" label="Active plan" required value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">Choose a plan</option>{data.plans.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name} · {amount(item.price)} / {item.interval === "monthly" ? "month" : "year"}</option>)}</Select>
          {selectedPlan && <p className="rounded-lg bg-canvas p-3 text-xs text-ink-muted">Limits: {selectedPlan.limits.members == null ? "unlimited members" : `${selectedPlan.limits.members} members`} · {selectedPlan.limits.trainers == null ? "unlimited trainers" : `${selectedPlan.limits.trainers} trainers`}</p>}
        <Select id="billing-mode" label="Start as" value={mode} onChange={(event) => setMode(event.target.value)}><option value="invoice">Issue invoice</option><option value="trial">Trial</option></Select>
          {mode === "trial" && <Input id="trial-days" label="Trial days (1–90)" type="number" min="1" max="90" value={trialDays} onChange={(event) => setTrialDays(event.target.value)} />}
          <p className="text-xs text-ink-muted">Auto-renew is off. An invoice does not activate the plan until a Superadmin reconciles verified external payment.</p>
          <div className="flex justify-end border-t border-line pt-4"><Button type="submit" disabled={saving || !data.plans.some((item) => item.isActive) || !gymId || !planId}>{saving ? "Processing…" : mode === "trial" ? "Assign trial" : "Issue invoice"}</Button></div>
        </form>
      </Card>
    </div>

    <Card className="p-5 md:p-6"><h2 className="text-lg font-semibold text-ink">Platform billing settings</h2><p className="mt-1 text-sm text-ink-muted">These settings do not configure a payment provider. A zero day default means trials are assigned only when an admin chooses one.</p><form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); action({ action: "update_settings", defaultTrialDays: Number(settings.defaultTrialDays), manualBillingInstructions: settings.manualBillingInstructions }, "Platform billing settings saved."); }}><Input id="default-trial-days" label="Suggested default trial length (days)" type="number" min="0" max="90" step="1" value={settings.defaultTrialDays} onChange={(event) => setSettings({ ...settings, defaultTrialDays: event.target.value })} /><label className="block text-sm font-medium text-ink" htmlFor="manual-billing-instructions">Manual payment instructions<textarea id="manual-billing-instructions" maxLength={1200} rows={4} className="mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink" value={settings.manualBillingInstructions} onChange={(event) => setSettings({ ...settings, manualBillingInstructions: event.target.value })} /></label><p className="text-xs text-ink-muted">Displayed to Gym owners. Do not enter secret credentials.</p><div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button></div></form></Card>

    <Card className="overflow-x-auto p-4 md:p-6"><h2 className="mb-4 text-lg font-semibold text-ink">SaaS plans</h2>{loading ? <p role="status" className="py-6 text-center text-sm text-ink-muted">Loading billing…</p> : !data.plans.length ? <p className="py-6 text-center text-sm text-ink-muted">No SaaS plans are configured. Create a plan above.</p> : <table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Limits</th><th className="px-3 py-3">Availability</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{data.plans.map((item) => <tr className="border-b border-line last:border-0" key={item.id}><td className="px-3 py-3"><span className="font-medium text-ink">{item.name}</span><span className="block text-xs text-ink-muted">{item.description || "No description"}</span></td><td className="px-3 py-3 text-ink-muted">{amount(item.price)} / {item.interval}</td><td className="px-3 py-3 text-ink-muted">{item.limits.members ?? "∞"} members · {item.limits.trainers ?? "∞"} trainers</td><td className="px-3 py-3"><Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge></td><td className="px-3 py-3"><div className="flex gap-3"><button className="font-medium text-brand" type="button" onClick={() => startEdit(item)}>Edit</button><button className="font-medium text-brand" type="button" disabled={saving} onClick={() => action({ action: "update_plan", planId: item.id, isActive: !item.isActive }, item.isActive ? "Plan deactivated." : "Plan activated.")}>{item.isActive ? "Deactivate" : "Activate"}</button></div></td></tr>)}</tbody></table>}</Card>

    <Card className="overflow-x-auto p-4 md:p-6"><h2 className="mb-4 text-lg font-semibold text-ink">Gym subscriptions</h2>{loading ? <p role="status" className="py-6 text-center text-sm text-ink-muted">Loading subscriptions…</p> : !data.gyms.some((gym) => gym.subscription) ? <p className="py-6 text-center text-sm text-ink-muted">No Gym SaaS subscriptions have been assigned.</p> : <table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Gym</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Renewal / trial end</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{data.gyms.filter((gym) => gym.subscription).map((gym) => <tr className="border-b border-line last:border-0" key={gym.id}><td className="px-3 py-3 font-medium text-ink">{gym.name}</td><td className="px-3 py-3 text-ink-muted">{gym.subscription.planSnapshot?.name || "Plan unavailable"}</td><td className="px-3 py-3"><Badge tone={statusTone(gym.subscription.status)}>{gym.subscription.status.replaceAll("_", " ")}</Badge></td><td className="px-3 py-3 text-ink-muted">{date(gym.subscription.trialEndsAt || gym.subscription.renewalDate)}</td><td className="px-3 py-3"><div className="flex gap-3"><button className="font-medium text-brand" type="button" disabled={saving || gym.subscription.pendingInvoiceId} onClick={() => action({ action: "renew_invoice", gymId: gym.id }, "Renewal invoice issued.")}>Issue renewal invoice</button>{gym.subscription.status !== "cancelled" && <button className="font-medium text-error" type="button" disabled={saving} onClick={() => { if (window.confirm(`Cancel Fitivo subscription for ${gym.name}? Gym workspace access is not changed.`)) action({ action: "cancel_subscription", gymId: gym.id }, "SaaS subscription cancelled. Gym access was unchanged."); }}>Cancel</button>}</div></td></tr>)}</tbody></table>}</Card>

    <Card className="overflow-x-auto p-4 md:p-6"><h2 className="mb-4 text-lg font-semibold text-ink">Platform invoices</h2>{loading ? <p role="status" className="py-6 text-center text-sm text-ink-muted">Loading invoices…</p> : !data.invoices.length ? <p className="py-6 text-center text-sm text-ink-muted">No platform invoices have been issued.</p> : <table className="w-full min-w-[800px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-ink-subtle"><th className="px-3 py-3">Invoice</th><th className="px-3 py-3">Gym</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Period</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead><tbody>{data.invoices.map((invoice) => <tr className="border-b border-line last:border-0" key={invoice.id}><td className="px-3 py-3"><span className="font-medium text-ink">{invoice.invoiceNumber}</span><span className="block text-xs text-ink-muted">{date(invoice.issuedAt)}</span></td><td className="px-3 py-3 text-ink-muted">{invoice.gymName}</td><td className="px-3 py-3 text-ink-muted">{amount(invoice.amountDue)}</td><td className="px-3 py-3 text-ink-muted">{date(invoice.periodStart)} – {date(invoice.periodEnd)}</td><td className="px-3 py-3"><Badge tone={statusTone(invoice.status)}>{invoice.status}</Badge>{invoice.voidReason && <span className="block max-w-40 text-xs text-ink-muted">{invoice.voidReason}</span>}</td><td className="px-3 py-3"><div className="flex gap-3">{invoice.status === "open" && <><button className="font-medium text-brand" type="button" onClick={() => { setReconcileInvoice(invoice); setPaymentReference(""); setInvoiceError(""); }}>Reconcile payment</button><button className="font-medium text-error" type="button" disabled={saving} onClick={() => { const reason = window.prompt("Why is this invoice being voided?"); if (reason?.trim()) action({ action: "void_invoice", invoiceId: invoice.id, reason }, "Invoice voided."); }}>Void</button></>}{invoice.status === "paid" && <span className="text-xs text-ink-muted">Ref: {invoice.paymentReference}</span>}</div></td></tr>)}</tbody></table>}</Card>

    <Modal open={Boolean(reconcileInvoice)} onClose={() => { if (!saving) setReconcileInvoice(null); }} title="Manually reconcile invoice" description={reconcileInvoice ? `${reconcileInvoice.invoiceNumber} · ${amount(reconcileInvoice.amountDue)}. Verify the external payment before confirming.` : ""}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); action({ action: "reconcile_invoice", invoiceId: reconcileInvoice.id, paymentReference }, "Invoice marked paid after manual reconciliation."); }}>
        <Input id="payment-reference" label="External payment reference" required maxLength={200} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} error={invoiceError} hint="Bank transfer reference, deposit receipt, or other evidence identifier." />
        <p className="text-xs text-ink-muted">This records a manual reconciliation. Fitivo has not processed a payment.</p>
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={saving} onClick={() => setReconcileInvoice(null)}>Cancel</Button><Button type="submit" disabled={saving || !paymentReference.trim()} aria-busy={saving}>{saving ? "Reconciling…" : "Confirm payment received"}</Button></div>
      </form>
    </Modal>
  </div>;
}
