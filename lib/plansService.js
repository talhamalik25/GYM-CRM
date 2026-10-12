import { mockMembers, mockPlans } from "./mockData";

const storageKey = "gym-crm-plans-v1";

function readStoredPlans() {
  if (typeof window === "undefined") return mockPlans;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return mockPlans;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : mockPlans;
  } catch {
    return mockPlans;
  }
}

function writePlans(plans) {
  if (typeof window === "undefined") throw new Error("Plans can only be saved in the browser.");
  window.localStorage.setItem(storageKey, JSON.stringify(plans));
}

export function getPlans() {
  return readStoredPlans();
}

export function getInitialPlans() {
  return mockPlans;
}

export function getActivePlans() {
  return getPlans().filter((plan) => plan.status === "Active");
}

export function getPlanMemberCounts() {
  return mockMembers.reduce((counts, member) => {
    counts[member.planId] = (counts[member.planId] || 0) + 1;
    return counts;
  }, {});
}

export function savePlan(values, id = null) {
  const plans = readStoredPlans();
  const planId = id || (typeof window !== "undefined" && window.crypto?.randomUUID
    ? `plan-${window.crypto.randomUUID()}`
    : `plan-${Date.now()}`);
  const savedPlan = {
    id: planId,
    name: values.name.trim(),
    price: Number(values.price),
    durationDays: Number(values.durationDays),
    description: values.description.trim(),
    status: plans.find((plan) => plan.id === planId)?.status || "Active",
  };
  const updated = plans.some((plan) => plan.id === planId)
    ? plans.map((plan) => plan.id === planId ? savedPlan : plan)
    : [...plans, savedPlan];
  writePlans(updated);
  return savedPlan;
}

export function togglePlanStatus(id) {
  const plans = readStoredPlans();
  const updated = plans.map((plan) => plan.id === id
    ? { ...plan, status: plan.status === "Active" ? "Inactive" : "Active" }
    : plan);
  writePlans(updated);
  return updated.find((plan) => plan.id === id) || null;
}

// The Plans screen uses these API methods. Existing synchronous helpers above
// remain mock-backed for Members, Payments, and Attendance in this phase.
function mapApiPlan(plan) {
  return {
    id: String(plan._id),
    name: plan.name,
    price: plan.price,
    durationDays: plan.durationDays,
    description: plan.description || "",
    status: plan.isActive ? "Active" : "Inactive",
  };
}

async function requestPlans(path, options) {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response. Please try again.");
  }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not save plans. Please try again.");
    error.status = response.status;
    error.fields = result.error?.fields || {};
    throw error;
  }
  return result.data;
}

export async function listPlans({ activeOnly = false } = {}) {
  const data = await requestPlans(`/api/plans${activeOnly ? "?isActive=true" : ""}`);
  return data.map(mapApiPlan);
}

export async function createPlan(values) {
  return mapApiPlan(await requestPlans("/api/plans", {
    method: "POST",
    body: JSON.stringify({ name: values.name, price: Number(values.price), durationDays: Number(values.durationDays), description: values.description || "" }),
  }));
}

export async function updatePlan(id, values) {
  return mapApiPlan(await requestPlans(`/api/plans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name: values.name, price: Number(values.price), durationDays: Number(values.durationDays), description: values.description || "" }),
  }));
}

export async function setPlanActive(id, isActive) {
  return mapApiPlan(await requestPlans(`/api/plans/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  }));
}
