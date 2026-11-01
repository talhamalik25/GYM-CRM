"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import DataTable from "../ui/data-table";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import Input from "../ui/input";
import Modal from "../ui/modal";
import PageHeader from "../ui/page-header";
import SearchBar from "../ui/search-bar";
import Select from "../ui/select";
import Skeleton from "../ui/skeleton";
import Tabs from "../ui/tabs";
import PlansManager from "../plans/plans-manager";
import { listPlans } from "../../lib/plansService";
import { listMembersApi } from "../../lib/membersService";
import { cancelSubscription, createSubscription, getSubscription, listSubscriptions, renewSubscription } from "../../lib/subscriptionsService";

const money = (value) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-PK", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }) : "—";
const requestKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

function statusTone(status) {
  if (status === "active" || status === "paid") return "success";
  if (status === "partial" || status === "pending") return "warning";
  if (status === "expired" || status === "cancelled") return "error";
  return "neutral";
}

function paymentMethod(value) {
  return value?.replaceAll("_", " ") || "—";
}

function validatePayment(amount, method, maximum) {
  const errors = {};
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value < 0) errors.amountPaid = "Enter a whole amount of zero or more rupees.";
  else if (value > maximum) errors.amountPaid = "Payment cannot exceed the membership price.";
  if (value > 0 && !method) errors.method = "Choose a payment method.";
  return errors;
}

