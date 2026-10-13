import { mockMembers, mockPayments, mockPlans } from "./mockData";
import { derivePaymentStatus } from "./paymentHelpers";
import { getMemberApi, listMembersApi } from "./membersService";

export { derivePaymentStatus };
export const paymentMethods = ["Cash", "Bank Transfer", "Easypaisa", "JazzCash"];
const methodToApi = { Cash: "cash", "Bank Transfer": "bank_transfer", Easypaisa: "easypaisa", JazzCash: "jazzcash" };
const methodFromApi = Object.fromEntries(Object.entries(methodToApi).map(([label, value]) => [value, label]));

async function requestPayments(path, options) {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  let result;
  try { result = await response.json(); } catch { throw new Error("The server returned an unreadable response. Please try again."); }
  if (!response.ok || !result.success) {
    const error = new Error(result.error?.message || "Could not access payments. Please try again.");
    error.status = response.status;
    error.fields = { ...(result.error?.fields || {}) };
    if (error.fields.paymentDate) { error.fields.date = error.fields.paymentDate; delete error.fields.paymentDate; }
    throw error;
  }
  return result.data;
}

function mapPayment(record) {
  return {
    id: String(record._id), receiptNumber: record.receiptNumber, memberId: String(record.memberId), planId: String(record.planId),
    memberName: record.member?.fullName || "Member unavailable", planName: record.plan?.name || "Plan unavailable",
    amountDue: record.amountDue, amountPaid: record.amountPaid, method: methodFromApi[record.method] || record.method,
    date: record.paymentDate || record.date, notes: record.notes || "",
    status: derivePaymentStatus(record.amountPaid, record.amountDue),
    remainingBalance: Math.max(0, Number(record.amountDue) - Number(record.amountPaid)),
  };
}

export function getInitialPayments() {
  return mockPayments.map((payment) => {
    const member = mockMembers.find((item) => item.id === payment.memberId);
    const plan = mockPlans.find((item) => item.id === payment.planId);
    return mapPayment({ ...payment, _id: payment.id, paymentDate: payment.date, member: member ? { fullName: member.name } : null, plan });
  });
}

export async function getPayments({ search = "", status = "All", method = "All", month = "", memberId = "", page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set("search", search.trim());
  if (status !== "All") params.set("status", status.toLowerCase());
  if (method !== "All") params.set("method", methodToApi[method] || method.toLowerCase());
  if (month) params.set("month", month);
  if (memberId) params.set("memberId", memberId);
  const result = await requestPayments(`/api/payments?${params}`);
  const items = result.items.map(mapPayment);
  Object.defineProperties(items, {
    total: { value: result.total, enumerable: false },
    page: { value: result.page, enumerable: false },
    limit: { value: result.limit, enumerable: false },
  });
  return items;
}

export async function getPaymentsByMember(memberId) {
  const firstPage = await getPayments({ memberId, limit: 50 });
  if (firstPage.total <= firstPage.length) return firstPage;
  const pages = await Promise.all(Array.from({ length: Math.ceil(firstPage.total / 50) - 1 }, (_, index) => getPayments({ memberId, page: index + 2, limit: 50 })));
  return [...firstPage, ...pages.flat()];
}

export async function getPaymentSummaryByMember(memberId) {
  const payments = await getPaymentsByMember(memberId);
  return {
    totalPaid: payments.reduce((total, payment) => total + Number(payment.amountPaid), 0),
    currentDues: payments.reduce((total, payment) => total + payment.remainingBalance, 0),
  };
}

export function getInitialPaymentMembers() { return []; }
export async function getPaymentMembers(search = "", selectedId = "") {
  const result = await listMembersApi({ search, status: "all", page: 1, limit: 50 });
  const items = result.items;
  if (selectedId && !items.some((member) => member.id === selectedId)) {
    try { items.push(await getMemberApi(selectedId)); } catch { /* The server will return a field error if the member is no longer available. */ }
  }
  return items.filter((member) => member.planSummary).map((member) => ({ ...member, planName: member.planSummary.name, amountDue: Number(member.planSummary.price) }));
}

export async function getInitialPaymentSummary() { return getPaymentSummary(); }
export async function getPaymentSummary() {
  const result = await requestPayments("/api/payments/summary");
  return { collected: result.collectedThisMonth, pendingDues: result.pendingDues, paymentCount: result.paymentsThisMonth };
}
export async function getMembersWithDues() { return requestPayments("/api/payments/dues"); }
export async function getPaymentById(id) { return mapPayment(await requestPayments(`/api/payments/${encodeURIComponent(id)}`)); }

export async function savePayment(values) {
  const record = await requestPayments("/api/payments", {
    method: "POST",
    body: JSON.stringify({ memberId: values.memberId, amountPaid: Number(values.amountPaid), method: methodToApi[values.method] || values.method, paymentDate: values.date, notes: values.notes || "" }),
  });
  return mapPayment(record);
}
