async function request(path, options) {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const result = await response.json();
  if (!response.ok || !result.success) { const error = new Error(result.error?.message || "Could not load memberships."); error.fields = result.error?.fields || {}; throw error; }
  return result.data;
}
export async function listSubscriptions({ search = "", page = 1, limit = 50 } = {}) { return request(`/api/subscriptions?${new URLSearchParams({ search, page: String(page), limit: String(limit) })}`); }
export async function getSubscription(id) { return request(`/api/subscriptions/${encodeURIComponent(id)}`); }
export async function createSubscription(values, key) { return request("/api/subscriptions", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(values) }); }
export async function renewSubscription(id, values, key) { return request(`/api/subscriptions/${encodeURIComponent(id)}/renew`, { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(values) }); }
export async function cancelSubscription(id) { return request(`/api/subscriptions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) }); }
export async function getMemberSubscriptions(memberId) { return request(`/api/members/${encodeURIComponent(memberId)}/subscriptions`); }
