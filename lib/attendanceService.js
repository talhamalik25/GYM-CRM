import { getDurationMinutes } from "./attendanceHelpers";
import { listMembersApi } from "./membersService";
import { getMembershipStatus } from "./membersService";

export { getDurationMinutes };

async function requestAttendance(path, options) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response. Please try again."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not access attendance. Please try again.");
    error.status = response.status;
    error.code = result.error?.code;
    error.fields = result.error?.fields || {};
    throw error;
  }
  return result.data;
}

function mapAttendance(record) {
  return {
    id: String(record._id),
    memberId: String(record.memberId),
    planId: record.plan?.id || "",
    memberName: record.member?.fullName || "Member unavailable",
    planName: record.plan?.name || "Plan unavailable",
    date: record.date,
    checkInAt: record.checkInAt,
    checkOutAt: record.checkOutAt || null,
    overrideExpired: Boolean(record.overrideExpired),
    durationMinutes: record.durationMinutes ?? getDurationMinutes(record.checkInAt, record.checkOutAt),
  };
}

function withPageInfo(items, result) {
  Object.defineProperties(items, {
    total: { value: result.total, enumerable: false },
    page: { value: result.page, enumerable: false },
    limit: { value: result.limit, enumerable: false },
  });
  return items;
}

export function formatDuration(minutes) {
  if (minutes == null || !Number.isFinite(Number(minutes))) return "—";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${remainder}m`;
}

export async function getAttendance({ date = "", from = "", to = "", memberId = "", search = "", page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (date) params.set("date", date);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (memberId) params.set("memberId", memberId);
  if (search.trim()) params.set("search", search.trim());
  const result = await requestAttendance(`/api/attendance?${params}`);
  return withPageInfo(result.items.map(mapAttendance), result);
}

export async function getAttendanceByMember(memberId, page = 1, limit = 20) {
  return getAttendance({ memberId, page, limit });
}

export function getInitialAttendance() { return []; }

export async function getAttendanceMembers(search = "") {
  const [members, summary] = await Promise.all([
    listMembersApi({ search, status: "all", page: 1, limit: 50 }),
    getAttendanceSummary(),
  ]);
  return members.items.map((member) => ({
    id: member.id,
    name: member.name,
    phone: member.phone,
    planId: member.planId,
    planName: member.planSummary?.name || "Plan unavailable",
    expiryDate: member.expiryDate,
    status: getMembershipStatus(member.expiryDate, summary.date),
  }));
}

export function getInitialAttendanceMembers() { return []; }

export async function checkInMember(memberId, options = {}) {
  const record = await requestAttendance("/api/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ memberId, ...(options.confirmExpired ? { confirmExpired: true } : {}) }),
  });
  return mapAttendance(record);
}

export async function checkOutMember(recordId) {
  const record = await requestAttendance(`/api/attendance/${encodeURIComponent(recordId)}/check-out`, { method: "POST" });
  return mapAttendance(record);
}

export async function getAttendanceSummary() {
  const result = await requestAttendance("/api/attendance/summary");
  return {
    date: result.date,
    checkedInToday: result.checkedInToday,
    currentlyInside: result.currentlyInside,
    averageThisWeek: result.averageCheckInsThisWeek,
  };
}

export function getAttendanceForDate(records, date) {
  return records.filter((record) => record.date === date);
}
