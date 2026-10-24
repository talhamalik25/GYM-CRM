"use client";

import { useCallback, useEffect, useState } from "react";
import { FEATURE_LABELS, LAUNCH_PLANS } from "../../lib/saasPlanRules.js";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import DataTable from "../ui/data-table";
import ErrorState from "../ui/error-state";
import Input from "../ui/input";
import Modal from "../ui/modal";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import { formatSaaSPlanOption, getAssignableSaaSPlans, readAdminBillingResponse } from "../../lib/adminBillingPlans.js";

const emptyPlan = { key: "basic", features: LAUNCH_PLANS[0].features, staff: "3", branches: "1", id: "", name: "", description: "", price: "", interval: "monthly", members: "", trainers: "" };
const PAYMENT_METHODS = [{ type: "bank_transfer", label: "Bank transfer" }, { type: "jazzcash", label: "JazzCash" }, { type: "easypaisa", label: "Easypaisa" }];

async function requestBilling(body) {
  const response = await fetch("/api/admin/billing", {
    cache: "no-store", method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return readAdminBillingResponse(response, { expectPlanCatalog: !body });
}

function amount(value) { return `PKR ${Number(value || 0).toLocaleString("en-PK")}`; }
function date(value) { return value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "—"; }
function statusTone(status) { return status === "active" || status === "paid" ? "success" : status === "trialing" ? "brand" : status === "open" || status === "past_due" || status === "trial_ended" || status === "expired" ? "warning" : "neutral"; }

export default function AdminBillingManager() {
  const [data, setData] = useState({ plans: [], gyms: [], invoices: [], settings: { defaultTrialDays: 0, manualBillingInstructions: "", paymentInstructions: [] } });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [verifiedReference, setVerifiedReference] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [rejectedClaim, setRejectedClaim] = useState(null);
  const [claimRejectionReason, setClaimRejectionReason] = useState("");
  const [paymentFilters, setPaymentFilters] = useState({ gymId: "", planId: "", from: "", to: "", claimStatus: "all" });
  const [settings, setSettings] = useState({ defaultTrialDays: 0, manualBillingInstructions: "", paymentInstructions: [] });

  const load = useCallback(async () => {
    setLoading(true); setError(""); setLoadError("");
    try { const result = await requestBilling(); setData(result); setSettings(result.settings || { defaultTrialDays: 0, manualBillingInstructions: "", paymentInstructions: [] }); setTrialDays(String(result.settings?.defaultTrialDays || 14)); }
    catch (requestError) { const message = requestError.message || "Could not load platform billing."; setError(message); setLoadError(message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  function startEdit(selected) {
    setPlan({ key: selected.key || "", features: selected.features || {}, staff: selected.limits.staff == null ? "" : String(selected.limits.staff), branches: String(selected.limits.branches || 1), id: selected.id, name: selected.name, description: selected.description, price: String(selected.price), interval: selected.interval, members: selected.limits.members == null ? "" : String(selected.limits.members), trainers: selected.limits.trainers == null ? "" : String(selected.limits.trainers) });
    setPlanErrors({});
  }

  async function submitPlan(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage(""); setPlanErrors({});
    const payload = {
      action: plan.id ? "update_plan" : "create_plan", ...(plan.id ? { planId: plan.id } : {}),
      ...(!plan.id && plan.key ? { key: plan.key } : {}), ...(plan.key ? { features: plan.features } : {}),
      name: plan.name, description: plan.description, price: Number(plan.price), interval: plan.interval,
      limits: { ...(plan.key ? { staff: plan.staff === "" ? null : Number(plan.staff), branches: Number(plan.branches) } : {}), members: plan.members === "" ? null : Number(plan.members), trainers: plan.trainers === "" ? null : Number(plan.trainers) },
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
    setSaving(true); setError(""); setLoadError(""); setMessage("");
    try { await requestBilling(payload); setMessage(successText); setReconcileInvoice(null); setRejectedClaim(null); setVerifiedAmount(""); setVerifiedReference(""); setVerificationNotes(""); setVerificationConfirmed(false); setClaimRejectionReason(""); await load(); }
    catch (requestError) { setError(requestError.message || "The billing action could not be completed."); }
    finally { setSaving(false); }
  }

  function togglePlanAvailability(item) {
    if (item.isActive && !window.confirm(`Deactivate ${item.name}? Existing subscriptions will keep their current terms.`)) return;
    action({ action: "update_plan", planId: item.id, isActive: !item.isActive }, item.isActive ? "Plan deactivated." : "Plan activated.");
  }

  const assignablePlans = getAssignableSaaSPlans(data.plans);
  const selectedPlan = assignablePlans.find((item) => item.id === planId);
  const pendingPaymentInvoices = data.invoices.filter((invoice) => {
    if (invoice.status !== "open") return false;
    const latestClaim = invoice.paymentClaims?.at(-1);
    const claimStatus = latestClaim?.status || "unclaimed";
    return (!paymentFilters.gymId || invoice.gymId === paymentFilters.gymId)
      && (!paymentFilters.planId || invoice.planId === paymentFilters.planId)
      && (!paymentFilters.from || String(invoice.issuedAt || "").slice(0, 10) >= paymentFilters.from)
      && (!paymentFilters.to || String(invoice.issuedAt || "").slice(0, 10) <= paymentFilters.to)
      && (paymentFilters.claimStatus === "all" || claimStatus === paymentFilters.claimStatus);
  });
  function openVerification(invoice) {
    setReconcileInvoice(invoice); setVerifiedAmount(String(invoice.amountDue)); setVerifiedReference(invoice.paymentClaims?.at(-1)?.reference || ""); setVerificationNotes(""); setVerificationConfirmed(false); setInvoiceError("");
  }
  function openClaimRejection(invoice) {
    const claim = invoice.paymentClaims?.at(-1);
    if (!claim || claim.status !== "submitted") return;
    setRejectedClaim({ invoice, claim }); setClaimRejectionReason("");
  }
  const planColumns = [
    { key: "name", label: "Plan", render: (item) => <div><span className="admin-primary-cell">{item.name}</span><span className="admin-secondary-cell">{item.description || "No description"}</span></div> },
    { key: "price", label: "Price", render: (item) => `${amount(item.price)} / ${item.interval}` },
    { key: "limits", label: "Limits", render: (item) => `${item.limits.members ?? "∞"} members · ${item.limits.trainers ?? "∞"} trainers` },
    { key: "availability", label: "Availability", render: (item) => <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge> },
    { key: "actions", label: "Actions", render: (item) => <div className="admin-inline-actions"><Button type="button" variant="ghost" size="sm" onClick={() => startEdit(item)}>Edit</Button><Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => togglePlanAvailability(item)}>{item.isActive ? "Deactivate" : "Activate"}</Button></div> },
  ];
  const subscriptionRows = data.gyms.filter((gym) => gym.subscription);
  const subscriptionColumns = [
    { key: "usage", label: "Usage / locations", render: (gym) => <div className="text-xs">{gym.usage?.members || 0} members · {gym.usage?.staff || 0} staff · {gym.usage?.branches || 1} active branches<p>{gym.branches?.map((branch) => `${branch.name} (${branch.status})`).join(", ")}</p></div> },
    { key: "name", label: "Gym", render: (gym) => <span className="admin-primary-cell">{gym.name}</span> },
    { key: "plan", label: "Plan", render: (gym) => gym.subscription.planSnapshot?.name || "Plan unavailable" },
    { key: "status", label: "Status", render: (gym) => <Badge tone={statusTone(gym.subscription.status)}>{gym.subscription.status.replaceAll("_", " ")}</Badge> },
    { key: "renewal", label: "Renewal / trial end", render: (gym) => date(gym.subscription.trialEndsAt || gym.subscription.renewalDate) },
    { key: "actions", label: "Actions", render: (gym) => <div className="admin-inline-actions"><Button type="button" variant="ghost" size="sm" disabled={saving || gym.subscription.pendingInvoiceId} onClick={() => action({ action: "renew_invoice", gymId: gym.id }, "Renewal invoice issued.")}>Issue renewal invoice</Button>{gym.subscription.status !== "cancelled" && <Button type="button" variant="danger" size="sm" disabled={saving} onClick={() => { if (window.confirm(`Cancel Fitivo subscription for ${gym.name}? Gym workspace access will be restricted.`)) action({ action: "cancel_subscription", gymId: gym.id }, "SaaS subscription cancelled. Gym access is now restricted."); }}>Cancel</Button>}</div> },
  ];
  const invoiceColumns = [
    { key: "invoiceNumber", label: "Invoice", render: (invoice) => <div><span className="admin-primary-cell">{invoice.invoiceNumber}</span><span className="admin-secondary-cell">{date(invoice.issuedAt)}</span></div> },
    { key: "gymName", label: "Gym" },
    { key: "amountDue", label: "Amount", render: (invoice) => amount(invoice.amountDue) },
    { key: "period", label: "Period", render: (invoice) => `${date(invoice.periodStart)} – ${date(invoice.periodEnd)}` },
    { key: "status", label: "Status", render: (invoice) => <div><Badge tone={statusTone(invoice.status)}>{invoice.status}</Badge>{invoice.voidReason && <span className="admin-secondary-cell admin-void-reason">{invoice.voidReason}</span>}</div> },
    { key: "action", label: "Action", render: (invoice) => <div className="admin-inline-actions">{invoice.status === "open" && <><Button type="button" variant="ghost" size="sm" onClick={() => openVerification(invoice)}>Verify &amp; reconcile</Button>{invoice.paymentClaims?.at(-1)?.status === "submitted" && <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => openClaimRejection(invoice)}>Reject claim</Button>}<Button type="button" variant="danger" size="sm" disabled={saving} onClick={() => { const reason = window.prompt("Why is this invoice being voided?"); if (reason?.trim()) action({ action: "void_invoice", invoiceId: invoice.id, reason }, "Invoice voided."); }}>Void</Button></>}{invoice.status === "paid" && <span className="admin-secondary-cell">Verified ref: {invoice.verifiedReference || invoice.paymentReference}</span>}</div> },
  ];
  const paymentQueueColumns = [
    { key: "invoice", label: "Invoice / issued", render: (invoice) => <div><span className="admin-primary-cell">{invoice.invoiceNumber}</span><span className="admin-secondary-cell">{date(invoice.issuedAt)}</span></div> },
    { key: "gymName", label: "Gym" },
    { key: "plan", label: "Plan", render: (invoice) => invoice.planSnapshot?.name || "Plan unavailable" },
    { key: "amountDue", label: "Amount", render: (invoice) => amount(invoice.amountDue) },
    { key: "claim", label: "Owner payment claim", render: (invoice) => { const claim = invoice.paymentClaims?.at(-1); return claim ? <div><span className="admin-primary-cell">{claim.reference}</span><span className="admin-secondary-cell">{claim.status} · {date(claim.submittedAt)}{claim.rejectionReason ? ` · ${claim.rejectionReason}` : ""}</span></div> : "No reference submitted"; } },
    { key: "action", label: "Review", render: (invoice) => <div className="admin-inline-actions"><Button type="button" size="sm" onClick={() => openVerification(invoice)}>Verify payment</Button>{invoice.paymentClaims?.at(-1)?.status === "submitted" && <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => openClaimRejection(invoice)}>Reject claim</Button>}</div> },
  ];
  return <div className="admin-billing-page">
    <PageHeader eyebrow="SUPERADMIN · BUSINESS OPERATIONS" title="Fitivo plans & billing" description="Configure SaaS tiers, assign Gym subscriptions, and reconcile manually received payments." />
    {message && <p className="admin-success-message" role="status">{message}</p>}
    {error && <Card className="admin-inline-error"><ErrorState title="Billing action needs attention" description={error} /></Card>}
    <Card className="admin-billing-notice"><p className="admin-billing-notice-title">Billing mode: manual</p><p>No payment provider is configured. Invoices are local records only. Mark one paid only after verifying an external payment, and enter its reference.</p></Card>

    <Card className="p-5"><h2 className="font-semibold">Launch catalog</h2><p className="my-3 text-sm text-ink-muted">Initialize Basic, Pro and Professional at the proposed launch prices. Existing catalog entries and subscriptions are preserved.</p><Button disabled={saving} onClick={() => action({ action: "initialize_launch_plans" }, "Launch catalog initialized. Existing terms preserved.")}>Initialize missing launch plans</Button></Card>
    <Card className="p-5"><h2 className="font-semibold">Plan change requests</h2>{data.gyms.filter((gym) => gym.planChangeRequest).map((gym) => <div key={gym.id} className="mt-3 flex flex-wrap items-center justify-between gap-3"><p>{gym.name} → {data.plans.find((plan) => plan.id === gym.planChangeRequest.planId)?.name || "Plan unavailable"}</p><Button disabled={saving} onClick={() => action(gym.subscription?.planId === gym.planChangeRequest.planId ? { action: "renew_invoice", gymId: gym.id } : { action: "assign_plan", mode: "invoice", gymId: gym.id, planId: gym.planChangeRequest.planId }, "Invoice issued. Current access is retained until reconciliation.")}>Review and issue invoice</Button></div>)}</Card>
    <Card className="admin-surface admin-billing-record-card"><h2>Pending payment verification</h2><p className="px-6 pb-4 text-sm text-ink-muted">Owner submitted references are unverified claims. Check the receiving account independently before reconciling; a reference alone is not proof of payment.</p>
      <div className="admin-payment-filters"><Select label="Gym" value={paymentFilters.gymId} onChange={(event) => setPaymentFilters({ ...paymentFilters, gymId: event.target.value })}><option value="">All gyms</option>{data.gyms.map((gym) => <option value={gym.id} key={gym.id}>{gym.name}</option>)}</Select><Select label="Plan" value={paymentFilters.planId} onChange={(event) => setPaymentFilters({ ...paymentFilters, planId: event.target.value })}><option value="">All plans</option>{data.plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</Select><label>Issued from<input type="date" value={paymentFilters.from} onChange={(event) => setPaymentFilters({ ...paymentFilters, from: event.target.value })} /></label><label>Issued to<input type="date" value={paymentFilters.to} onChange={(event) => setPaymentFilters({ ...paymentFilters, to: event.target.value })} /></label><Select label="Payment claim" value={paymentFilters.claimStatus} onChange={(event) => setPaymentFilters({ ...paymentFilters, claimStatus: event.target.value })}><option value="all">All open invoices</option><option value="unclaimed">No claim</option><option value="submitted">Claim submitted</option><option value="rejected">Claim rejected</option></Select></div>
      {loading ? <p role="status" className="admin-loading-state">Loading pending payments…</p> : !pendingPaymentInvoices.length ? <p className="admin-loading-state">No pending invoices match these filters.</p> : <DataTable caption="Pending payment verification" columns={paymentQueueColumns} rows={pendingPaymentInvoices} getRowKey={(invoice) => invoice.id} className="admin-billing-invoices-table" />}
    </Card>
    <div className="admin-billing-forms">
      <Card className="admin-surface admin-billing-form-card">
        <h2 className="text-lg font-semibold text-ink">{plan.id ? "Edit SaaS plan" : "Configure a SaaS plan"}</h2>
        <form className="mt-4 space-y-4" onSubmit={submitPlan} noValidate>
          {!plan.id && <Select label="Stable identifier" value={plan.key} onChange={(event) => { const preset = LAUNCH_PLANS.find((item) => item.key === event.target.value); setPlan({ ...plan, key: preset.key, name: preset.name, price: String(preset.price), members: String(preset.limits.members), staff: String(preset.limits.staff), branches: String(preset.limits.branches), features: preset.features }); }}><option value="basic">Basic</option><option value="pro">Pro</option><option value="professional">Professional</option></Select>}
          {plan.key && <><div className="grid gap-4 sm:grid-cols-2"><Input label="Staff limit" type="number" min="0" value={plan.staff} onChange={(event) => setPlan({ ...plan, staff: event.target.value })} /><Input label="Active branch limit" type="number" min="1" disabled={plan.key !== "professional"} value={plan.branches} onChange={(event) => setPlan({ ...plan, branches: event.target.value })} /></div><fieldset className="grid gap-2 sm:grid-cols-2"><legend className="mb-2 text-sm font-semibold">Entitlements for future assignments</legend>{Object.entries(FEATURE_LABELS).map(([key, label]) => <label className="flex items-center gap-2 text-sm" key={key}><input type="checkbox" disabled={plan.key !== "professional" && ["multiBranch", "branchReports", "consolidatedAnalytics", "prioritySupport"].includes(key)} checked={Boolean(plan.features[key])} onChange={(event) => setPlan({ ...plan, features: { ...plan.features, [key]: event.target.checked } })} />{label}</label>)}</fieldset></>}
          <Input id="saas-plan-name" label="Plan name" required value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} error={planErrors.name} />
          <Input id="saas-plan-description" label="Description" value={plan.description} onChange={(event) => setPlan({ ...plan, description: event.target.value })} error={planErrors.description} />
          <div className="grid gap-4 sm:grid-cols-2"><Input id="saas-plan-price" label="Price (PKR)" type="number" min="0" step="1" required value={plan.price} onChange={(event) => setPlan({ ...plan, price: event.target.value })} error={planErrors.price} /><Select id="saas-plan-interval" label="Billing interval" value={plan.interval} onChange={(event) => setPlan({ ...plan, interval: event.target.value })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></Select></div>
          <div><p className="text-sm font-medium text-ink">Feature limits</p><p className="mt-1 text-xs text-ink-muted">Blank means unlimited. Edits apply to future assignments. Existing subscription snapshots keep their agreed terms.</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Input id="saas-limit-members" label="Maximum members" type="number" min="0" step="1" value={plan.members} onChange={(event) => setPlan({ ...plan, members: event.target.value })} error={planErrors["limits.members"]} /><Input id="saas-limit-trainers" label="Maximum trainers" type="number" min="0" step="1" value={plan.trainers} onChange={(event) => setPlan({ ...plan, trainers: event.target.value })} error={planErrors["limits.trainers"]} /></div></div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">{plan.id && <Button type="button" variant="secondary" disabled={saving} onClick={() => { setPlan(emptyPlan); setPlanErrors({}); }}>Cancel edit</Button>}<Button type="submit" disabled={saving} aria-busy={saving}>{saving ? "Saving…" : plan.id ? "Save plan" : "Create plan"}</Button></div>
        </form>
      </Card>
      <Card className="admin-surface admin-billing-form-card">
        <h2 className="text-lg font-semibold text-ink">Assign a Gym plan</h2>
        <form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); action({ action: "assign_plan", gymId, planId, mode, ...(mode === "trial" ? { trialDays: Number(trialDays) } : {}) }, mode === "trial" ? "Trial assigned." : "Invoice issued; subscription awaits manual reconciliation."); }}>
          <Select id="billing-gym" label="Gym" required value={gymId} onChange={(event) => setGymId(event.target.value)}><option value="">Choose a Gym</option>{data.gyms.filter((gym) => gym.status === "active").map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</Select>
          <Select id="billing-plan" label="Active plan" required disabled={loading || Boolean(loadError) || assignablePlans.length === 0} value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">{loading ? "Loading plans…" : loadError ? "Plans unavailable" : assignablePlans.length ? "Choose a plan" : "No active plans"}</option>{assignablePlans.map((item) => <option key={item.id} value={item.id}>{formatSaaSPlanOption(item)}</option>)}</Select>
          {loadError && <div className="flex items-center justify-between gap-3 text-sm text-error" role="alert"><span>{loadError}</span><Button type="button" variant="secondary" size="sm" disabled={loading} onClick={load}>Retry</Button></div>}
          {!loading && !loadError && assignablePlans.length === 0 && <p className="text-sm text-ink-muted" role="status">No active SaaS plans are available. Initialize missing launch plans above or activate a plan in the catalog.</p>}
          {selectedPlan && <p className="rounded-lg bg-canvas p-3 text-xs text-ink-muted">Limits: {selectedPlan.limits.members == null ? "unlimited members" : `${selectedPlan.limits.members} members`} · {selectedPlan.limits.trainers == null ? "unlimited trainers" : `${selectedPlan.limits.trainers} trainers`}</p>}
        <Select id="billing-mode" label="Start as" value={mode} onChange={(event) => setMode(event.target.value)}><option value="invoice">Issue invoice</option></Select>
          {mode === "trial" && <Input id="trial-days" label="Trial days (1–90)" type="number" min="1" max="90" value={trialDays} onChange={(event) => setTrialDays(event.target.value)} />}
          <p className="text-xs text-ink-muted">Auto-renew is off. An invoice does not activate the plan until a Superadmin reconciles verified external payment.</p>
          <div className="flex justify-end border-t border-line pt-4"><Button type="submit" disabled={saving || loading || Boolean(loadError) || !gymId || !selectedPlan}>{saving ? "Processing…" : mode === "trial" ? "Assign trial" : "Issue invoice"}</Button></div>
        </form>
      </Card>
    </div>

    <Card className="admin-surface admin-billing-settings"><h2>Platform billing settings</h2><p>New gyms receive a fixed seven-day trial. These legacy defaults do not change existing trials or configure a payment provider.</p><form onSubmit={(event) => { event.preventDefault(); action({ action: "update_settings", defaultTrialDays: Number(settings.defaultTrialDays), manualBillingInstructions: settings.manualBillingInstructions, paymentInstructions: PAYMENT_METHODS.map(({ type }) => ({ type, instructions: settings.paymentInstructions?.find((item) => item.type === type)?.instructions || "" })) }, "Platform billing settings saved."); }}><Input id="default-trial-days" label="Suggested default trial length (days)" type="number" min="0" max="90" step="1" value={settings.defaultTrialDays} onChange={(event) => setSettings({ ...settings, defaultTrialDays: event.target.value })} />{PAYMENT_METHODS.map(({ type, label }) => <label className="admin-billing-textarea-label" htmlFor={`payment-instructions-${type}`} key={type}>{label} payment instructions<textarea id={`payment-instructions-${type}`} maxLength={1200} rows={3} value={settings.paymentInstructions?.find((item) => item.type === type)?.instructions || ""} onChange={(event) => setSettings({ ...settings, paymentInstructions: [...PAYMENT_METHODS.map((method) => ({ type: method.type, instructions: method.type === type ? event.target.value : settings.paymentInstructions?.find((item) => item.type === method.type)?.instructions || "" }))] })} /></label>)}<label className="admin-billing-textarea-label" htmlFor="manual-billing-instructions">Additional legacy instructions<textarea id="manual-billing-instructions" maxLength={1200} rows={3} value={settings.manualBillingInstructions} onChange={(event) => setSettings({ ...settings, manualBillingInstructions: event.target.value })} /></label><p className="admin-form-hint">Add only payment details your organization is authorized to share. No account details are prefilled.</p><div className="admin-form-actions"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button></div></form></Card>

    <Card className="admin-surface admin-billing-record-card"><h2>SaaS plans</h2>{loading ? <p role="status" className="admin-loading-state">Loading billing…</p> : !data.plans.length ? <p className="admin-loading-state">No SaaS plans are configured. Create a plan above.</p> : <DataTable caption="SaaS plans" columns={planColumns} rows={data.plans} getRowKey={(item) => item.id} className="admin-billing-plans-table" />}</Card>

    <Card className="admin-surface admin-billing-record-card"><h2>Gym subscriptions</h2>{loading ? <p role="status" className="admin-loading-state">Loading subscriptions…</p> : !subscriptionRows.length ? <p className="admin-loading-state">No Gym SaaS subscriptions have been assigned.</p> : <DataTable caption="Gym subscriptions" columns={subscriptionColumns} rows={subscriptionRows} getRowKey={(gym) => gym.id} className="admin-billing-subscriptions-table" />}</Card>

    <Card className="admin-surface admin-billing-record-card"><h2>Platform invoices</h2>{loading ? <p role="status" className="admin-loading-state">Loading invoices…</p> : !data.invoices.length ? <p className="admin-loading-state">No platform invoices have been issued.</p> : <DataTable caption="Platform invoices" columns={invoiceColumns} rows={data.invoices} getRowKey={(invoice) => invoice.id} className="admin-billing-invoices-table" />}</Card>

    <Modal open={Boolean(reconcileInvoice)} onClose={() => { if (!saving) setReconcileInvoice(null); }} title="Manually reconcile invoice" description={reconcileInvoice ? `${reconcileInvoice.invoiceNumber} · ${amount(reconcileInvoice.amountDue)}. Verify the external payment before confirming.` : ""}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); action({ action: "reconcile_invoice", invoiceId: reconcileInvoice.id, verifiedAmount: Number(verifiedAmount), verifiedReference, verificationNotes, paymentIndependentlyVerified: verificationConfirmed }, "Invoice reconciled after independent payment verification."); }}>
        <p className="text-sm text-ink-muted">Compare the receiving account record with the claimed reference. Owner-submitted references and screenshots are not proof by themselves.</p>
        <Input id="verified-amount" label="Amount independently verified (PKR)" type="number" min="1" step="1" required value={verifiedAmount} onChange={(event) => setVerifiedAmount(event.target.value)} error={invoiceError} />
        <Input id="verified-reference" label="Verified external transaction reference" required maxLength={200} value={verifiedReference} onChange={(event) => setVerifiedReference(event.target.value)} hint="Enter the reference as confirmed on the receiving account." />
        <label className="admin-billing-textarea-label" htmlFor="verification-notes">Verification notes<textarea id="verification-notes" required minLength={5} maxLength={1000} rows={3} value={verificationNotes} onChange={(event) => setVerificationNotes(event.target.value)} /></label>
        <label className="flex items-start gap-2 text-sm text-ink"><input type="checkbox" required checked={verificationConfirmed} onChange={(event) => setVerificationConfirmed(event.target.checked)} /><span>I independently verified receipt of the full invoice amount in the receiving account.</span></label>
        <p className="text-xs text-ink-muted">Reconciliation records the verifier, amount, reference and notes, then activates the subscription exactly once.</p>
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={saving} onClick={() => setReconcileInvoice(null)}>Cancel</Button><Button type="submit" disabled={saving || !verifiedReference.trim() || !verificationNotes.trim() || !verificationConfirmed || Number(verifiedAmount) !== reconcileInvoice?.amountDue} aria-busy={saving}>{saving ? "Reconciling…" : "Approve and reconcile"}</Button></div>
      </form>
    </Modal>
    <Modal open={Boolean(rejectedClaim)} onClose={() => { if (!saving) setRejectedClaim(null); }} title="Reject payment claim" description={rejectedClaim ? `${rejectedClaim.invoice.invoiceNumber} · ${rejectedClaim.claim.reference}` : ""}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); action({ action: "reject_payment_claim", invoiceId: rejectedClaim.invoice.id, claimId: rejectedClaim.claim.id, reason: claimRejectionReason }, "Payment claim rejected. The invoice remains open and the owner may submit a corrected reference."); }}>
        <p className="text-sm text-ink-muted">This rejects only the submitted claim. It preserves the invoice and claim history, and does not mark the invoice paid.</p>
        <label className="admin-billing-textarea-label" htmlFor="claim-rejection-reason">Reason for rejection<textarea id="claim-rejection-reason" required minLength={3} maxLength={300} rows={3} value={claimRejectionReason} onChange={(event) => setClaimRejectionReason(event.target.value)} /></label>
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="secondary" disabled={saving} onClick={() => setRejectedClaim(null)}>Cancel</Button><Button type="submit" variant="danger" disabled={saving || !claimRejectionReason.trim()}>{saving ? "Rejecting…" : "Reject claim"}</Button></div>
      </form>
    </Modal>
  </div>;
}
