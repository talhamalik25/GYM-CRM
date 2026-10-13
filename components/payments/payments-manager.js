"use client";

import { useEffect, useState } from "react";
import { CreditCard, ReceiptText, Search, UsersRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import Table from "../ui/table";
import PaymentReceiptModal from "./payment-receipt-modal";
import RecordPaymentModal from "./record-payment-modal";
import {
  getMembersWithDues,
  getPaymentSummary,
  getPayments,
  getPaymentById,
  paymentMethods,
} from "../../lib/paymentsService";

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
  return "neutral";
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ collected: 0, pendingDues: 0, paymentCount: 0 });
  const [dues, setDues] = useState([]);
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPayments({ search: debouncedQuery, status: statusFilter, method: methodFilter, month: monthFilter, page, limit: 10 }),
      getPaymentSummary(), getMembersWithDues(),
    ]).then(([result, nextSummary, nextDues]) => {
      if (cancelled) return;
      setPayments(result); setTotal(result.total); setSummary(nextSummary); setDues(nextDues); setLoadError("");
    }).catch((error) => { if (!cancelled) setLoadError(error.message); });
    return () => { cancelled = true; };
  }, [debouncedQuery, statusFilter, methodFilter, monthFilter, page, refreshKey]);

  function openForm() {
    setOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setMethodFilter("All");
    setMonthFilter("");
    setPage(1);
  }

  const columns = [
    { key: "date", label: "Date", render: (payment) => formatDate(payment.date) },
    { key: "memberName", label: "Member", render: (payment) => <span className="font-medium text-ink">{payment.memberName}</span> },
    { key: "planName", label: "Plan" },
    { key: "amountPaid", label: "Amount", render: (payment) => <span className="font-medium text-ink">{formatCurrency(payment.amountPaid)}</span> },
    { key: "method", label: "Method" },
    { key: "status", label: "Status", render: (payment) => <Badge tone={statusTone(payment.status)}>{payment.status}</Badge> },
    { key: "receipt", label: "Receipt", render: (payment) => <Button type="button" variant="ghost" size="sm" onClick={async () => { try { setReceipt(await getPaymentById(payment.id)); } catch (error) { setLoadError(error.message); } }}><ReceiptText size={15} aria-hidden="true" />View receipt</Button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Record member payments and keep track of outstanding balances."
        actions={<Button onClick={openForm}><CreditCard size={16} aria-hidden="true" />Record Payment</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Collected This Month</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{formatCurrency(summary.collected)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Pending Dues</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{formatCurrency(summary.pendingDues)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Payments This Month</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{summary.paymentCount.toLocaleString("en-PK")}</p>
        </Card>
      </div>

      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(13rem,1fr)_10rem_13rem_12rem] md:items-end">
          <Input id="payment-search" label="Search members" type="search" placeholder="Search by member name" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} autoComplete="off" />
          <Select id="payment-status-filter" label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="All">All statuses</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Pending">Pending</option>
          </Select>
          <Select id="payment-method-filter" label="Payment method" value={methodFilter} onChange={(event) => { setMethodFilter(event.target.value); setPage(1); }}>
            <option value="All">All methods</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input id="payment-month-filter" label="Month" type="month" value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setPage(1); }} />
        </div>
      </Card>

      {loadError && <p role="alert" className="text-sm text-error">{loadError}</p>}

      {total === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={<CreditCard size={25} strokeWidth={1.7} />}
            title="No payments yet"
            description="Record a member payment to start the payment history."
            action={<Button onClick={openForm}><CreditCard size={15} aria-hidden="true" />Record Payment</Button>}
          />
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={<Search size={25} strokeWidth={1.7} />}
            title="No payments match these filters"
            description="Try another member name, status, method, or month."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <Card className="min-w-0 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Payment History</h2>
            <span className="text-xs text-ink-muted">{total} {total === 1 ? "payment" : "payments"}</span>
          </div>
          <Table columns={columns} rows={payments} getRowKey={(payment) => payment.id} className="min-w-[760px]" />
          {total > 10 && <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="self-center text-sm text-ink-muted">Page {page} of {Math.ceil(total / 10)}</span><Button variant="secondary" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((value) => value + 1)}>Next</Button></div>}
        </Card>
      )}

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <UsersRound size={18} className="text-ink-muted" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">Members with Dues</h2>
        </div>
        {dues.length ? (
          <ul className="divide-y divide-line">
            {dues.map((member) => (
              <li key={member.memberId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div><p className="font-medium text-ink">{member.memberName}</p><p className="mt-1 text-xs text-ink-muted">{member.paymentCount} outstanding {member.paymentCount === 1 ? "payment" : "payments"}</p></div>
                <strong className="text-sm font-semibold text-ink">{formatCurrency(member.balance)}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink-muted">No members have outstanding dues.</p>}
      </Card>

      <RecordPaymentModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(saved) => {
          setRefreshKey((key) => key + 1);
          setReceipt(saved);
        }}
      />
      <PaymentReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
