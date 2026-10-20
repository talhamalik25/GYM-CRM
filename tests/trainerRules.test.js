import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Trainer from "../models/Trainer.js";
import { isTrainerId, validateTrainerBody, validateTrainerAssignment } from "../lib/trainerApiHelpers.js";

const valid = { fullName: "Ayesha Khan", email: "ayesha@example.com", phone: "+923001234567", specialization: "Strength training", joiningDate: "2025-04-12", status: "active", profileImage: "", notes: "" };

test("trainer input accepts valid fields and rejects malformed values", () => {
  assert.equal(validateTrainerBody(valid), null);
  assert.equal(validateTrainerBody({ ...valid, email: "not-an-email" }).fields.email, "Enter a valid email address.");
  assert.equal(validateTrainerBody({ ...valid, joiningDate: "2025-02-30" }).fields.joiningDate, "Enter a valid joining date.");
  assert.equal(validateTrainerBody({ ...valid, status: "removed" }).fields.status, "Status must be active or inactive.");
  assert.equal(validateTrainerBody({ ...valid, unexpected: true }).fields.unexpected, "This field cannot be changed.");
});

test("trainer ids and schema required fields are checked without a database", async () => {
  assert.equal(isTrainerId("507f1f77bcf86cd799439011"), true);
  assert.equal(isTrainerId("not-an-id"), false);
  const invalid = new Trainer({ fullName: "", email: "bad", phone: "1", specialization: "", joiningDate: new Date(), status: "archived" });
  const validationError = await invalid.validate().then(() => null, error => error);
  const errors = validationError.errors;
  assert.ok(errors.fullName);
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.specialization);
  assert.ok(errors.status);
});

test("member assignment rejects missing, invalid, and inactive trainers but preserves an existing inactive link", () => {
  assert.equal(validateTrainerAssignment(null, null), null);
  assert.equal(validateTrainerAssignment("bad-id", null).status, 400);
  assert.equal(validateTrainerAssignment("507f1f77bcf86cd799439011", null).status, 404);
  assert.equal(validateTrainerAssignment("507f1f77bcf86cd799439011", { status: "inactive" }).status, 400);
  assert.equal(validateTrainerAssignment("507f1f77bcf86cd799439011", { status: "inactive" }, "507f1f77bcf86cd799439011"), null);
  assert.equal(validateTrainerAssignment("507f1f77bcf86cd799439011", { status: "active" }), null);
});

test("trainer deactivation requires confirmation before the status update", async () => {
  const source = await readFile(fileURLToPath(new URL("../components/trainers/trainer-detail.js", import.meta.url)), "utf8");
  assert.match(source, /trainer\.status === "active" && !window\.confirm\(`Deactivate \$\{trainer\.fullName\}\?`\)/);
  assert.match(source, /saveTrainer\(\{ status: trainer\.status === "active" \? "inactive" : "active" \}/);
});
