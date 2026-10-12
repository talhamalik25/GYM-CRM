import { getMembers } from "./membersService";
import { mockMembers, mockPayments, mockPlans } from "./mockData";
import { getPlans } from "./plansService";

const storageKey = "gym-crm-payments-v1";
export const paymentMethods = ["Cash", "Bank Transfer", "Easypaisa", "JazzCash"];

function readStoredPayments() {
  if (typeof window === "undefined") return mockPayments;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return mockPayments;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : mockPayments;
  } catch {
    return mockPayments;
  }
}

function writePayments(payments) {
  if (typeof window === "undefined") throw new Error("Payments can only be saved in the browser.");
  window.localStorage.setItem(storageKey, JSON.stringify(payments));
}

export function derivePaymentStatus(amountPaid, amountDue) {
  if (Number(amountPaid) >= Number(amountDue)) return "Paid";
  if (Number(amountPaid) > 0) return "Partial";
  return "Pending";
}

function generateReceiptNumber(payments) {
  const highestNumber = payments.reduce((highest, payment) => {
    const match = /^FIT-(\d+)$/.exec(payment.receiptNumber || "");
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `FIT-${String(highestNumber + 1).padStart(4, "0")}`;
}

function withDetails(payments, members = getMembers(), plans = getPlans()) {
  return payments.map((payment) => {
    const member = members.find((item) => item.id === payment.memberId);
    const plan = plans.find((item) => item.id === payment.planId);
    return {
      ...payment,
      memberName: member?.name || "Member unavailable",
      planName: plan?.name || "Plan unavailable",
      status: derivePaymentStatus(payment.amountPaid, payment.amountDue),
      remainingBalance: Math.max(0, Number(payment.amountDue) - Number(payment.amountPaid)),
    };
  });
}

export function getPayments() {
  return withDetails(readStoredPayments());
}

export function getPaymentsByMember(memberId) {
  return getPayments().filter((payment) => payment.memberId === memberId);
}

export function getPaymentSummaryByMember(memberId) {
  const payments = getPaymentsByMember(memberId);
  return {
    totalPaid: payments.reduce((total, payment) => total + Number(payment.amountPaid), 0),
    currentDues: payments.reduce((total, payment) => total + payment.remainingBalance, 0),
  };
}

export function getInitialPayments() {
  return withDetails(mockPayments, mockMembers, mockPlans);
}

export function getPaymentMembers() {
  const plans = getPlans();
  return getMembers().map((member) => {
    const plan = plans.find((item) => item.id === member.planId);
    return plan ? { ...member, planName: plan.name, amountDue: Number(plan.price) } : null;
  }).filter(Boolean);
}

export function getInitialPaymentMembers() {
  return mockMembers.map((member) => {
    const plan = mockPlans.find((item) => item.id === member.planId);
    return plan ? { ...member, planName: plan.name, amountDue: Number(plan.price) } : null;
  }).filter(Boolean);
}

function summarizePayments(payments, date) {
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = payments.filter((payment) => payment.date.startsWith(month));
  return {
    collected: thisMonth.reduce((total, payment) => total + Number(payment.amountPaid), 0),
    pendingDues: payments.reduce((total, payment) => total + (payment.status === "Paid" ? 0 : payment.remainingBalance), 0),
    paymentCount: thisMonth.length,
  };
}

export function getPaymentSummary(payments = getPayments(), date = new Date()) {
  return summarizePayments(payments, date);
}

export function getInitialPaymentSummary(payments = getInitialPayments(), date = new Date()) {
  return summarizePayments(payments, date);
}

export function getMembersWithDues(payments = getPayments()) {
  const grouped = new Map();
  payments.filter((payment) => payment.status === "Partial" || payment.status === "Pending").forEach((payment) => {
    const current = grouped.get(payment.memberId) || {
      memberId: payment.memberId,
      memberName: payment.memberName,
      balance: 0,
      paymentCount: 0,
    };
    current.balance += payment.remainingBalance;
    current.paymentCount += 1;
    grouped.set(payment.memberId, current);
  });
  return [...grouped.values()].sort((first, second) => second.balance - first.balance);
}

export function savePayment(values) {
  const payments = readStoredPayments();
  const members = getPaymentMembers();
  const member = members.find((item) => item.id === values.memberId);
  if (!member) throw new Error("Choose a member with an assigned plan.");
  const amountPaid = Number(values.amountPaid);
  const amountDue = Number(member.amountDue);
  if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > amountDue) {
    throw new Error("Amount paid must be between zero and the amount due.");
  }
  const payment = {
    id: typeof window.crypto?.randomUUID === "function" ? `pay-${window.crypto.randomUUID()}` : `pay-${Date.now()}`,
    receiptNumber: generateReceiptNumber(payments),
    memberId: member.id,
    planId: member.planId,
    amountDue,
    amountPaid,
    method: values.method,
    date: values.date,
    notes: values.notes.trim(),
  };
  writePayments([payment, ...payments]);
  return withDetails([payment])[0];
}
