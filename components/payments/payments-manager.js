"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, ReceiptText, Search, UsersRound } from "lucide-react";
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
import StatCard from "../ui/stat-card";
import Textarea from "../ui/textarea";
import PaymentReceiptModal from "./payment-receipt-modal";
import RecordPaymentModal from "./record-payment-modal";
import { getMembersWithDues, getPaymentSummary, getPayments, getPaymentById, paymentMethods, voidPayment } from "../../lib/paymentsService";

function formatCurrency(amount) {
  return `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function statusTone(status) {
  if (status === "Paid") return "success";
  if (status === "Partial") return "warning";
  if (status === "Voided") return "error";
  return "neutral";
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ collected: 0, pendingDues: 0, paymentCount: 0 });
  const [dues, setDues] = useState([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadErrorState, setLoadErrorState] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestKey = JSON.stringify([debouncedQuery, statusFilter, methodFilter, monthFilter, page, refreshKey]);
  const loading = loadedRequestKey !== requestKey;
  const loadError = loadErrorState?.key === requestKey ? loadErrorState.message : "";

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPayments({ search: debouncedQuery, status: statusFilter, method: methodFilter, month: monthFilter, page, limit: 10 }),
      getPaymentSummary(),
      getMembersWithDues(),
    ]).then(([result, nextSummary, nextDues]) => {
      if (cancelled) return;
      setPayments(result);
      setTotal(result.total);
      setSummary(nextSummary);
      setDues(nextDues);
      setLoadErrorState(null);
    }).catch((error) => {
      if (!cancelled) setLoadErrorState({ key: requestKey, message: error.message || "Could not load payment data." });
    }).finally(() => {
      if (!cancelled) setLoadedRequestKey(requestKey);
    });
    return () => { cancelled = true; };
  }, [requestKey, debouncedQuery, statusFilter, methodFilter, monthFilter, page, refreshKey]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setMethodFilter("All");
    setMonthFilter("");
    setPage(1);
  }

  async function openReceipt(payment) {
    try {
      setReceipt(await getPaymentById(payment.id));
    } catch (error) {
      setLoadErrorState({ key: requestKey, message: error.message || "Could not load this receipt." });
    }
  }

  async function submitVoid(event) {
    event.preventDefault();
    const reason = voidReason.trim();
    if (!reason) {
      setVoidError("Enter a reason for voiding this payment.");
      return;
    }
    setVoidSubmitting(true);
    setVoidError("");
    try {
      await voidPayment(voidingPayment.id, reason);
      setVoidingPayment(null);
      setVoidReason("");
      setNotice(`Receipt ${voidingPayment.receiptNumber} was voided. Its history has been preserved.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setVoidError(error.message || "Could not void this payment.");
    } finally {
      setVoidSubmitting(false);
    }
  }

  const columns = [
    { key: "date", label: "Date", render: (payment) => formatDate(payment.date) },
    { key: "memberName", label: "Member", render: (payment) => <span className="font-medium text-ink">{payment.memberName}</span> },
    { key: "planName", label: "Plan" },
    { key: "amountPaid", label: "Amount", render: (payment) => <span className="font-medium text-ink">{formatCurrency(payment.amountPaid)}</span> },
    { key: "method", label: "Method" },
    { key: "status", label: "Status", render: (payment) => <Badge tone={statusTone(payment.status)}>{payment.status}</Badge> },
    { key: "receipt", label: "Actions", render: (payment) => <div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => openReceipt(payment)}><ReceiptText size={15} aria-hidden="true" />Receipt</Button>{payment.canVoid && <Button type="button" variant="ghost" size="sm" onClick={() => { setVoidingPayment(payment); setVoidReason(""); setVoidError(""); }}>Void</Button>}</div> },
  ];

  const hasFilters = Boolean(query || statusFilter !== "All" || methodFilter !== "All" || monthFilter);

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="Payments"
        description="Record member payments and keep track of outstanding balances."
        actions={<Button type="button" onClick={() => setOpen(true)}><CreditCard size={16} strokeWidth={1.75} aria-hidden="true" />Record payment</Button>}
      />

      {loadError && <ErrorState title="Could not load payment data" description={loadError} onRetry={() => setRefreshKey((key) => key + 1)} loading={loading} />}
      {notice && <Card className="border-success bg-success-soft p-3 text-sm text-success" role="status">{notice}</Card>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Collected this month" value={loading ? undefined : formatCurrency(summary.collected)} loading={loading} icon={<CreditCard size={18} strokeWidth={1.75} />} />
        <StatCard label="Pending dues" value={loading ? undefined : formatCurrency(summary.pendingDues)} loading={loading} icon={<ReceiptText size={18} strokeWidth={1.75} />} />
        <StatCard label="Payments this month" value={loading ? undefined : summary.paymentCount.toLocaleString("en-PK")} loading={loading} icon={<CalendarDays size={18} strokeWidth={1.75} />} />
      </div>

      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SearchBar id="payment-search" label="Search members" placeholder="Search by member name" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} onClear={() => { setQuery(""); setPage(1); }} autoComplete="off" />
          <Select id="payment-status-filter" label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="All">All statuses</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Pending">Pending</option><option value="Voided">Voided</option>
          </Select>
          <Select id="payment-method-filter" label="Payment method" value={methodFilter} onChange={(event) => { setMethodFilter(event.target.value); setPage(1); }}>
            <option value="All">All methods</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input id="payment-month-filter" label="Month" type="month" value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setPage(1); }} />
        </div>
      </Card>

      {loading ? <Card className="space-y-4 p-4 md:p-5" role="status" aria-label="Loading payments"><Skeleton className="h-5 max-w-48" />{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-12" key={index} />)}</Card> : loadError ? null : total === 0 ? (
        <Card className="p-4 md:p-5"><EmptyState icon={hasFilters ? <Search size={25} strokeWidth={1.7} /> : <CreditCard size={25} strokeWidth={1.7} />} title={hasFilters ? "No payments match these filters" : "No payments yet"} description={hasFilters ? "Try another member name, status, method, or month." : "Record a member payment to start the payment history."} action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : <Button onClick={() => setOpen(true)}><CreditCard size={15} aria-hidden="true" />Record payment</Button>} /></Card>
      ) : (
        <Card className="overflow-hidden p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold text-ink">Payment history</h2><p className="mt-1 text-sm text-ink-muted">View recorded payments and receipts.</p></div><span className="text-sm text-ink-muted">{total.toLocaleString("en-PK")} {total === 1 ? "payment" : "payments"}</span></div>
          <div className="hidden md:block"><DataTable caption="Payment history" columns={columns} rows={payments} getRowKey={(payment) => payment.id} pagination={total > 10 ? { page, pageSize: 10, total, onPageChange: setPage } : undefined} /></div>
          <ul className="divide-y divide-line md:hidden" aria-label="Payment history">
            {payments.map((payment) => <li className="space-y-3 py-4 first:pt-1 last:pb-1" key={payment.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold text-ink">{payment.memberName}</p><p className="mt-1 text-sm text-ink-muted">{payment.receiptNumber}</p></div><Badge tone={statusTone(payment.status)}>{payment.status}</Badge></div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm"><div><dt className="text-xs text-ink-muted">Date</dt><dd className="mt-0.5 text-ink">{formatDate(payment.date)}</dd></div><div><dt className="text-xs text-ink-muted">Amount</dt><dd className="mt-0.5 font-medium text-ink">{formatCurrency(payment.amountPaid)}</dd></div><div><dt className="text-xs text-ink-muted">Plan</dt><dd className="mt-0.5 break-words text-ink">{payment.planName}</dd></div><div><dt className="text-xs text-ink-muted">Method</dt><dd className="mt-0.5 text-ink">{payment.method}</dd></div></dl>
              <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => openReceipt(payment)}><ReceiptText size={15} aria-hidden="true" />Receipt</Button>{payment.canVoid && <Button type="button" variant="ghost" size="sm" onClick={() => { setVoidingPayment(payment); setVoidReason(""); setVoidError(""); }}>Void payment</Button>}</div>
            </li>)}
          </ul>
          {total > 10 && <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm"><span className="text-ink-muted">Page {page} · {total.toLocaleString("en-PK")} payments</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page * 10 >= total || loading} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>}
        </Card>
      )}

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">Members with dues</h2><p className="mt-1 text-sm text-ink-muted">Outstanding balances across member accounts.</p></div><UsersRound size={19} strokeWidth={1.75} aria-hidden="true" className="text-ink-muted" /></div>
        {loading ? <p className="text-sm text-ink-muted" role="status">Loading outstanding balances…</p> : loadError ? null : dues.length ? <ul className="divide-y divide-line">{dues.map((member) => <li key={member.memberId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"><div><p className="font-medium text-ink">{member.memberName}</p><small className="text-xs text-ink-muted">{member.paymentCount} outstanding {member.paymentCount === 1 ? "payment" : "payments"}</small></div><strong className="text-ink">{formatCurrency(member.balance)}</strong></li>)}</ul> : <EmptyState title="No members have outstanding dues" description="Balances appear here when a membership has an unpaid amount." />}
      </Card>

      <RecordPaymentModal open={open} onClose={() => setOpen(false)} onSaved={(saved) => { setNotice("Payment recorded. Receipt history is available below."); setRefreshKey((key) => key + 1); setReceipt(saved); }} />
      <PaymentReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      <Modal open={Boolean(voidingPayment)} onClose={() => { if (!voidSubmitting) setVoidingPayment(null); }} title="Void payment" description={voidingPayment ? `Receipt ${voidingPayment.receiptNumber} · ${formatCurrency(voidingPayment.amountPaid)}` : "Preserve this receipt and its audit history."} dismissible={!voidSubmitting}>
        <form className="space-y-4" onSubmit={submitVoid} noValidate>
          <p className="text-sm text-ink-muted">Voiding preserves the receipt, records who voided it, and removes the payment from collections and dues calculations.</p>
          <Textarea id="payment-void-reason" label="Reason" required maxLength={1000} value={voidReason} onChange={(event) => { setVoidReason(event.target.value); setVoidError(""); }} error={voidError} />
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={voidSubmitting} onClick={() => setVoidingPayment(null)}>Keep payment</Button><Button type="submit" variant="danger" loading={voidSubmitting} loadingLabel="Voiding…">Void payment</Button></div>
        </form>
      </Modal>
    </div>
  );
}