export default function MembershipManager() {
  const [tab, setTab] = useState("subscriptions");
  const [data, setData] = useState({ items: [], total: 0, limit: 10, page: 1 });
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [values, setValues] = useState({ memberId: "", planId: "", startDate: "", amountPaid: "0", method: "cash" });
  const [renewValues, setRenewValues] = useState({ planId: "", amountPaid: "0", method: "cash" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, availablePlans, memberResult] = await Promise.all([
        listSubscriptions({ search, page }),
        listPlans(),
        listMembersApi({ status: "all", limit: 50 }),
      ]);
      setData(result);
      setPlans(availablePlans);
      setMembers(memberResult.items);
      setValues((current) => ({ ...current, startDate: current.startDate || result.today || memberResult.today || "" }));
    } catch (loadError) {
      setError(loadError.message || "Could not load memberships.");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedPlan = plans.find((plan) => plan.id === values.planId && plan.status === "Active");
  const renewalPlan = plans.find((plan) => plan.id === renewValues.planId && plan.status === "Active");

  function openCreate() {
    setError("");
    setFormErrors({});
    setValues({ memberId: "", planId: "", startDate: data.today || "", amountPaid: "0", method: "cash" });
    setCreating(true);
  }

  function updateCreateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function openDetails(id) {
    setError("");
    try {
      const subscription = await getSubscription(id);
      setSelected(subscription);
      setRenewValues({ planId: subscription.planId, amountPaid: "0", method: "cash" });
      setRenewing(false);
    } catch (loadError) {
      setError(loadError.message || "Could not load membership details.");
    }
  }

  async function submitCreate(event) {
    event.preventDefault();
    const errors = {};
    if (!values.memberId) errors.memberId = "Choose a member.";
    if (!selectedPlan) errors.planId = "Choose an active plan.";
    if (!values.startDate) errors.startDate = "Choose a start date.";
    Object.assign(errors, validatePayment(values.amountPaid, values.method, selectedPlan?.price || 0));
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      const result = await createSubscription({
        memberId: values.memberId,
        planId: selectedPlan.id,
        startDate: values.startDate,
        agreedPrice: selectedPlan.price,
        amountPaid: Number(values.amountPaid),
        method: values.method,
      }, requestKey());
      setCreating(false);
      await load();
      setSelected(result);
    } catch (saveError) {
      setFormErrors(saveError.fields || {});
      setError(saveError.message || "Could not create membership.");
    } finally {
      setSaving(false);
    }
  }

  async function submitRenew(event) {
    event.preventDefault();
    if (!selected) return;
    const errors = {};
    if (!renewalPlan) errors.planId = "Choose an active plan.";
    Object.assign(errors, validatePayment(renewValues.amountPaid, renewValues.method, renewalPlan?.price || 0));
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError("");
    try {
      await renewSubscription(selected._id, {
        planId: renewalPlan.id,
        agreedPrice: renewalPlan.price,
        startDate: selected.status === "active" ? undefined : data.today,
        amountPaid: Number(renewValues.amountPaid),
        method: renewValues.method,
      }, requestKey());
      setSelected(await getSubscription(selected._id));
      setRenewing(false);
      await load();
    } catch (saveError) {
      setFormErrors(saveError.fields || {});
      setError(saveError.message || "Could not renew membership.");
    } finally {
      setSaving(false);
    }
  }

  async function cancel() {
    if (!selected || !window.confirm("Cancel this membership? Its financial history will be kept.")) return;
    setSaving(true);
    setError("");
    try {
      await cancelSubscription(selected._id);
      setSelected(await getSubscription(selected._id));
      await load();
    } catch (cancelError) {
      setError(cancelError.message || "Could not cancel membership.");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "member", label: "Member", render: (item) => <div className="min-w-36"><p className="font-semibold text-ink">{item.member?.fullName || "Member unavailable"}</p><p className="mt-1 text-xs text-ink-muted">{item.member?.phone || ""}</p></div> },
    { key: "plan", label: "Plan", render: (item) => item.planSnapshot?.name || item.plan?.name || "Plan unavailable" },
    { key: "dates", label: "Period", render: (item) => <span className="whitespace-nowrap">{dateLabel(item.startDate)} – {dateLabel(item.expiryDate)}</span> },
    { key: "price", label: "Price", render: (item) => money(item.agreedPrice) },
    { key: "balance", label: "Balance", render: (item) => <span className="whitespace-nowrap">{money(item.balance)} due</span> },
    { key: "status", label: "Status", render: (item) => <Badge tone={statusTone(item.status)}>{item.status}</Badge> },
    { key: "view", label: "", render: (item) => <Button type="button" variant="ghost" size="sm" onClick={() => openDetails(item._id)}>View</Button> },
  ];

  const pageCount = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 md:space-y-6 md:p-8">
      <PageHeader
        eyebrow="MEMBER EXPERIENCE"
        title="Memberships"
        description="Manage subscriptions, payments, and renewal history."
        actions={tab === "subscriptions" && <Button type="button" onClick={openCreate}><Plus size={16} aria-hidden="true" />Create membership</Button>}
      />

      <Tabs
        items={[{ id: "subscriptions", label: `Subscriptions (${data.total})` }, { id: "plans", label: "Plans" }]}
        value={tab}
        onChange={setTab}
        idPrefix="memberships"
        label="Membership management"
      />

      <section id={`memberships-${tab}-panel`} role="tabpanel" aria-labelledby={`memberships-${tab}-tab`} tabIndex={0}>
        {tab === "plans" ? <PlansManager /> : (
          <div className="space-y-4">
            {error && !creating && !selected && <ErrorState title="Membership action failed" description={error} onRetry={load} loading={loading} />}
            <Card className="p-4 md:p-5">
              <SearchBar id="membership-search" label="Search memberships" placeholder="Search by member name or phone" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} onClear={() => { setSearch(""); setPage(1); }} autoComplete="off" />
            </Card>
            {loading ? (
              <Card className="space-y-4 p-4 md:p-5" role="status" aria-label="Loading memberships">
                <Skeleton className="h-6 max-w-52" />
                {Array.from({ length: 5 }, (_, index) => <Skeleton className="h-12" key={index} />)}
              </Card>
            ) : error ? null : data.items.length === 0 ? (
              <Card className="p-4 md:p-5"><EmptyState title="No memberships found" description={search ? "Try another member name or phone number." : "Create a membership for an existing member and plan."} action={!search && <Button type="button" onClick={openCreate}>Create membership</Button>} /></Card>
            ) : (
              <Card className="overflow-hidden p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div><h2 className="text-base font-semibold text-ink">Subscription records</h2><p className="mt-1 text-sm text-ink-muted">{data.total.toLocaleString("en-PK")} total memberships</p></div>
                </div>
                <div className="hidden md:block"><DataTable caption="Membership subscriptions" columns={columns} rows={data.items} getRowKey={(item) => item._id} /></div>
                <ul className="divide-y divide-line md:hidden" aria-label="Membership subscriptions">
                  {data.items.map((item) => (
                    <li className="space-y-3 py-4 first:pt-1 last:pb-1" key={item._id}>
                      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold text-ink">{item.member?.fullName || "Member unavailable"}</p><p className="mt-1 break-all text-sm text-ink-muted">{item.member?.phone || ""}</p></div><Badge tone={statusTone(item.status)}>{item.status}</Badge></div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div><dt className="text-xs text-ink-muted">Plan</dt><dd className="mt-0.5 break-words text-ink">{item.planSnapshot?.name || item.plan?.name || "Plan unavailable"}</dd></div>
                        <div><dt className="text-xs text-ink-muted">Period</dt><dd className="mt-0.5 text-ink">{dateLabel(item.startDate)} – {dateLabel(item.expiryDate)}</dd></div>
                        <div><dt className="text-xs text-ink-muted">Agreed price</dt><dd className="mt-0.5 text-ink">{money(item.agreedPrice)}</dd></div>
                        <div><dt className="text-xs text-ink-muted">Balance due</dt><dd className="mt-0.5 text-ink">{money(item.balance)}</dd></div>
                      </dl>
                      <Button type="button" variant="secondary" size="sm" onClick={() => openDetails(item._id)}>View membership</Button>
                    </li>
                  ))}
                </ul>
                {pageCount > 1 && <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-ink-muted">Page {data.page} of {pageCount}</span><div className="flex gap-2"><Button type="button" variant="secondary" size="sm" disabled={data.page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button type="button" variant="secondary" size="sm" disabled={data.page >= pageCount || loading} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>}
              </Card>
            )}
          </div>
        )}
      </section>

      <Modal open={creating} onClose={() => { if (!saving) setCreating(false); }} title="Create membership" description="Select an active plan. Its price and expiry are calculated from the saved plan details." dismissible={!saving}>
        <form className="space-y-4" onSubmit={submitCreate} noValidate>
          <Select id="create-membership-member" label="Member" required value={values.memberId} onChange={(event) => updateCreateValue("memberId", event.target.value)} error={formErrors.memberId}>
            <option value="">Choose a member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.phone}</option>)}
          </Select>
          <Select id="create-membership-plan" label="Plan" required value={values.planId} onChange={(event) => updateCreateValue("planId", event.target.value)} error={formErrors.planId}>
            <option value="">Choose a plan</option>{plans.filter((plan) => plan.status === "Active").map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price)}</option>)}
          </Select>
          <Input id="create-membership-price" label="Plan price (PKR)" value={selectedPlan ? money(selectedPlan.price) : ""} readOnly hint="Read from the selected plan." />
          <Input id="create-membership-date" label="Start date" type="date" required value={values.startDate} onChange={(event) => updateCreateValue("startDate", event.target.value)} error={formErrors.startDate} />
          <Input id="create-membership-payment" label="Payment received now (PKR)" type="number" min="0" max={selectedPlan?.price || undefined} step="1" inputMode="numeric" value={values.amountPaid} onChange={(event) => updateCreateValue("amountPaid", event.target.value)} error={formErrors.amountPaid} />
          {Number(values.amountPaid) > 0 && <Select id="create-membership-method" label="Payment method" required value={values.method} onChange={(event) => updateCreateValue("method", event.target.value)} error={formErrors.method}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option></Select>}
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={saving} onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" loading={saving} loadingLabel="Saving membership…">Create membership</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => { if (!saving) { setSelected(null); setRenewing(false); } }} title="Membership details" description={selected ? `${selected.member?.fullName || "Member"} · ${selected.planSnapshot?.name || selected.plan?.name || "Plan"}` : ""} className="max-w-2xl" dismissible={!saving}>
        {selected && <div className="space-y-5">
          {error && <ErrorState title="Membership action failed" description={error} />}
          <dl className="grid grid-cols-2 gap-4 rounded-lg bg-canvas p-4 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-ink-muted">Status</dt><dd className="mt-1"><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></dd></div>
            <div><dt className="text-xs text-ink-muted">Period</dt><dd className="mt-1 font-medium text-ink">{dateLabel(selected.startDate)} – {dateLabel(selected.expiryDate)}</dd></div>
            <div><dt className="text-xs text-ink-muted">Agreed price</dt><dd className="mt-1 font-medium text-ink">{money(selected.agreedPrice)}</dd></div>
            <div><dt className="text-xs text-ink-muted">Balance due</dt><dd className="mt-1 font-medium text-ink">{money(selected.balance)}</dd></div>
          </dl>
          <section><h3 className="font-semibold text-ink">Renewal history</h3>{selected.renewalHistory?.length ? <ol className="mt-2 divide-y divide-line rounded-lg border border-line">{selected.renewalHistory.map((term, index) => <li className="flex flex-wrap justify-between gap-2 p-3 text-sm" key={`${term.renewalKey}-${index}`}><span>{term.planSnapshot.name} · {dateLabel(term.startDate)} – {dateLabel(term.expiryDate)}</span><strong>{money(term.planSnapshot.agreedPrice)}</strong></li>)}</ol> : <p className="mt-2 text-sm text-ink-muted">No renewals recorded.</p>}</section>
          {renewing ? <form className="space-y-4 rounded-lg border border-line p-4" onSubmit={submitRenew} noValidate>
            <div><h3 className="font-semibold text-ink">Renew membership</h3><p className="mt-1 text-sm text-ink-muted">{selected.status === "active" ? "The next term starts the day after the current expiry." : "The next term starts today or on a selected future date."}</p></div>
            <Select id="renew-membership-plan" label="Plan" required value={renewValues.planId} onChange={(event) => { setRenewValues((current) => ({ ...current, planId: event.target.value })); setFormErrors((current) => ({ ...current, planId: undefined })); }} error={formErrors.planId}><option value="">Choose an active plan</option>{plans.filter((plan) => plan.status === "Active").map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {money(plan.price)}</option>)}</Select>
            <Input id="renew-membership-price" label="Plan price (PKR)" value={renewalPlan ? money(renewalPlan.price) : ""} readOnly hint="Read from the selected plan." />
            <Input id="renew-membership-payment" label="Payment received now (PKR)" type="number" min="0" max={renewalPlan?.price || undefined} step="1" inputMode="numeric" value={renewValues.amountPaid} onChange={(event) => { setRenewValues((current) => ({ ...current, amountPaid: event.target.value })); setFormErrors((current) => ({ ...current, amountPaid: undefined })); }} error={formErrors.amountPaid} />
            {Number(renewValues.amountPaid) > 0 && <Select id="renew-membership-method" label="Payment method" required value={renewValues.method} onChange={(event) => setRenewValues((current) => ({ ...current, method: event.target.value }))} error={formErrors.method}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option></Select>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={saving} onClick={() => setRenewing(false)}>Back</Button><Button type="submit" loading={saving} loadingLabel="Renewing…">Confirm renewal</Button></div>
          </form> : <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button href={`/members/${selected.memberId}`} variant="secondary">View member</Button>
            {selected.status !== "cancelled" && <><Button type="button" variant="secondary" disabled={saving} onClick={() => { setFormErrors({}); setError(""); setRenewValues({ planId: selected.planId, amountPaid: "0", method: "cash" }); setRenewing(true); }}>Renew</Button><Button type="button" variant="danger" disabled={saving} onClick={cancel}>Cancel membership</Button></>}
          </div>}
        </div>}
      </Modal>
    </main>
  );
}
