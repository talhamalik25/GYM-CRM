export async function readAdminBillingResponse(response, { expectPlanCatalog = false } = {}) {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }
  if (!response.ok || !result?.success) {
    const error = new Error(result?.error?.message || "Could not access platform billing.");
    error.fields = result?.error?.fields || {};
    throw error;
  }
  if (expectPlanCatalog && !Array.isArray(result.data?.plans)) {
    throw new Error("The billing response did not include the SaaS plan catalog.");
  }
  return result.data;
}

export function getAssignableSaaSPlans(plans) {
  if (!Array.isArray(plans)) return [];
  return plans.filter((plan) => plan?.isActive === true
    && typeof plan.id === "string" && plan.id.trim().length > 0
    && typeof plan.name === "string" && plan.name.trim().length > 0
    && Number.isSafeInteger(plan.price) && plan.price >= 0
    && ["monthly", "yearly"].includes(plan.interval));
}

export function formatSaaSPlanOption(plan) {
  const interval = plan.interval === "monthly" ? "month" : "year";
  return `${plan.name} · PKR ${plan.price.toLocaleString("en-PK")} / ${interval}`;
}
