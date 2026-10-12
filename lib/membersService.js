import { mockMembers } from "./mockData";
import { getActivePlans, getPlans } from "./plansService";
import { mockPlans } from "./mockData";

const storageKey = "gym-crm-members-v1";

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
  if (daysRemaining <= 7) return "Expiring";
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
