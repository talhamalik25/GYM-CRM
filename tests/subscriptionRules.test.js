import test from "node:test";
import assert from "node:assert/strict";
import { addDays, dateOnly, deriveSubscriptionStatus, gymToday, isDateOnly } from "../lib/subscriptionRules.js";

test("subscription dates are strict date-only values and add calendar days", () => {
  assert.equal(isDateOnly("2026-02-28"), true);
  assert.equal(isDateOnly("2026-02-30"), false);
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
});

test("expiry is inclusive and a subscription activates only when its start date arrives", () => {
  const term = { status: "pending", startDate: dateOnly("2026-10-15"), expiryDate: dateOnly("2026-10-20") };
  assert.equal(deriveSubscriptionStatus(term, "2026-10-14"), "pending");
  assert.equal(deriveSubscriptionStatus(term, "2026-10-20"), "active");
  assert.equal(deriveSubscriptionStatus(term, "2026-10-21"), "expired");
  assert.equal(deriveSubscriptionStatus({ ...term, status: "cancelled" }, "2026-10-16"), "cancelled");
});

test("gym date uses the configured timezone at UTC day boundaries and falls back safely", () => {
  const instant = new Date("2026-10-14T20:30:00.000Z");
  assert.equal(gymToday(instant, "Asia/Karachi"), "2026-10-15");
  assert.equal(gymToday(instant, "not/a-zone"), "2026-10-15");
});
