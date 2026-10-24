import { FEATURE_LABELS, PLAN_KEYS } from "./saasPlanRules.js";
import { randomUUID } from "node:crypto";

export const SAAS_INTERVALS = Object.freeze(["monthly", "yearly"]);

export function expiredSaaSTrialFilter(now = new Date()) {
  return { "saasSubscription.status": "trialing", $or: [
    { "saasSubscription.trialEndsAt": { $lte: now } },
    { "saasSubscription.trialEndsAt": null },
  ] };
}

export function expiredSaaSPaidPeriodFilter(now = new Date()) {
  return { "saasSubscription.status": "active", $or: [
    { "saasSubscription.periodEnd": { $lte: now } },
    { "saasSubscription.periodEnd": null },
  ] };
}

export function invoiceMatchesPendingSubscription(subscription, invoice) {
  return Boolean(subscription && invoice
    && subscription.pendingInvoiceId && String(subscription.pendingInvoiceId) === String(invoice._id)
    && (invoice.changesPlan || String(subscription.planId) === String(invoice.planId))
    && (invoice.changesPlan || subscription.planSnapshot?.price === invoice.amountDue)
    && (invoice.changesPlan || subscription.planSnapshot?.currency === invoice.currency)
    && (invoice.changesPlan || subscription.planSnapshot?.interval === invoice.planSnapshot?.interval)
    && invoice.planSnapshot?.price === invoice.amountDue
    && invoice.planSnapshot?.currency === invoice.currency
    && Number.isFinite(new Date(invoice.periodStart).getTime())
    && Number.isFinite(new Date(invoice.periodEnd).getTime())
    && new Date(invoice.periodEnd) > new Date(invoice.periodStart));
}

export function validateSaaSPlanBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const allowed = ["key", "features", "name", "description", "price", "interval", "limits", "isActive"];
  const fields = {};
  for (const key of Object.keys(body)) if (!allowed.includes(key)) fields[key] = "This field cannot be changed.";
  const output = {};
  for (const key of ["key", "features", "name", "description", "price", "interval", "limits", "isActive"]) {
    if (!Object.hasOwn(body, key)) continue;
    const value = body[key];
    if (key === "key") {
      if (partial || !PLAN_KEYS.includes(value)) fields.key = "Choose a stable launch plan identifier; existing identifiers cannot change.";
      else output.key = value;
    } else if (key === "features") {
      if (!value || typeof value !== "object" || Array.isArray(value) || Object.entries(value).some(([key, enabled]) => !Object.hasOwn(FEATURE_LABELS, key) || typeof enabled !== "boolean")) fields.features = "Use supported boolean entitlements.";
      else output.features = value;
    } else if (key === "name") {
      const name = typeof value === "string" ? value.trim() : "";
      if (name.length < 2 || name.length > 80) fields.name = "Plan name must be between 2 and 80 characters.";
      else output.name = name;
    } else if (key === "description") {
      if (typeof value !== "string" || value.trim().length > 400) fields.description = "Description must be 400 characters or fewer.";
      else output.description = value.trim();
    } else if (key === "price") {
      if (!Number.isSafeInteger(value) || value < 0) fields.price = "Price must be a non-negative whole number of rupees.";
      else output.price = value;
    } else if (key === "interval") {
      if (!SAAS_INTERVALS.includes(value)) fields.interval = "Choose monthly or yearly billing.";
      else output.interval = value;
    } else if (key === "limits") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        fields.limits = "Limits must be an object.";
      } else {
        const normalized = {};
        for (const key of Object.keys(value)) {
          if (!["members", "trainers", "staff", "branches"].includes(key)) {
            fields[`limits.${key}`] = "This limit cannot be configured.";
          } else if (value[key] !== null && (!Number.isSafeInteger(value[key]) || value[key] < 0)) {
            fields[`limits.${key}`] = "Use a non-negative whole number or leave the limit blank.";
          } else normalized[key] = value[key];
        }
        output.limits = normalized;
      }
    } else if (key === "isActive") {
      if (typeof value !== "boolean") fields.isActive = "Plan availability must be true or false.";
      else output.isActive = value;
    }
  }
  if (!partial) {
    for (const required of ["name", "price", "interval"]) {
      if (!Object.hasOwn(body, required)) fields[required] = "This field is required.";
    }
  } else if (!Object.keys(body).length) {
    fields.body = "Provide at least one field to update.";
  }
  return Object.keys(fields).length ? { message: "Please correct the subscription plan details.", fields } : output;
}

