import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateMemberBody } from "../lib/memberApiHelpers.js";
import { addDays, gymToday } from "../lib/subscriptionRules.js";

const validMember = {
  fullName: "Sam Example",
  phone: "+923001234567",
  email: "",
  gender: "Prefer not to say",
  dateOfBirth: "2000-01-01",
  planId: "507f1f77bcf86cd799439011",
  startDate: "2026-10-19",
};

test("member validation accepts valid optional birth dates and rejects invalid or future dates", () => {
  assert.equal(validateMemberBody(validMember), null);
  assert.equal(validateMemberBody({ ...validMember, dateOfBirth: addDays(gymToday(), 1) }).fields.dateOfBirth, "Date of birth cannot be in the future.");
  assert.equal(validateMemberBody({ ...validMember, dateOfBirth: "2001-02-29" }).fields.dateOfBirth, "Enter a valid date of birth.");
  assert.equal(validateMemberBody({ ...validMember, dateOfBirth: "" }), null);
});

test("member deactivation accepts only a boolean partial update", () => {
  assert.equal(validateMemberBody({ isActive: false }, { partial: true }), null);
  assert.equal(validateMemberBody({ isActive: "false" }, { partial: true }).fields.isActive, "Account status must be active or inactive.");
  assert.equal(validateMemberBody({ membershipCancelled: false }, { partial: true }).fields.membershipCancelled, "This field cannot be changed.");
});

test("member CRUD reads and writes use trusted tenant scope and reject client-selected gym ownership", async () => {
  const collection = await readFile(fileURLToPath(new URL("../app/api/members/route.js", import.meta.url)), "utf8");
  const detail = await readFile(fileURLToPath(new URL("../app/api/members/[id]/route.js", import.meta.url)), "utf8");
  assert.equal((collection.match(/requireApiUser\(request\)/g) || []).length, 2);
  assert.equal((detail.match(/requireApiUser\((?:_request|request)\)/g) || []).length, 2);
  assert.match(collection, /Member\.find\(tenantFilter\(request, filter\)\)/);
  assert.match(collection, /Member\.create\(\{\s*gymId: getRequestGymId\(request\)/);
  assert.match(detail, /Member\.findOne\(tenantFilter\(_request, \{ _id: id \}\)\)/);
  assert.match(detail, /findOneAndUpdate\(tenantFilter\(request, \{ _id: id \}\)/);
  assert.match(detail, /isActive/);
  assert.match(detail, /Subscription\.exists\(tenantFilter\(request, \{ memberId: current\._id \}\)\)/);
  assert.match(collection, /Plan\.findOne\(tenantFilter\(request/);
  assert.match(collection, /Trainer\.findOne\(tenantFilter\(request/);
  assert.match(detail, /Plan\.findOne\(tenantFilter\(request/);
  assert.match(detail, /Trainer\.findOne\(tenantFilter\(request/);
  assert.equal(validateMemberBody({ ...validMember, gymId: "507f1f77bcf86cd799439012" }).fields.gymId, "This field cannot be changed.");
});

test("attendance denies inactive member accounts and cancelled memberships", async () => {
  const source = await readFile(fileURLToPath(new URL("../app/api/attendance/check-in/route.js", import.meta.url)), "utf8");
  assert.match(source, /member\.isActive === false/);
  assert.match(source, /member\.membershipCancelled/);
});
