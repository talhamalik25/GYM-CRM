import { mockMembers } from "./mockData";
import { getActivePlans, getPlans } from "./plansService";
import { mockPlans } from "./mockData";

const storageKey = "gym-crm-members-v1";
export const EXPIRING_DAYS = 7;

export function getMemberPlans() {
  return getActivePlans();
}

export function getInitialMemberPlans() {
  return mockPlans.filter((plan) => plan.status === "Active");
}

export function getInitialMembers() {
  return enrichMembers(mockMembers);
}

function readStoredMembers() {
  if (typeof window === "undefined") return mockMembers;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return mockMembers;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : mockMembers;
  } catch {
    return mockMembers;
  }
}

export function getMembers() {
  return enrichMembers(readStoredMembers());
}

export function getMemberById(id) {
  return getMembers().find((member) => member.id === id) || null;
}

export function getMembershipExpiryDate(startDate, durationDays) {
  if (!startDate || !durationDays) return "";
  const [year, month, day] = startDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  const expiry = new Date(Date.UTC(year, month - 1, day) + Number(durationDays) * 86400000);
  return [expiry.getUTCFullYear(), String(expiry.getUTCMonth() + 1).padStart(2, "0"), String(expiry.getUTCDate()).padStart(2, "0")].join("-");
}

export function getMembershipDaysRemaining(expiryDate, today = new Date().toISOString().slice(0, 10)) {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate + "T00:00:00Z").getTime();
  const current = new Date(today + "T00:00:00Z").getTime();
  return Math.ceil((expiry - current) / 86400000);
}

export function getMembershipStatus(expiryDate, today = new Date().toISOString().slice(0, 10)) {
  const daysRemaining = getMembershipDaysRemaining(expiryDate, today);
  if (daysRemaining === null) return "Expired";
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining <= EXPIRING_DAYS) return "Expiring";
  return "Active";
}

function enrichMembers(members) {
  return members.map((member) => {
    const plan = getPlans().find((item) => item.id === member.planId);
    const expiryDate = getMembershipExpiryDate(member.startDate, plan?.durationDays);
    return {
      ...member,
      plan: plan?.name || "Plan unavailable",
      durationDays: plan?.durationDays || 0,
      expiryDate,
      status: getMembershipStatus(expiryDate),
    };
  });
}

export function saveMember(values, id = null) {
  if (typeof window === "undefined") throw new Error("Members can only be saved in the browser.");
  const members = readStoredMembers();
  const memberId = id || (window.crypto?.randomUUID ? "m-" + window.crypto.randomUUID() : "m-" + Date.now());
  const savedMember = {
    id: memberId,
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    planId: values.planId,
    startDate: values.startDate,
    notes: values.notes.trim(),
  };
  const existingIndex = members.findIndex((member) => member.id === memberId);
  const updatedMembers = existingIndex === -1
    ? [savedMember, ...members]
    : members.map((member, index) => index === existingIndex ? savedMember : member);
  window.localStorage.setItem(storageKey, JSON.stringify(updatedMembers));
  return enrichMembers([savedMember])[0];
}

// The Members screens use these async API functions. The synchronous mock
// functions above remain available to Payments and Attendance for now.
function mapApiMember(member) {
  const expiryDate = member.expiryDate || "";
  return {
    id: String(member._id),
    name: member.fullName,
    phone: member.phone,
    email: member.email || "",
    gender: member.gender,
    dateOfBirth: member.dateOfBirth || "",
    planId: String(member.planId),
    plan: member.plan?.name || "Plan unavailable",
    planSummary: member.plan || null,
    trainerId: member.trainerId ? String(member.trainerId) : null,
    trainer: member.trainer || null,
    startDate: member.startDate,
    expiryDate,
    notes: member.notes || "",
    status: getMembershipStatus(expiryDate),
  };
}

async function requestMembers(path, options) {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response. Please try again.");
  }
  if (!response.ok || !result.success) {
    const fields = { ...(result.error?.fields || {}) };
    if (fields.fullName) {
      fields.name = fields.fullName;
      delete fields.fullName;
    }
    const error = new Error(result.error?.message || "Could not save member details. Please try again.");
    error.status = response.status;
    error.fields = fields;
    throw error;
  }
  return result.data;
}

export async function listMembersApi({ search = "", status = "all", planId = "", page = 1, limit = 8 } = {}) {
  const params = new URLSearchParams({ search, status, page: String(page), limit: String(limit) });
  if (planId) params.set("planId", planId);
  const result = await requestMembers(`/api/members?${params.toString()}`);
  return { ...result, items: result.items.map(mapApiMember) };
}

export async function getMemberApi(id) {
  return mapApiMember(await requestMembers(`/api/members/${encodeURIComponent(id)}`));
}

export async function saveMemberApi(values, id = null) {
  const body = {
    fullName: values.name,
    phone: values.phone,
    email: values.email || "",
    gender: values.gender,
    dateOfBirth: values.dateOfBirth || "",
    planId: values.planId,
    trainerId: values.trainerId || null,
    startDate: values.startDate,
    notes: values.notes || "",
  };
  const member = await requestMembers(id ? `/api/members/${encodeURIComponent(id)}` : "/api/members", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(body),
  });
  return mapApiMember(member);
}
