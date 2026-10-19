import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validatePlanBody } from "../lib/planApiResponse.js";

const plan = { name: "Standard", price: 7500, durationDays: 30, description: "One month access" };

test("plan validation accepts supported fields and rejects invalid prices, durations, and fields", () => {
  assert.equal(validatePlanBody(plan), null);
  assert.equal(validatePlanBody({ ...plan, price: 7500.5 }).fields.price, "Price must be a whole number of rupees greater than zero.");
  assert.equal(validatePlanBody({ ...plan, price: Number.MAX_SAFE_INTEGER + 1 }).fields.price, "Price must be a whole number of rupees greater than zero.");
  assert.equal(validatePlanBody({ ...plan, durationDays: 0 }).fields.durationDays, "Duration must be a whole number of days greater than zero.");
  assert.equal(validatePlanBody({ ...plan, durationDays: 30.5 }).fields.durationDays, "Duration must be a whole number of days greater than zero.");
  assert.equal(validatePlanBody({ ...plan, durationDays: Number.MAX_SAFE_INTEGER + 1 }).fields.durationDays, "Duration must be a whole number of days greater than zero.");
  assert.equal(validatePlanBody({ ...plan, gymId: "forged" }).fields.gymId, "This field cannot be changed.");
  assert.equal(validatePlanBody({ isActive: false }, { partial: true }), null);
  assert.equal(validatePlanBody({ isActive: "false" }, { partial: true }).fields.isActive, "Active status must be true or false.");
});

test("plan list keeps its existing response by default and can return Gym-scoped member counts", async () => {
  const route = await readFile(fileURLToPath(new URL("../app/api/plans/route.js", import.meta.url)), "utf8");
  const service = await readFile(fileURLToPath(new URL("../lib/plansService.js", import.meta.url)), "utf8");
  const manager = await readFile(fileURLToPath(new URL("../components/plans/plans-manager.js", import.meta.url)), "utf8");
  assert.match(route, /requireApiUser\(request\)/);
  assert.match(route, /Plan\.find\(tenantFilter\(request/);
  assert.match(route, /params\.get\("includeMemberCounts"\) === "true"/);
  assert.match(route, /Member\.aggregate\(\[/);
  assert.match(route, /gymId: getRequestGymId\(request\), planId: \{ \$in: plans\.map/);
  assert.match(route, /return successResponse\(plans\);/);
  assert.match(service, /includeMemberCounts = false/);
  assert.match(manager, /listPlans\(\{ includeMemberCounts: true \}\)/);
  assert.match(manager, /plan\.memberCount \?\? 0/);
  assert.doesNotMatch(manager, /getPlanMemberCounts/);
  assert.match(manager, /\{ \.\.\.plan, \.\.\.saved \}/);
  assert.match(manager, /Number\.isSafeInteger\(Number\(values\.price\)\)/);
  assert.match(manager, /step="1" inputMode="numeric" required value=\{values\.price\}/);
});

test("plan edit and active status remain tenant-scoped and subscription flows require active plans", async () => {
  const route = await readFile(fileURLToPath(new URL("../app/api/plans/[id]/route.js", import.meta.url)), "utf8");
  const createSubscription = await readFile(fileURLToPath(new URL("../app/api/subscriptions/route.js", import.meta.url)), "utf8");
  const renewSubscription = await readFile(fileURLToPath(new URL("../app/api/subscriptions/[id]/renew/route.js", import.meta.url)), "utf8");
  assert.match(route, /requireApiUser\(request\)/);
  assert.match(route, /findOneAndUpdate\(tenantFilter\(request, \{ _id: id \}\)/);
  assert.match(route, /validatePlanBody\(body, \{ partial: true \}\)/);
  assert.match(createSubscription, /Plan\.findOne\(\{ _id: body\.planId, gymId \}\)/);
  assert.match(createSubscription, /!plan\.isActive/);
  assert.match(renewSubscription, /Plan\.findOne\(\{ _id: body\.planId \|\| subscription\.planId, gymId \}\)/);
  assert.match(renewSubscription, /!plan\.isActive/);
});
