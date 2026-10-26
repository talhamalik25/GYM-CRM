import mongoose from "mongoose";
import { errorResponse } from "./planApiResponse.js";

const fields = ["fullName", "email", "phone", "specialization", "joiningDate", "status", "profileImage", "notes"];
export function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateTrainerBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const errors = {};
  for (const field of Object.keys(body)) if (!fields.includes(field)) errors[field] = "This field cannot be changed.";
  const required = ["fullName", "email", "phone", "specialization", "joiningDate"];
  for (const field of required) {
    if (!partial || Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string" || !body[field].trim()) errors[field] = `${field === "fullName" ? "Full name" : field === "joiningDate" ? "Joining date" : field[0].toUpperCase() + field.slice(1)} is required.`;
    }
  }
  if (body.fullName != null && (typeof body.fullName !== "string" || body.fullName.trim().length < 2 || body.fullName.trim().length > 120)) errors.fullName = "Name must be between 2 and 120 characters.";
  if (body.email != null && (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) errors.email = "Enter a valid email address.";
  if (body.phone != null && (typeof body.phone !== "string" || !/^\+?[0-9\s().-]+$/.test(body.phone.trim()))) errors.phone = "Enter a valid phone number.";
  if (typeof body.phone === "string") { const normalized = body.phone.trim().startsWith("+") ? "+" + body.phone.replace(/\D/g, "") : body.phone.replace(/\D/g, ""); if (!/^\+?\d{7,15}$/.test(normalized)) errors.phone = "Enter a phone number with 7 to 15 digits."; }
  if (body.specialization != null && (typeof body.specialization !== "string" || body.specialization.trim().length < 2 || body.specialization.trim().length > 100)) errors.specialization = "Specialization must be between 2 and 100 characters.";
  if (body.joiningDate != null && !isDateOnly(body.joiningDate)) errors.joiningDate = "Enter a valid joining date.";
  if (Object.hasOwn(body, "status") && !["active", "inactive"].includes(body.status)) errors.status = "Status must be active or inactive.";
  if (body.profileImage != null && typeof body.profileImage !== "string") errors.profileImage = "Profile image must be a URL.";
  if (typeof body.profileImage === "string" && body.profileImage.trim()) {
    try { const url = new URL(body.profileImage.trim()); if (!(["https:", "http:"].includes(url.protocol))) throw new Error(); }
    catch { errors.profileImage = "Enter a valid http or https image URL."; }
  }
  if (body.notes != null && (typeof body.notes !== "string" || body.notes.length > 2000)) errors.notes = "Notes must be text up to 2,000 characters.";
  if (partial && Object.keys(body).length === 0) errors._form = "Provide at least one field to update.";
  return Object.keys(errors).length ? { message: "Please correct the highlighted fields.", fields: errors } : null;
}

export function serializeTrainer(trainer, assignedMemberCount = 0) {
  const value = trainer.toObject ? trainer.toObject() : trainer;
  return { _id: String(value._id), fullName: value.fullName, email: value.email, phone: value.phone, specialization: value.specialization, joiningDate: value.joiningDate ? new Date(value.joiningDate).toISOString().slice(0, 10) : "", status: value.status, profileImage: value.profileImage || "", notes: value.notes || "", assignedMemberCount, createdAt: value.createdAt, updatedAt: value.updatedAt };
}

export function handleTrainerError(error) {
  if (error?.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) return errorResponse("A trainer with this email already exists.", 409, { email: "This email is already in use." });
  if (error?.name === "ValidationError") return errorResponse("Please check the trainer details.", 400, Object.fromEntries(Object.entries(error.errors || {}).map(([field, value]) => [field, value.message])));
  console.error("Trainers API error:");
  return errorResponse("Something went wrong while accessing trainers.", 500);
}

export function isTrainerId(value) { return mongoose.isObjectIdOrHexString(value); }

export function validateTrainerAssignment(trainerId, trainer, currentTrainerId = null) {
  if (trainerId == null || trainerId === "") return null;
  if (!isTrainerId(trainerId)) return { status: 400, message: "Choose a valid trainer." };
  if (!trainer) return { status: 404, message: "Choose an existing trainer." };
  if (trainer.status !== "active" && String(currentTrainerId || "") !== String(trainerId)) return { status: 400, message: "Only active trainers can be assigned to a member." };
  return null;
}