export function validatePlanAssignment(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (!["gymId", "planId", "mode", "trialDays"].includes(key)) fields[key] = "This field cannot be changed.";
  if (typeof body.gymId !== "string" || !/^[a-f\d]{24}$/i.test(body.gymId)) fields.gymId = "Choose a valid Gym.";
  if (typeof body.planId !== "string" || !/^[a-f\d]{24}$/i.test(body.planId)) fields.planId = "Choose a valid plan.";
  if (!["trial", "invoice"].includes(body.mode)) fields.mode = "Choose trial or invoice.";
  if (body.mode === "trial" && (!Number.isSafeInteger(body.trialDays) || body.trialDays < 1 || body.trialDays > 90)) fields.trialDays = "Trial length must be from 1 to 90 days.";
  return Object.keys(fields).length ? { message: "Please correct the Gym subscription details.", fields } : { gymId: body.gymId, planId: body.planId, mode: body.mode, trialDays: body.trialDays };
}

export function validateManualReconciliation(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (!["verifiedAmount", "verifiedReference", "verificationNotes", "paymentIndependentlyVerified"].includes(key)) fields[key] = "This field cannot be changed.";
  const verifiedAmount = body.verifiedAmount;
  const verifiedReference = typeof body.verifiedReference === "string" ? body.verifiedReference.trim() : "";
  const verificationNotes = typeof body.verificationNotes === "string" ? body.verificationNotes.trim() : "";
  if (!Number.isSafeInteger(verifiedAmount) || verifiedAmount <= 0) fields.verifiedAmount = "Enter the externally verified whole-rupee amount.";
  if (!verifiedReference || verifiedReference.length > 200) fields.verifiedReference = "Enter the externally verified payment reference (up to 200 characters).";
  if (verificationNotes.length < 5 || verificationNotes.length > 1000) fields.verificationNotes = "Record verification notes (5–1000 characters).";
  if (body.paymentIndependentlyVerified !== true) fields.paymentIndependentlyVerified = "Confirm payment was independently verified against the receiving account.";
  return Object.keys(fields).length ? { message: "Manual reconciliation requires independent payment verification details.", fields } : { verifiedAmount, verifiedReference, verificationNotes, paymentIndependentlyVerified: true };
}

export function validatePaymentClaim(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (key !== "invoiceId" && key !== "reference") fields[key] = "This field cannot be changed.";
  if (typeof body.invoiceId !== "string" || !/^[a-f\d]{24}$/i.test(body.invoiceId)) fields.invoiceId = "Choose a valid invoice.";
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  if (!reference || reference.length > 200) fields.reference = "Enter the payment reference (up to 200 characters).";
  return Object.keys(fields).length ? { message: "Enter a valid payment claim.", fields } : { invoiceId: body.invoiceId, reference };
}

export function validatePaymentClaimRejection(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (!["invoiceId", "claimId", "reason"].includes(key)) fields[key] = "This field cannot be changed.";
  for (const key of ["invoiceId", "claimId"]) if (typeof body[key] !== "string" || !/^[a-f\d]{24}$/i.test(body[key])) fields[key] = "Choose a valid payment claim.";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length > 300) fields.reason = "Enter a reason for rejecting the payment claim.";
  return Object.keys(fields).length ? { message: "A reason is required to reject this payment claim.", fields } : { invoiceId: body.invoiceId, claimId: body.claimId, reason };
}

