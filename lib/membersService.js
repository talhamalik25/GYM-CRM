import { deriveMembershipStatus, membershipDaysRemaining, membershipExpiryDate, gymToday } from "./subscriptionRules.js";

export const EXPIRING_DAYS = 7;

export function getMembershipExpiryDate(startDate, durationDays) {
  return membershipExpiryDate(startDate, Number(durationDays));
}

export function getMembershipDaysRemaining(expiryDate, today = gymToday()) {
  return membershipDaysRemaining(expiryDate, today);
}

export function getMembershipStatus(expiryDate, today = gymToday(), startDate = "") {
  return deriveMembershipStatus(expiryDate, today, EXPIRING_DAYS, startDate);
}

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
    today: member.today,
    notes: member.notes || "",
    isActive: member.isActive !== false,
    status: member.status || getMembershipStatus(expiryDate, member.today, member.startDate),
    daysRemaining: member.daysRemaining ?? getMembershipDaysRemaining(expiryDate, member.today),
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

export async function listMembersApi({ search = "", status = "all", accountStatus = "all", planId = "", page = 1, limit = 8 } = {}) {
  const params = new URLSearchParams({ search, status, accountStatus, page: String(page), limit: String(limit) });
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

export async function setMemberActiveApi(id, isActive) {
  return mapApiMember(await requestMembers(`/api/members/${encodeURIComponent(id)}`, {
    method: "PATCH", body: JSON.stringify({ isActive }),
  }));
}
