function mapApiPlan(plan) {
  return {
    id: String(plan._id),
    name: plan.name,
    price: plan.price,
    durationDays: plan.durationDays,
    description: plan.description || "",
    status: plan.isActive ? "Active" : "Inactive",
    ...(Number.isInteger(plan.memberCount) ? { memberCount: plan.memberCount } : {}),
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

export async function listPlans({ activeOnly = false, includeMemberCounts = false } = {}) {
  const params = new URLSearchParams();
  if (activeOnly) params.set("isActive", "true");
  if (includeMemberCounts) params.set("includeMemberCounts", "true");
  const query = params.toString();
  const data = await requestPlans(`/api/plans${query ? `?${query}` : ""}`);
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