export function validateInvoiceVoid(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (key !== "reason") fields[key] = "This field cannot be changed.";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason || reason.length > 300) fields.reason = "Enter a reason (up to 300 characters).";
  return Object.keys(fields).length ? { message: "A reason is required to void an invoice.", fields } : { reason };
}

export function validatePlatformSettings(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (!["defaultTrialDays", "manualBillingInstructions", "paymentInstructions"].includes(key)) fields[key] = "This setting cannot be changed.";
  const output = {};
  if (Object.hasOwn(body, "defaultTrialDays")) {
    if (!Number.isSafeInteger(body.defaultTrialDays) || body.defaultTrialDays < 0 || body.defaultTrialDays > 90) fields.defaultTrialDays = "Default trial must be a whole number from 0 to 90 days.";
    else output.defaultTrialDays = body.defaultTrialDays;
  }
  if (Object.hasOwn(body, "manualBillingInstructions")) {
    if (typeof body.manualBillingInstructions !== "string" || body.manualBillingInstructions.trim().length > 1200) fields.manualBillingInstructions = "Instructions must be 1200 characters or fewer.";
    else output.manualBillingInstructions = body.manualBillingInstructions.trim();
  }
  if (Object.hasOwn(body, "paymentInstructions")) {
    const supported = ["bank_transfer", "jazzcash", "easypaisa"];
    if (!Array.isArray(body.paymentInstructions) || body.paymentInstructions.some((item) => !item || typeof item !== "object" || Array.isArray(item) || !supported.includes(item.type) || typeof item.instructions !== "string" || item.instructions.trim().length > 1200) || new Set(body.paymentInstructions.map((item) => item?.type)).size !== body.paymentInstructions.length) {
      fields.paymentInstructions = "Configure each supported payment type at most once with instructions up to 1200 characters.";
    } else output.paymentInstructions = body.paymentInstructions.map(({ type, instructions }) => ({ type, instructions: instructions.trim() }));
  }
  if (!Object.keys(body).length) fields.body = "Provide at least one setting to update.";
  return Object.keys(fields).length ? { message: "Please correct the platform settings.", fields } : output;
}

export function addBillingInterval(start, interval) {
  const date = new Date(start);
  if (!Number.isFinite(date.getTime()) || !SAAS_INTERVALS.includes(interval)) throw new RangeError("A valid billing start and interval are required.");
  const targetMonth = date.getUTCMonth() + (interval === "monthly" ? 1 : 12);
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, month, Math.min(date.getUTCDate(), lastDay), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
}

export function planSnapshot(plan) {
  return {
    ...(plan.key ? { key: plan.key, features: { ...(plan.features?.toObject?.() || plan.features || {}) } } : {}),
    name: plan.name,
    price: plan.price,
    currency: "PKR",
    interval: plan.interval,
    limits: { members: plan.limits?.members ?? null, trainers: plan.limits?.trainers ?? null, ...(plan.key ? { staff: plan.limits?.staff ?? null, branches: plan.key === "professional" ? (plan.limits?.branches ?? 5) : 1 } : {}) },
  };
}

