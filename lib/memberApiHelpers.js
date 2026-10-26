import { errorResponse } from "./planApiResponse.js";
import { deriveMembershipStatus, gymToday, membershipDaysRemaining } from "./subscriptionRules.js";

// Store phone numbers canonically: keep an initial +, keep digits, discard formatting.
export function normalizeMemberPhone(value) {
  const trimmed = String(value || "").trim();
  const hasInternationalPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return `${hasInternationalPrefix ? "+" : ""}${digits}`;
}

function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateMemberBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }

  const allowed = ["fullName", "phone", "email", "gender", "dateOfBirth", "planId", "startDate", "trainerId", "notes", ...(partial ? ["isActive"] : [])];
  const fields = {};
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key) && key !== "expiryDate") fields[key] = "This field cannot be changed.";
  }

  if (!partial || Object.hasOwn(body, "fullName")) {
    if (typeof body.fullName !== "string" || !body.fullName.trim()) fields.fullName = "Full name is required.";
  }
  if (!partial || Object.hasOwn(body, "phone")) {
    const phone = normalizeMemberPhone(body.phone);
    const enteredPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!/^\+?[0-9\s().-]+$/.test(enteredPhone) || !/^\+?\d{7,15}$/.test(phone)) {
      fields.phone = "Enter a valid phone number with 7 to 15 digits.";
    }
  }
  if (Object.hasOwn(body, "email") && body.email !== "" && body.email !== null && (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) {
    fields.email = "Enter a valid email address or leave this field blank.";
  }
  if (!partial || Object.hasOwn(body, "gender")) {
    if (!["Female", "Male", "Other", "Prefer not to say"].includes(body.gender)) fields.gender = "Choose a valid gender option.";
  }
  if (!partial || Object.hasOwn(body, "planId")) {
    if (typeof body.planId !== "string" || !body.planId) fields.planId = "Choose a membership plan.";
  }
  if (Object.hasOwn(body, "trainerId") && body.trainerId !== null && body.trainerId !== "" && typeof body.trainerId !== "string") fields.trainerId = "Choose a valid trainer or leave this unassigned.";
  if (!partial || Object.hasOwn(body, "startDate")) {
    if (!isDateOnly(body.startDate)) fields.startDate = "Enter a valid membership start date.";
  }
  if (Object.hasOwn(body, "dateOfBirth") && body.dateOfBirth !== "" && body.dateOfBirth !== null && !isDateOnly(body.dateOfBirth)) {
    fields.dateOfBirth = "Enter a valid date of birth.";
  } else if (typeof body.dateOfBirth === "string" && body.dateOfBirth && body.dateOfBirth > gymToday()) {
    fields.dateOfBirth = "Date of birth cannot be in the future.";
  }
  if (Object.hasOwn(body, "notes") && typeof body.notes !== "string") fields.notes = "Notes must be text.";
  if (Object.hasOwn(body, "isActive") && typeof body.isActive !== "boolean") fields.isActive = "Account status must be active or inactive.";

  if (partial && Object.keys(body).every((key) => key === "expiryDate")) {
    return { message: "Provide at least one member field to update.", fields };
  }
  return Object.keys(fields).length ? { message: "Please correct the highlighted fields.", fields } : null;
}

function dateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function serializeMember(member, today = gymToday()) {
  const plan = member.planId && typeof member.planId === "object" && member.planId.name ? member.planId : null;
  const trainer = member.trainerId && typeof member.trainerId === "object" && member.trainerId.fullName ? member.trainerId : null;
  const expiryDate = dateOnly(member.expiryDate);
  return {
    _id: String(member._id),
    fullName: member.fullName,
    phone: member.phone,
    email: member.email || "",
    gender: member.gender,
    dateOfBirth: dateOnly(member.dateOfBirth),
    planId: String(plan?._id || member.planId),
    plan: plan ? { id: String(plan._id), name: plan.name, price: plan.price } : null,
    trainerId: String(trainer?._id || member.trainerId || "") || null,
    trainer: trainer ? { id: String(trainer._id), fullName: trainer.fullName, status: trainer.status } : null,
    startDate: dateOnly(member.startDate),
    expiryDate,
    today,
    status: member.membershipCancelled ? "Cancelled" : deriveMembershipStatus(expiryDate, today, 7, dateOnly(member.startDate)),
    daysRemaining: membershipDaysRemaining(expiryDate, today),
    notes: member.notes || "",
    isActive: member.isActive !== false,
    membershipCancelled: Boolean(member.membershipCancelled),
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

export function handleMemberError(error) {
  if (error?.code === 11000 && (error.keyPattern?.phone || error.keyValue?.phone)) {
    return errorResponse("A member with this phone number already exists.", 409, { phone: "This phone number is already in use." });
  }
  if (error?.name === "ValidationError") {
    const fields = Object.fromEntries(Object.entries(error.errors || {}).map(([key, value]) => [key, value.message]));
    return errorResponse("Please check the member details and try again.", 400, fields);
  }
  console.error("Members API error:");
  return errorResponse("Something went wrong while accessing members. Please try again.", 500);
}
