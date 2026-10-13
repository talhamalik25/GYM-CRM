"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck2, Clock3, LogIn, LogOut, Search, UsersRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Table from "../ui/table";
import {
  checkInMember,
  checkOutMember,
  formatDuration,
  getAttendance,
  getAttendanceMembers,
  getAttendanceSummary,
  getInitialAttendance,
  getInitialAttendanceMembers,
} from "../../lib/attendanceService";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function formatTime(value, timeZone = "Asia/Karachi") {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function membershipTone(status) {
  if (status === "Active") return "success";
  if (status === "Expiring") return "warning";
  return "neutral";
}

function StatCard({ label, value, icon: Icon, highlight = false }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{label}</p>
        <Icon size={17} className={highlight ? "text-brand" : "text-ink-muted"} aria-hidden="true" />
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${highlight ? "text-brand" : "text-ink"}`}>{value}</p>
    </Card>
  );
}

export default function AttendanceManager() {
  const [records, setRecords] = useState(getInitialAttendance);
  const [members, setMembers] = useState(getInitialAttendanceMembers);
  const [summary, setSummary] = useState({ date: "", checkedInToday: 0, currentlyInside: 0, averageThisWeek: 0 });
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");
  const [confirmMemberId, setConfirmMemberId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const today = summary.date;

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) document.getElementById("attendance-member-search")?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAttendance({ limit: 50 }), getAttendanceSummary()]).then(([todayList, nextSummary]) => {
      if (cancelled) return;
      setRecords(todayList);
      setSummary(nextSummary);
      setLoadError("");
    }).catch((error) => { if (!cancelled) setLoadError(error.message); });
    return () => { cancelled = true; };
  }, [refreshVersion]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch.trim()) { setMembers([]); return undefined; }
    let cancelled = false;
    getAttendanceMembers(debouncedSearch).then((result) => { if (!cancelled) setMembers(result); })
      .catch((error) => { if (!cancelled) setActionError(error.message); });
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedHistorySearch(historySearch);
      setHistoryPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [historySearch, historyFrom, historyTo]);

  useEffect(() => {
    let cancelled = false;
    const query = {
      date: historyTo ? "" : historyFrom || today,
      from: historyTo ? historyFrom : "",
      to: historyTo,
      search: debouncedHistorySearch,
      page: historyPage,
      limit: 20,
    };
    if (historyTo && !historyFrom) return undefined;
    getAttendance(query).then((result) => {
      if (cancelled) return;
      setHistoryRecords((current) => historyPage === 1 ? result : [...current, ...result]);
      setHistoryTotal(result.total);
      setLoadError("");
    }).catch((error) => { if (!cancelled) setLoadError(error.message); });
    return () => { cancelled = true; };
  }, [historyFrom, historyTo, debouncedHistorySearch, historyPage, today, refreshVersion]);

  function refreshRecords() { setRefreshVersion((version) => version + 1); }

  async function handleCheckIn(member) {
    if (member.status === "Expired" && confirmMemberId !== member.id) {
      setConfirmMemberId(member.id);
      setActionError("");
      return;
    }
    try {
      await checkInMember(member.id, { confirmExpired: member.status === "Expired" && confirmMemberId === member.id });
      refreshRecords();
      setConfirmMemberId(null);
      setActionError("");
    } catch (error) {
      if (error.code === "MEMBERSHIP_EXPIRED") setConfirmMemberId(member.id);
      setActionError(error.message);
      refreshRecords();
    }
  }

  async function handleCheckOut(record) {
    try {
      await checkOutMember(record.id);
      refreshRecords();
      setActionError("");
    } catch (error) {
      setActionError(error.message);
    }
  }

  const todayColumns = [
    { key: "memberName", label: "Member", render: (record) => <span className="font-medium text-ink">{record.memberName}</span> },
    { key: "planName", label: "Plan" },
    { key: "checkInAt", label: "Check-in", render: (record) => formatTime(record.checkInAt, summary.timeZone) },
    { key: "checkOutAt", label: "Check-out", render: (record) => formatTime(record.checkOutAt, summary.timeZone) },
    { key: "duration", label: "Duration", render: (record) => record.checkOutAt ? formatDuration(record.durationMinutes) : <span className="text-ink-muted">In progress</span> },
    { key: "action", label: "Action", render: (record) => record.checkOutAt ? <span className="text-ink-muted">Complete</span> : <Button type="button" variant="secondary" size="sm" onClick={() => handleCheckOut(record)}><LogOut size={14} aria-hidden="true" />Check out</Button> },
  ];

  const historyColumns = [
    { key: "date", label: "Date", render: (record) => formatDate(record.date) },
    { key: "memberName", label: "Member", render: (record) => <span className="font-medium text-ink">{record.memberName}</span> },
    { key: "planName", label: "Plan" },
    { key: "checkInAt", label: "Check-in", render: (record) => formatTime(record.checkInAt, summary.timeZone) },
    { key: "checkOutAt", label: "Check-out", render: (record) => formatTime(record.checkOutAt, summary.timeZone) },
    { key: "duration", label: "Duration", render: (record) => record.checkOutAt ? formatDuration(record.durationMinutes) : <span className="text-ink-muted">In progress</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Check members in quickly and review their attendance history." eyebrow={formatDate(today)} />

      <Card className="overflow-hidden border-brand/20 p-5 md:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><LogIn size={19} aria-hidden="true" /></span>
          <div><h2 className="text-lg font-semibold text-ink">Member check-in</h2><p className="mt-1 text-sm text-ink-muted">Search by name or phone number to check a member in.</p></div>
        </div>
        <Input
          id="attendance-member-search"
          label="Find a member"
          type="search"
          placeholder="Type a member name or phone number"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setConfirmMemberId(null); setActionError(""); }}
          autoComplete="off"
          className="h-12 text-base"
        />
        {actionError && <p className="mt-3 text-sm text-error" role="alert">{actionError}</p>}
        {loadError && <p className="mt-3 text-sm text-error" role="alert">{loadError}</p>}
        {search.trim() && (
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {members.length ? members.map((member) => {
              const checkedRecord = todayRecords.find((record) => record.memberId === member.id);
              const confirming = confirmMemberId === member.id;
              return (
                <div key={member.id} className="flex flex-col gap-4 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink">{member.name}</p><Badge tone={membershipTone(member.status)}>{member.status}</Badge></div>
                    <p className="mt-1 text-sm text-ink-muted">{member.planName} <span className="px-1 text-line-strong">·</span> {member.phone}</p>
                    {member.status === "Expired" && <p className="mt-2 text-sm font-medium text-warning">Membership expired {member.expiryDate ? `on ${formatDate(member.expiryDate)}` : ""}. Front desk approval is required to continue.</p>}
                    {confirming && member.status === "Expired" && <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning"><AlertTriangle size={17} className="shrink-0" aria-hidden="true" /><span>Confirm that you want to check in this member with an expired membership.</span></div>}
                  </div>
                  {checkedRecord ? (
              <Button type="button" variant="secondary" disabled className="min-h-11 shrink-0">Checked in at {formatTime(checkedRecord.checkInAt, summary.timeZone)}</Button>
                  ) : confirming ? (
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" variant="secondary" className="min-h-11" onClick={() => setConfirmMemberId(null)}>Cancel</Button>
                      <Button type="button" className="min-h-11" onClick={() => handleCheckIn(member)}>Confirm check-in</Button>
                    </div>
                  ) : (
                    <Button type="button" className="min-h-11 shrink-0" onClick={() => handleCheckIn(member)}><LogIn size={16} aria-hidden="true" />Check in</Button>
                  )}
                </div>
              );
            }) : <div className="p-4"><EmptyState icon={<Search size={22} />} title="No members found" description="Try another name or phone number." /></div>}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Checked in today" value={summary.checkedInToday.toLocaleString("en-PK")} icon={UsersRound} highlight />
        <StatCard label="Currently inside" value={summary.currentlyInside.toLocaleString("en-PK")} icon={Clock3} />
        <StatCard label="Average check-ins this week" value={summary.averageThisWeek.toLocaleString("en-PK", { maximumFractionDigits: 1 })} icon={CalendarCheck2} />
      </div>

      <Card className="min-w-0 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-ink">Today&apos;s attendance</h2><span className="text-xs text-ink-muted">{formatDate(today)}</span></div>
        {todayRecords.length ? <Table columns={todayColumns} rows={todayRecords} getRowKey={(record) => record.id} className="min-w-[780px]" /> : (
          <EmptyState icon={<CalendarCheck2 size={25} strokeWidth={1.7} />} title="Nobody checked in yet" description="Search for a member above to record the first check-in today." />
        )}
      </Card>

      <Card className="min-w-0 p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-base font-semibold text-ink">Attendance history</h2><p className="mt-1 text-sm text-ink-muted">Review check-ins for a selected day.</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            <Input id="attendance-history-date" label={historyTo ? "From" : "Date / from"} type="date" value={historyFrom || (historyTo ? "" : today)} onChange={(event) => { setHistoryFrom(event.target.value); setHistoryPage(1); }} />
            <Input id="attendance-history-to" label="To (optional)" type="date" value={historyTo} onChange={(event) => { setHistoryTo(event.target.value); setHistoryPage(1); }} />
            <Input id="attendance-history-search" label="Search member" type="search" placeholder="Name" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} />
          </div>
        </div>
        {historyRecords.length ? <Table columns={historyColumns} rows={historyRecords} getRowKey={(record) => record.id} className="min-w-[700px]" /> : (
          <EmptyState icon={<Search size={25} strokeWidth={1.7} />} title={historySearch ? "No matching history" : "No attendance for this date"} description={historySearch ? "Try another member name." : "Choose another date to review attendance."} />
        )}
        {historyRecords.length < historyTotal && <div className="mt-4 flex justify-center"><Button variant="secondary" onClick={() => setHistoryPage((page) => page + 1)}>Load more</Button></div>}
      </Card>
    </div>
  );
}
