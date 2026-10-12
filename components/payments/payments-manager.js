"use client";

import { useEffect, useMemo, useState } from "react";
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
  getInitialPayments,
  getMembersWithDues,
  getPaymentSummary,
  getPayments,
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
  const [payments, setPayments] = useState(getInitialPayments);
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPayments(getPayments());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const summary = useMemo(() => getPaymentSummary(payments), [payments]);
  const dues = useMemo(() => getMembersWithDues(payments), [payments]);
  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesMember = !normalizedQuery || payment.memberName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
      const matchesMethod = methodFilter === "All" || payment.method === methodFilter;
      const matchesMonth = !monthFilter || payment.date.startsWith(monthFilter);
      return matchesMember && matchesStatus && matchesMethod && matchesMonth;
    });
  }, [payments, query, statusFilter, methodFilter, monthFilter]);

  function openForm() {
    setOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setMethodFilter("All");
    setMonthFilter("");
  }

  const columns = [
    { key: "date", label: "Date", render: (payment) => formatDate(payment.date) },
    { key: "memberName", label: "Member", render: (payment) => <span className="font-medium text-ink">{payment.memberName}</span> },
    { key: "planName", label: "Plan" },
    { key: "amountPaid", label: "Amount", render: (payment) => <span className="font-medium text-ink">{formatCurrency(payment.amountPaid)}</span> },
    { key: "method", label: "Method" },
    { key: "status", label: "Status", render: (payment) => <Badge tone={statusTone(payment.status)}>{payment.status}</Badge> },
    { key: "receipt", label: "Receipt", render: (payment) => <Button type="button" variant="ghost" size="sm" onClick={() => setReceipt(payment)}><ReceiptText size={15} aria-hidden="true" />View receipt</Button> },
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
          <Input id="payment-search" label="Search members" type="search" placeholder="Search by member name" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
          <Select id="payment-status-filter" label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All statuses</option><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Pending">Pending</option>
          </Select>
          <Select id="payment-method-filter" label="Payment method" value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
            <option value="All">All methods</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </Select>
          <Input id="payment-month-filter" label="Month" type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
        </div>
      </Card>

      {payments.length === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={<CreditCard size={25} strokeWidth={1.7} />}
            title="No payments yet"
            description="Record a member payment to start the payment history."
            action={<Button onClick={openForm}><CreditCard size={15} aria-hidden="true" />Record Payment</Button>}
          />
        </Card>
      ) : filteredPayments.length === 0 ? (
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
            <span className="text-xs text-ink-muted">{filteredPayments.length} {filteredPayments.length === 1 ? "payment" : "payments"}</span>
          </div>
          <Table columns={columns} rows={filteredPayments} getRowKey={(payment) => payment.id} className="min-w-[760px]" />
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
          setPayments(getPayments());
          setReceipt(saved);
        }}
      />
      <PaymentReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
