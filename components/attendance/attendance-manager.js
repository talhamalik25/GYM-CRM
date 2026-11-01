"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck2, Clock3, LogIn, LogOut, Search, UsersRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import DataTable from "../ui/data-table";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import SearchBar from "../ui/search-bar";
import StatCard from "../ui/stat-card";
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
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const today = summary.date;
  const todayRecords = records;

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
    }).catch((error) => { if (!cancelled) setLoadError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshVersion]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch.trim()) return undefined;
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
    <div className="grid min-w-0 gap-6">
      <PageHeader title="Attendance" description="Check members in quickly and review their attendance history." eyebrow={formatDate(today)} />

      <Card className="border-indigo-200 p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><LogIn size={19} strokeWidth={1.75} aria-hidden="true" /></span>
          <div><h2 className="font-semibold text-ink">Member check-in</h2><p className="mt-1 text-sm text-ink-subtle">Search by name or phone number to check a member in.</p></div>
        </div>
        <SearchBar
          id="attendance-member-search"
          label="Find a member"
          placeholder="Type a member name or phone number"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setConfirmMemberId(null); setActionError(""); }}
          onClear={() => { setSearch(""); setConfirmMemberId(null); setActionError(""); }}
          autoComplete="off"
        />
        {actionError && <ErrorState className="mt-4" title="Check-in action needs attention" description={actionError} />}
        {loadError && <ErrorState className="mt-4" title="Could not load attendance" description={loadError} onRetry={refreshRecords} loading={loading} />}
        {search.trim() && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            {members.length ? members.map((member) => {
              const checkedRecord = todayRecords.find((record) => record.memberId === member.id);
              const confirming = confirmMemberId === member.id;
              return (
                <div key={member.id} className="flex flex-col gap-4 border-b border-line bg-surface p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="m-0 break-words font-semibold text-ink">{member.name}</p><Badge tone={membershipTone(member.status)}>{member.status}</Badge></div>
                    <p className="mt-1 break-words text-sm text-ink-subtle">{member.planName} <span aria-hidden="true">·</span> {member.phone}</p>
                    {member.status === "Expired" && <p className="mt-2 text-sm font-medium leading-6 text-warning">Membership expired {member.expiryDate ? `on ${formatDate(member.expiryDate)}` : ""}. Front desk approval is required to continue.</p>}
                    {confirming && member.status === "Expired" && <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm leading-6 text-warning"><AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span>Confirm that you want to check in this member with an expired membership.</span></div>}
                  </div>
                  {checkedRecord ? (
                      <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">Checked in at {formatTime(checkedRecord.checkInAt, summary.timeZone)}</Button>
                  ) : confirming ? (
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <Button type="button" variant="secondary" onClick={() => setConfirmMemberId(null)}>Cancel</Button>
                      <Button type="button" onClick={() => handleCheckIn(member)}>Confirm check-in</Button>
                    </div>
                  ) : (
                    <Button type="button" className="w-full sm:w-auto" onClick={() => handleCheckIn(member)}><LogIn size={16} aria-hidden="true" />Check in</Button>
                  )}
                </div>
              );
            }) : <div className="p-4"><EmptyState icon={<Search size={22} />} title="No members found" description="Try another name or phone number." /></div>}
          </div>
        )}
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard loading={loading} label="Checked in today" value={summary.checkedInToday.toLocaleString("en-PK")} icon={<UsersRound size={18} strokeWidth={1.75} />} />
        <StatCard loading={loading} label="Currently inside" value={summary.currentlyInside.toLocaleString("en-PK")} icon={<Clock3 size={18} strokeWidth={1.75} />} />
        <StatCard loading={loading} label="Average check-ins this week" value={summary.averageThisWeek.toLocaleString("en-PK", { maximumFractionDigits: 1 })} icon={<CalendarCheck2 size={18} strokeWidth={1.75} />} />
      </div>

      <Card className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="font-semibold text-ink">Today&apos;s attendance</h2><p className="mt-1 text-sm text-ink-subtle">Members checked in for {formatDate(today)}.</p></div><span className="w-fit rounded-full bg-canvas px-3 py-1.5 text-xs tabular-nums text-ink-muted">{todayRecords.length.toLocaleString("en-PK")} {todayRecords.length === 1 ? "check-in" : "check-ins"}</span></div>
        {loading ? <DataTable caption="Today's attendance" columns={todayColumns} rows={[]} loading /> : todayRecords.length ? <DataTable caption="Today's attendance" columns={todayColumns} rows={todayRecords} getRowKey={(record) => record.id} className="min-w-[780px]" /> : (
          <EmptyState icon={<CalendarCheck2 size={25} strokeWidth={1.7} />} title="Nobody checked in yet" description="Search for a member above to record the first check-in today." />
        )}
      </Card>

      <Card className="min-w-0 overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-5 sm:px-6 sm:py-5">
          <div><h2>Attendance history</h2><p>Review check-ins for a selected day.</p></div>
          <div className="grid min-w-0 grid-cols-1 items-end gap-3 md:grid-cols-3">
            <Input id="attendance-history-date" label={historyTo ? "From" : "Date / from"} type="date" value={historyFrom || (historyTo ? "" : today)} onChange={(event) => { setHistoryFrom(event.target.value); setHistoryPage(1); }} />
            <Input id="attendance-history-to" label="To (optional)" type="date" value={historyTo} onChange={(event) => { setHistoryTo(event.target.value); setHistoryPage(1); }} />
            <SearchBar id="attendance-history-search" label="Search member" placeholder="Name" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} onClear={() => setHistorySearch("")} />
          </div>
        </div>
        {loading && historyRecords.length === 0 ? <DataTable caption="Attendance history" columns={historyColumns} rows={[]} loading /> : historyRecords.length ? <DataTable caption="Attendance history" columns={historyColumns} rows={historyRecords} getRowKey={(record) => record.id} className="min-w-[780px]" /> : (
          <EmptyState icon={<Search size={25} strokeWidth={1.7} />} title={historySearch ? "No matching history" : "No attendance for this date"} description={historySearch ? "Try another member name." : "Choose another date to review attendance."} />
        )}
        {historyRecords.length < historyTotal && <div className="flex justify-center p-5"><Button variant="secondary" onClick={() => setHistoryPage((page) => page + 1)}>Load more</Button></div>}
      </Card>
    </div>
  );
}