export function createPlatformInvoiceNumber() {
  return `FITIVO-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

export function serializeSaaSPlan(plan) {
  return { id: String(plan._id), ...(plan.key ? { key: plan.key, features: { ...(plan.features?.toObject?.() || plan.features || {}) } } : {}), name: plan.name, description: plan.description || "", price: plan.price, currency: "PKR", interval: plan.interval, limits: { members: plan.limits?.members ?? null, trainers: plan.limits?.trainers ?? null, ...(plan.key ? { staff: plan.limits?.staff ?? null, branches: plan.key === "professional" ? (plan.limits?.branches ?? 5) : 1 } : {}) }, isActive: Boolean(plan.isActive), createdAt: plan.createdAt };
}

export function serializePlatformInvoice(invoice) {
  return {
    id: String(invoice._id), invoiceNumber: invoice.invoiceNumber, changesPlan: Boolean(invoice.changesPlan),
    previousPlanSnapshot: invoice.previousPlanSnapshot || null, gymId: String(invoice.gymId?._id || invoice.gymId),
    gymName: invoice.gymId?.name || "Gym unavailable", planId: String(invoice.planId), planSnapshot: invoice.planSnapshot,
    amountDue: invoice.amountDue, currency: invoice.currency, periodStart: invoice.periodStart, periodEnd: invoice.periodEnd,
    status: invoice.status, issuedAt: invoice.issuedAt, paidAt: invoice.paidAt || null,
    paymentReference: invoice.paymentReference || "", voidedAt: invoice.voidedAt || null,
    voidReason: invoice.voidReason || "",
    paymentClaims: (invoice.paymentClaims || []).map((claim) => ({ id: String(claim._id), reference: claim.reference, submittedAt: claim.submittedAt, submittedBy: claim.submittedBy ? { id: String(claim.submittedBy._id || claim.submittedBy), name: claim.submittedBy.fullName || claim.submittedBy.email || "Gym Owner" } : null, status: claim.status, reviewedAt: claim.reviewedAt || null, reviewedBy: claim.reviewedBy ? { id: String(claim.reviewedBy._id || claim.reviewedBy), name: claim.reviewedBy.fullName || claim.reviewedBy.email || "Superadmin" } : null, rejectionReason: claim.rejectionReason || "" })),
    verifiedAmount: invoice.verifiedAmount ?? null, verifiedReference: invoice.verifiedReference || "", verificationNotes: invoice.verificationNotes || "", verifiedAt: invoice.verifiedAt || null,
    verifiedBy: invoice.verifiedBy ? { id: String(invoice.verifiedBy._id || invoice.verifiedBy), name: invoice.verifiedBy.fullName || invoice.verifiedBy.email || "Superadmin" } : null,
    createdBy: invoice.createdBy ? { id: String(invoice.createdBy._id || invoice.createdBy), name: invoice.createdBy.fullName || invoice.createdBy.email || "Superadmin" } : null,
    reconciledBy: invoice.reconciledBy ? { id: String(invoice.reconciledBy._id || invoice.reconciledBy), name: invoice.reconciledBy.fullName || invoice.reconciledBy.email || "Superadmin" } : null,
    voidedBy: invoice.voidedBy ? { id: String(invoice.voidedBy._id || invoice.voidedBy), name: invoice.voidedBy.fullName || invoice.voidedBy.email || "Superadmin" } : null,
    createdAt: invoice.createdAt || null,
  };
}

export function serializeGymSaaSSubscription(subscription, invoices = [], now = new Date()) {
  if (!subscription) return null;
  const trialEnded = subscription.status === "trialing" && (!subscription.trialEndsAt || new Date(subscription.trialEndsAt) <= now);
  const periodEnded = subscription.status === "active" && (!subscription.periodEnd || new Date(subscription.periodEnd) <= now);
  const status = trialEnded ? "trial_ended" : periodEnded ? "expired" : subscription.status;
  return {
    planId: String(subscription.planId), plan: subscription.planSnapshot, status,
    periodStart: subscription.periodStart || null, periodEnd: subscription.periodEnd || null,
    trialStartedAt: subscription.trialStartedAt || null, trialEndsAt: subscription.trialEndsAt || null,
    renewalDate: subscription.renewalDate || null,
    autoRenew: Boolean(subscription.autoRenew), pendingInvoiceId: subscription.pendingInvoiceId ? String(subscription.pendingInvoiceId) : null,
    complimentaryGrant: subscription.complimentaryGrant ? {
      reason: subscription.complimentaryGrant.reason,
      grantedAt: subscription.complimentaryGrant.grantedAt,
      grantedBy: subscription.complimentaryGrant.grantedBy ? {
        id: String(subscription.complimentaryGrant.grantedBy._id || subscription.complimentaryGrant.grantedBy),
        name: subscription.complimentaryGrant.grantedBy.fullName || subscription.complimentaryGrant.grantedBy.email || "Superadmin",
      } : null,
    } : null,
    invoices: invoices.map(serializePlatformInvoice),
  };
}
