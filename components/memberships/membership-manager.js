"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import PlansManager from "../plans/plans-manager";
import PageHeading from "../ui/page-heading";
import { listPlans } from "../../lib/plansService";
import { listMembersApi } from "../../lib/membersService";
import { cancelSubscription, createSubscription, getSubscription, listSubscriptions, renewSubscription } from "../../lib/subscriptionsService";

const money = value => `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
const dateLabel = value => value ? new Date(value).toLocaleDateString("en-PK", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }) : "—";
const key = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

function useDialogFocus(open, dialogRef) {
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const focusable = () => [...(dialog?.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled)') || [])];
    (focusable()[0] || dialog)?.focus();
    const containFocus = (event) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog?.focus();
      } else if (event.shiftKey && (document.activeElement === dialog || document.activeElement === items[0] || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && (document.activeElement === items[items.length - 1] || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        items[0].focus();
      }
    };
    window.addEventListener("keydown", containFocus);
    return () => {
      window.removeEventListener("keydown", containFocus);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open, dialogRef]);
}

export default function MembershipManager() {
  const [tab, setTab] = useState("subscriptions");
  const [data, setData] = useState({ items: [], total: 0 });
  const [plans, setPlans] = useState([]); const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); const [creating, setCreating] = useState(false); const [renewing, setRenewing] = useState(false); const [saving, setSaving] = useState(false);
  const createDialogRef = useRef(null); const detailsDialogRef = useRef(null);
  useDialogFocus(creating, createDialogRef);
  useDialogFocus(Boolean(selected), detailsDialogRef);
  const [values, setValues] = useState({ memberId: "", planId: "", startDate: "", agreedPrice: "", amountPaid: "0", method: "cash" });
  useEffect(() => {
    if (!creating && !selected) return;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape" || saving) return;
      if (creating) setCreating(false);
      else { setSelected(null); setRenewing(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [creating, selected, saving]);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [result, availablePlans, memberResult] = await Promise.all([listSubscriptions({ search, page }), listPlans({ activeOnly: true }), listMembersApi({ status: "all", limit: 50 })]); setData(result); setPlans(availablePlans); setMembers(memberResult.items); setValues(current => ({ ...current, startDate: current.startDate || result.today || memberResult.today || "" })); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [search, page]);
  useEffect(() => { const timer = window.setTimeout(() => { load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  async function openDetails(id) { setError(""); try { setSelected(await getSubscription(id)); setRenewing(false); } catch (e) { setError(e.message); } }
  function updatePlan(planId) { const plan = plans.find(item => item.id === planId); setValues(current => ({ ...current, planId, agreedPrice: plan ? String(plan.price) : "" })); }
  async function submitCreate(event) { event.preventDefault(); setSaving(true); setError(""); try { const result = await createSubscription({ ...values, agreedPrice: Number(values.agreedPrice), amountPaid: Number(values.amountPaid) }, key()); setCreating(false); setValues({ memberId: "", planId: "", startDate: data.today || "", agreedPrice: "", amountPaid: "0", method: "cash" }); await load(); setSelected(result); } catch (e) { setError(e.message); } finally { setSaving(false); } }
  async function submitRenew(event) { event.preventDefault(); if (!selected) return; setSaving(true); setError(""); try { const result = await renewSubscription(selected._id, { planId: selected.planId, startDate: selected.status === "active" ? undefined : data.today, agreedPrice: Number(values.agreedPrice || selected.agreedPrice), amountPaid: Number(values.amountPaid || 0), method: values.method }, key()); const refreshed = await getSubscription(selected._id); setSelected(refreshed || result); setRenewing(false); await load(); } catch (e) { setError(e.message); } finally { setSaving(false); } }
  async function cancel() { if (!selected || !window.confirm("Cancel this membership? Its financial history will be kept.")) return; setSaving(true); try { await cancelSubscription(selected._id); setSelected(await getSubscription(selected._id)); await load(); } catch (e) { setError(e.message); } finally { setSaving(false); } }
  function handleTabKeyDown(event) {
    const tabs = [...event.currentTarget.parentElement.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(event.currentTarget);
    const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
      : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length
        : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  }
  return <main className="membership-manager mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
    <PageHeading eyebrow="MEMBER EXPERIENCE" title="Memberships" description="Manage subscriptions, payments, and renewal history." action={tab === "subscriptions" && <button className="ui-button ui-button-primary ui-button-md" type="button" onClick={() => { setError(""); setCreating(true); }}>Create membership</button>} />
    <nav className="membership-tabs" aria-label="Membership management" role="tablist"><button id="memberships-subscriptions-tab" type="button" role="tab" aria-controls="memberships-panel" aria-selected={tab === "subscriptions"} tabIndex={tab === "subscriptions" ? 0 : -1} className={tab === "subscriptions" ? "active" : ""} onKeyDown={handleTabKeyDown} onClick={() => setTab("subscriptions")}>Subscriptions <span>({data.total})</span></button><button id="memberships-plans-tab" type="button" role="tab" aria-controls="memberships-panel" aria-selected={tab === "plans"} tabIndex={tab === "plans" ? 0 : -1} className={tab === "plans" ? "active" : ""} onKeyDown={handleTabKeyDown} onClick={() => setTab("plans")}>Plans</button></nav>
    <div id="memberships-panel" role="tabpanel" aria-labelledby={tab === "plans" ? "memberships-plans-tab" : "memberships-subscriptions-tab"} tabIndex={0}>
    {tab === "plans" ? <PlansManager /> : <>
      {error && <p role="alert" className="rounded-lg border border-danger bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      <label className="block max-w-lg"><span className="sr-only">Search memberships</span><input className="w-full rounded-lg border px-3 py-2" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by member name or phone" /></label>
      {loading ? <p role="status" className="rounded-xl border bg-white p-10 text-center text-ink-subtle">Loading memberships…</p> : !data.items.length ? <section className="rounded-xl border bg-white p-10 text-center"><h2 className="font-semibold">No memberships found</h2><p className="mt-2 text-sm text-ink-subtle">Create a membership for an existing member and plan.</p></section> : <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-surface-raised text-xs uppercase text-ink-subtle"><tr>{["Member", "Plan", "Dates", "Price", "Payment", "Status", ""].map(x => <th className="px-4 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{data.items.map(item => <tr className="border-t" key={item._id}><td className="px-4 py-3"><strong>{item.member?.fullName || "Member unavailable"}</strong><div className="text-xs text-ink-subtle">{item.member?.phone}</div></td><td className="px-4 py-3">{item.planSnapshot?.name || item.plan?.name}</td><td className="px-4 py-3">{dateLabel(item.startDate)} – {dateLabel(item.expiryDate)}</td><td className="px-4 py-3">{money(item.agreedPrice)}</td><td className="px-4 py-3 capitalize">{item.paymentStatus} · {money(item.balance)} due</td><td className="px-4 py-3 capitalize">{item.status}</td><td className="px-4 py-3"><button className="font-semibold text-brand" onClick={() => openDetails(item._id)}>View</button></td></tr>)}</tbody></table></div>}
      {data.total > data.limit && <div className="flex items-center justify-between text-sm"><span>Page {data.page} · {data.total} memberships</span><div className="flex gap-2"><button disabled={data.page <= 1 || loading} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage(current => current - 1)}>Previous</button><button disabled={data.page * data.limit >= data.total || loading} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage(current => current + 1)}>Next</button></div></div>}
    </>}
    </div>
    {creating && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-overlay p-4"><form ref={createDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="create-membership-title" onSubmit={submitCreate} className="my-8 w-full max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-lg"><div className="flex justify-between"><div><h2 id="create-membership-title" className="text-xl font-semibold">Create membership</h2><p className="text-sm text-ink-subtle">Payment remains pending until a payment is recorded.</p></div><button type="button" disabled={saving} onClick={() => setCreating(false)} aria-label="Close">×</button></div><label className="block text-sm">Member<select required className="mt-1 w-full rounded border p-2" value={values.memberId} onChange={e => setValues({ ...values, memberId: e.target.value })}><option value="">Choose a member</option>{members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.phone}</option>)}</select></label><label className="block text-sm">Plan<select required className="mt-1 w-full rounded border p-2" value={values.planId} onChange={e => updatePlan(e.target.value)}><option value="">Choose a plan</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Start date<input required type="date" className="mt-1 w-full rounded border p-2" value={values.startDate} onChange={e => setValues({ ...values, startDate: e.target.value })}/></label><label className="text-sm">Agreed price (Rs.)<input required type="number" min="1" step="1" className="mt-1 w-full rounded border p-2" value={values.agreedPrice} onChange={e => setValues({ ...values, agreedPrice: e.target.value })}/></label></div><label className="block text-sm">Payment received now (Rs.)<input type="number" min="0" step="1" className="mt-1 w-full rounded border p-2" value={values.amountPaid} onChange={e => setValues({ ...values, amountPaid: e.target.value })}/></label>{Number(values.amountPaid) > 0 && <label className="block text-sm">Payment method<select className="mt-1 w-full rounded border p-2" value={values.method} onChange={e => setValues({ ...values, method: e.target.value })}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option></select></label>}<div className="flex justify-end gap-2"><button type="button" disabled={saving} className="rounded border px-4 py-2" onClick={() => setCreating(false)}>Cancel</button><button disabled={saving} className="rounded bg-brand px-4 py-2 text-white disabled:opacity-50">{saving ? "Saving…" : "Create membership"}</button></div></form></div>}
    {selected && <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-overlay p-4" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setSelected(null); }}><section ref={detailsDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="membership-details-title" className="my-8 w-full max-w-2xl space-y-5 rounded-xl bg-white p-6 shadow-lg"><header className="flex justify-between"><div><p className="text-xs uppercase tracking-widest text-brand">Membership details</p><h2 id="membership-details-title" className="text-xl font-semibold">{selected.member?.fullName || "Member"} · {selected.planSnapshot?.name}</h2></div><button type="button" disabled={saving} onClick={() => { if (!saving) setSelected(null); }} aria-label="Close">×</button></header><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><p><span className="block text-ink-subtle">Status</span><strong className="capitalize">{selected.status}</strong></p><p><span className="block text-ink-subtle">Period</span><strong>{dateLabel(selected.startDate)} – {dateLabel(selected.expiryDate)}</strong></p><p><span className="block text-ink-subtle">Agreed price</span><strong>{money(selected.agreedPrice)}</strong></p><p><span className="block text-ink-subtle">Balance due</span><strong>{money(selected.balance)}</strong></p></div><div><h3 className="font-semibold">Renewal history</h3><ol className="mt-2 divide-y rounded border">{selected.renewalHistory?.map((term, index) => <li className="flex flex-wrap justify-between gap-2 p-3 text-sm" key={`${term.renewalKey}-${index}`}><span>{term.planSnapshot.name} · {dateLabel(term.startDate)} – {dateLabel(term.expiryDate)}</span><strong>{money(term.planSnapshot.agreedPrice)}</strong></li>)}</ol>{!selected.renewalHistory?.length && <p className="text-sm text-ink-subtle">No renewals recorded.</p>}</div>
      {renewing && <form className="space-y-3 rounded-lg bg-surface-raised p-4" onSubmit={submitRenew}><h3 className="font-semibold">Renew membership</h3><p className="text-sm text-ink-muted">{selected.status === "active" ? "The next term starts the day after the current expiry." : "The next term starts today."}</p><label className="block text-sm">Agreed price<input type="number" min="1" step="1" required className="mt-1 w-full rounded border p-2" value={values.agreedPrice || selected.agreedPrice} onChange={e => setValues({ ...values, agreedPrice: e.target.value })}/></label><label className="block text-sm">Payment received now<input type="number" min="0" step="1" className="mt-1 w-full rounded border p-2" value={values.amountPaid} onChange={e => setValues({ ...values, amountPaid: e.target.value })}/></label>{Number(values.amountPaid) > 0 && <select className="w-full rounded border p-2" value={values.method} onChange={e => setValues({ ...values, method: e.target.value })}><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option></select>}<div className="flex justify-end gap-2"><button type="button" className="rounded border px-3 py-2" onClick={() => setRenewing(false)}>Back</button><button disabled={saving} className="rounded bg-brand px-3 py-2 text-white">{saving ? "Saving…" : "Confirm renewal"}</button></div></form>}
      {!renewing && <div className="flex flex-wrap justify-end gap-2"><Link className="rounded border px-3 py-2 text-sm" href={`/members/${selected.memberId}`}>View member</Link>{selected.status !== "cancelled" && <><button disabled={saving} className="rounded border px-3 py-2 text-sm" onClick={() => { setValues({ ...values, agreedPrice: String(selected.agreedPrice), amountPaid: "0" }); setRenewing(true); }}>Renew</button><button disabled={saving} className="rounded border border-danger px-3 py-2 text-sm text-brand" onClick={cancel}>Cancel membership</button></>}</div>}
      </section></div>}
  </main>;
}
