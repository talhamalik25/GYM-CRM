"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, CreditCard, ReceiptText, UserRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import PageHeader from "../ui/page-header";
import Table from "../ui/table";
import Tabs from "../ui/tabs";
import PaymentReceiptModal from "../payments/payment-receipt-modal";
import RecordPaymentModal from "../payments/record-payment-modal";
import { formatDuration, getAttendance, getAttendanceByMember, getAttendanceSummary } from "../../lib/attendanceService";
import { getMemberApi, getMembershipDaysRemaining } from "../../lib/membersService";
import { getPaymentSummaryByMember, getPaymentsByMember, getPaymentById } from "../../lib/paymentsService";

function formatDate(date) {
  if (!date) return "Not provided";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}

function formatTime(value, timeZone = "Asia/Karachi") {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatCurrency(amount) {
  return `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;
}

function statusTone(status) {
  if (status === "Active" || status === "Paid") return "success";
  if (status === "Expiring" || status === "Partial") return "warning";
  return "neutral";
}

function DetailField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-subtle">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value || "Not provided"}</dd>
    </div>
  );
}

function PaymentStatus({ status }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export default function MemberDetail({ memberId }) {
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ totalPaid: 0, currentDues: 0 });
  const [attendance, setAttendance] = useState([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceMonthVisits, setAttendanceMonthVisits] = useState(0);
  const [gymTimezone, setGymTimezone] = useState("Asia/Karachi");
  const [ready, setReady] = useState(false);
  const [loadedMemberId, setLoadedMemberId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loadVersion, setLoadVersion] = useState(0);
  const [activeTab, setActiveTab] = useState("payments");
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMemberApi(memberId).then(async (currentMember) => {
      if (cancelled) return;
      const [memberPayments, memberSummary, memberAttendance, attendanceSummary] = await Promise.all([
        getPaymentsByMember(currentMember.id), getPaymentSummaryByMember(currentMember.id),
        getAttendanceByMember(currentMember.id, 1, 20), getAttendanceSummary(),
      ]);
      const monthAttendance = await getAttendance({
        memberId: currentMember.id,
        from: `${attendanceSummary.date.slice(0, 7)}-01`,
        to: attendanceSummary.date,
        limit: 1,
      });
      if (cancelled) return;
      setMember(currentMember);
      setLoadedMemberId(memberId);
      setPayments(memberPayments);
      setPaymentSummary(memberSummary);
      setAttendance(memberAttendance);
      setAttendanceTotal(memberAttendance.total);
      setAttendancePage(1);
      setGymTimezone(attendanceSummary.timeZone);
      setAttendanceMonthVisits(monthAttendance.total);
      setLoadError("");
      setReady(true);
    }).catch((error) => {
      if (cancelled) return;
      setLoadedMemberId(memberId);
      if (error.status === 404 || error.status === 400) {
        setMember(null);
        setLoadError("");
      }
      else setLoadError(error.message || "Could not load this member.");
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [memberId, loadVersion]);

  const lastVisit = attendance[0] || null;
  const visibleVisits = attendance;
  const daysRemaining = member ? (member.daysRemaining ?? getMembershipDaysRemaining(member.expiryDate, member.today)) : null;

  async function handlePaymentSaved(saved) {
    if (!member) return;
    const [memberPayments, memberSummary] = await Promise.all([getPaymentsByMember(member.id), getPaymentSummaryByMember(member.id)]);
    setPayments(memberPayments);
    setPaymentSummary(memberSummary);
    setReceipt(saved);
  }

  async function loadMoreAttendance() {
    const nextPage = attendancePage + 1;
    try {
      const nextRecords = await getAttendanceByMember(member.id, nextPage, 20);
      setAttendance((current) => [...current, ...nextRecords]);
      setAttendancePage(nextPage);
    } catch (error) { setLoadError(error.message || "Could not load attendance history."); }
  }

  async function showReceipt(payment) {
    try { setReceipt(await getPaymentById(payment.id)); } catch { setReceipt(payment); }
  }

  const paymentColumns = [
    { key: "date", label: "Date", render: (payment) => formatDate(payment.date) },
    { key: "amountPaid", label: "Amount", render: (payment) => <span className="font-medium text-ink">{formatCurrency(payment.amountPaid)}</span> },
    { key: "method", label: "Method" },
    { key: "status", label: "Status", render: (payment) => <PaymentStatus status={payment.status} /> },
    { key: "receipt", label: "Receipt", render: (payment) => <Button type="button" variant="ghost" size="sm" onClick={() => showReceipt(payment)}><ReceiptText size={15} aria-hidden="true" />View receipt</Button> },
  ];

  const attendanceColumns = [
    { key: "date", label: "Date", render: (record) => formatDate(record.date) },
    { key: "checkInAt", label: "Check-in", render: (record) => formatTime(record.checkInAt, gymTimezone) },
    { key: "checkOutAt", label: "Check-out", render: (record) => formatTime(record.checkOutAt, gymTimezone) },
    { key: "duration", label: "Duration", render: (record) => record.checkOutAt ? formatDuration(record.durationMinutes) : <span className="text-ink-muted">In progress</span> },
  ];

  if (!ready || loadedMemberId !== memberId) return <Card className="p-6"><p className="text-sm text-ink-muted">Loading member details…</p></Card>;
  if (loadError) return <Card className="space-y-3 p-6" role="alert"><p className="text-sm text-error">{loadError}</p><Button variant="secondary" onClick={() => { setReady(false); setLoadVersion((version) => version + 1); }}>Try again</Button></Card>;
  if (!member) {
    return (
      <Card className="p-5 md:p-6">
        <EmptyState
          icon={<UserRound size={25} strokeWidth={1.7} />}
          title="Member not found"
          description="No member with this ID exists in the database."
          action={<Button href="/members" variant="secondary">Back to members</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.name}
        description={<span className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(member.status)}>{member.status}</Badge><span>{member.phone}</span></span>}
        actions={(
          <>
            <Button href={`/members/${member.id}/edit`} variant="secondary">Edit</Button>
            <Button onClick={() => setRecordPaymentOpen(true)}><CreditCard size={16} aria-hidden="true" />Record Payment</Button>
          </>
        )}
      />

      <Card className="p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink">Profile information</h2>
        <div className="mt-5 grid grid-cols-1 gap-7 md:grid-cols-2">
          <section>
            <h3 className="mb-4 text-sm font-medium text-ink-muted">Personal details</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <DetailField label="Full name" value={member.name} />
              <DetailField label="Phone" value={member.phone} />
              <DetailField label="Email" value={member.email} />
              <DetailField label="Gender" value={member.gender} />
              <DetailField label="Date of birth" value={formatDate(member.dateOfBirth)} />
              <DetailField label="Trainer" value={member.trainer?.fullName || "Unassigned"} />
              <DetailField label="Notes" value={member.notes} />
            </dl>
          </section>
          <section className="border-t border-line pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <h3 className="mb-4 text-sm font-medium text-ink-muted">Membership</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <DetailField label="Plan" value={member.plan} />
              <DetailField label="Start date" value={formatDate(member.startDate)} />
              <DetailField label="Expiry date" value={formatDate(member.expiryDate)} />
              <DetailField
                label="Days remaining"
                value={daysRemaining == null ? "Unavailable" : daysRemaining < 0 ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days`}
              />
            </dl>
          </section>
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden p-4 md:p-6">
        <Tabs
          items={[{ id: "payments", label: "Payments" }, { id: "attendance", label: "Attendance" }]}
          value={activeTab}
          onChange={setActiveTab}
          idPrefix="member-history"
          label="Member history"
        />

        {activeTab === "payments" ? (
          <section id="member-history-payments-panel" role="tabpanel" aria-labelledby="member-history-payments-tab" className="pt-5">
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-canvas p-4"><p className="text-xs text-ink-muted">Total paid</p><p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(paymentSummary.totalPaid)}</p></div>
              <div className="rounded-lg bg-canvas p-4"><p className="text-xs text-ink-muted">Current dues</p><p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(paymentSummary.currentDues)}</p></div>
            </div>
            {payments.length ? <Table columns={paymentColumns} rows={payments} getRowKey={(payment) => payment.id} className="min-w-[620px]" /> : (
              <EmptyState icon={<CreditCard size={24} strokeWidth={1.7} />} title="No payment history" description="Payments recorded for this member will appear here." />
            )}
          </section>
        ) : (
          <section id="member-history-attendance-panel" role="tabpanel" aria-labelledby="member-history-attendance-tab" className="pt-5">
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-canvas p-4"><p className="text-xs text-ink-muted">Visits this month</p><p className="mt-1 text-lg font-semibold text-ink">{attendanceMonthVisits.toLocaleString("en-PK")}</p></div>
              <div className="rounded-lg bg-canvas p-4"><p className="text-xs text-ink-muted">Last visit</p><p className="mt-1 text-lg font-semibold text-ink">{lastVisit ? formatDate(lastVisit.date) : "—"}</p></div>
            </div>
            {attendance.length ? (
              <>
                <Table columns={attendanceColumns} rows={visibleVisits} getRowKey={(record) => record.id} className="min-w-[560px]" />
                {attendance.length < attendanceTotal && <div className="mt-4 flex justify-center"><Button variant="secondary" onClick={loadMoreAttendance}>Load more</Button></div>}
              </>
            ) : <EmptyState icon={<CalendarCheck2 size={24} strokeWidth={1.7} />} title="No attendance history" description="Check-ins recorded for this member will appear here." />}
          </section>
        )}
      </Card>

      <RecordPaymentModal
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        initialMemberId={member.id}
        onSaved={handlePaymentSaved}
      />
      <PaymentReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
