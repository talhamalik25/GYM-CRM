import { getMembers, getMembershipExpiryDate, getMembershipStatus } from "./membersService";
import { mockAttendance, mockMembers, mockPlans } from "./mockData";
import { getPlans } from "./plansService";

const storageKey = "gym-crm-attendance-v1";

function todayString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readStoredAttendance() {
  if (typeof window === "undefined") return mockAttendance;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return mockAttendance;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : mockAttendance;
  } catch {
    return mockAttendance;
  }
}

function writeAttendance(records) {
  if (typeof window === "undefined") throw new Error("Attendance can only be saved in the browser.");
  window.localStorage.setItem(storageKey, JSON.stringify(records));
}

function makeMembers(members, plans, today = todayString()) {
  return members.map((member) => {
    const plan = plans.find((item) => item.id === member.planId);
    const expiryDate = plan ? getMembershipExpiryDate(member.startDate, plan.durationDays) : "";
    return {
      id: member.id,
      name: member.name,
      phone: member.phone,
      planId: member.planId,
      planName: plan?.name || "Plan unavailable",
      expiryDate,
      status: getMembershipStatus(expiryDate, today),
    };
  });
}

function enrichRecords(records, members = getMembers(), plans = getPlans()) {
  return records.map((record) => {
    const member = members.find((item) => item.id === record.memberId);
    const plan = plans.find((item) => item.id === record.planId) || plans.find((item) => item.id === member?.planId);
    return {
      ...record,
      planId: record.planId || member?.planId || "",
      memberName: member?.name || "Member unavailable",
      planName: plan?.name || "Plan unavailable",
      durationMinutes: getDurationMinutes(record.checkInAt, record.checkOutAt),
    };
  });
}

export function getDurationMinutes(checkInAt, checkOutAt) {
  if (!checkInAt || !checkOutAt) return null;
  return Math.max(0, Math.floor((new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 60000));
}

export function formatDuration(minutes) {
  if (minutes == null || !Number.isFinite(Number(minutes))) return "—";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${remainder}m`;
}

export function getAttendance() {
  return enrichRecords(readStoredAttendance());
}

export function getAttendanceByMember(memberId) {
  return getAttendance()
    .filter((record) => record.memberId === memberId)
    .sort((first, second) => `${second.date}T${second.checkInAt}`.localeCompare(`${first.date}T${first.checkInAt}`));
}

export function getInitialAttendance() {
  return enrichRecords(mockAttendance, mockMembers, mockPlans);
}

export function getAttendanceMembers() {
  return makeMembers(getMembers(), getPlans());
}

export function getInitialAttendanceMembers() {
  return makeMembers(mockMembers, mockPlans);
}

export function checkInMember(memberId, date = todayString(), now = new Date()) {
  const records = readStoredAttendance();
  if (records.some((record) => record.memberId === memberId && record.date === date)) {
    throw new Error("This member already has an attendance record for today.");
  }
  const member = getAttendanceMembers().find((item) => item.id === memberId);
  if (!member) throw new Error("Choose a member before checking in.");
  const checkInAt = `${date}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const record = {
    id: typeof window.crypto?.randomUUID === "function" ? `att-${window.crypto.randomUUID()}` : `att-${Date.now()}`,
    memberId,
    planId: member.planId,
    date,
    checkInAt,
    checkOutAt: null,
  };
  writeAttendance([record, ...records]);
  return enrichRecords([record])[0];
}

export function checkOutMember(recordId, now = new Date()) {
  const records = readStoredAttendance();
  const record = records.find((item) => item.id === recordId);
  if (!record || record.checkOutAt) throw new Error("Only a member currently checked in can check out.");
  if (new Date(now).getTime() < new Date(record.checkInAt).getTime()) {
    throw new Error("Check-out time must be after check-in time.");
  }
  const checkOutAt = `${record.date}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const updated = records.map((item) => item.id === recordId ? { ...item, checkOutAt } : item);
  writeAttendance(updated);
  return enrichRecords(updated.filter((item) => item.id === recordId))[0];
}

export function getAttendanceSummary(records = getAttendance(), date = todayString()) {
  const todayRecords = records.filter((record) => record.date === date);
  const today = new Date(`${date}T00:00:00`);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const weekStartValue = todayString(weekStart);
  const weekCount = records.filter((record) => record.date >= weekStartValue && record.date <= date).length;
  return {
    checkedInToday: todayRecords.length,
    currentlyInside: todayRecords.filter((record) => !record.checkOutAt).length,
    averageThisWeek: Math.round((weekCount / 7) * 10) / 10,
  };
}

export function getAttendanceForDate(records, date) {
  return records.filter((record) => record.date === date);
}
