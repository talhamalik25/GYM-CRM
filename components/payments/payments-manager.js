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
import PageHeader from "../ui/page-header";
import SearchBar from "../ui/search-bar";
import Select from "../ui/select";
import StatCard from "../ui/stat-card";
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
    <div className="payments-page">
      <PageHeader
        title="Payments"
        description="Record member payments and keep track of outstanding balances."
        actions={<Button onClick={openForm}><CreditCard size={16} strokeWidth={1.75} aria-hidden="true" />Record payment</Button>}
      />

      <div className="payments-stats">
        <StatCard label="Collected this month" value={formatCurrency(summary.collected)} icon={<CreditCard size={18} strokeWidth={1.75} />} />
        <StatCard label="Pending dues" value={formatCurrency(summary.pendingDues)} icon={<ReceiptText size={18} strokeWidth={1.75} />} />
        <StatCard label="Payments this month" value={summary.paymentCount.toLocaleString("en-PK")} icon={<CalendarDays size={18} strokeWidth={1.75} />} />
      </div>

      <Card className="payments-filter-card">
        <div className="payments-filter-grid">
          <SearchBar id="payment-search" label="Search members" placeholder="Search by member name" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} onClear={() => { setQuery(""); setPage(1); }} autoComplete="off" />
          <Select id="payment-status-filter" label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="All">All statuses</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Pending">Pending</option>
          </Select>
          <Select id="payment-method-filter" label="Payment method" value={methodFilter} onChange={(event) => { setMethodFilter(event.target.value); setPage(1); }}>
            <option value="All">All methods</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input id="payment-month-filter" label="Month" type="month" value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setPage(1); }} />
        </div>
      </Card>

      {loadError && <Card className="payments-error-card"><ErrorState title="Could not load payment data" description={loadError} onRetry={() => setRefreshKey((key) => key + 1)} /></Card>}

      {total === 0 ? (
        <Card className="payments-state-card">
          <EmptyState
            icon={<CreditCard size={25} strokeWidth={1.7} />}
            title="No payments yet"
            description="Record a member payment to start the payment history."
            action={<Button onClick={openForm}><CreditCard size={15} aria-hidden="true" />Record payment</Button>}
          />
        </Card>
      ) : payments.length === 0 ? (
        <Card className="payments-state-card">
          <EmptyState
            icon={<Search size={25} strokeWidth={1.7} />}
            title="No payments match these filters"
            description="Try another member name, status, method, or month."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <Card className="payments-results-card">
          <div className="payments-section-heading">
            <div><h2>Payment history</h2><p>View recorded member payments and receipts.</p></div>
            <span className="payments-result-count">{total.toLocaleString("en-PK")} {total === 1 ? "payment" : "payments"}</span>
          </div>
          <DataTable caption="Payment history" columns={columns} rows={payments} getRowKey={(payment) => payment.id} className="payments-data-table" pagination={total > 10 ? { page, pageSize: 10, total, onPageChange: setPage } : undefined} />
        </Card>
      )}

      <Card className="payments-dues-card">
        <div className="payments-section-heading">
          <div><h2>Members with dues</h2><p>Outstanding balances across member accounts.</p></div>
          <UsersRound size={19} strokeWidth={1.75} aria-hidden="true" />
        </div>
        {dues.length ? (
          <ul className="payments-dues-list">
            {dues.map((member) => (
              <li key={member.memberId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div><p>{member.memberName}</p><small>{member.paymentCount} outstanding {member.paymentCount === 1 ? "payment" : "payments"}</small></div>
                <strong>{formatCurrency(member.balance)}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="payments-no-dues">No members have outstanding dues.</p>}
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
