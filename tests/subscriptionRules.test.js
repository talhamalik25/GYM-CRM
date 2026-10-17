import test from "node:test";
import assert from "node:assert/strict";
import { addDays, dateOnly, deriveMembershipStatus, deriveSubscriptionStatus, gymToday, isDateOnly, membershipDaysRemaining, membershipExpiryDate, resolveGymTimezone } from "../lib/subscriptionRules.js";
import { getGymDate } from "../lib/gymDate.js";

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

test("30-day membership counts its start date as day one", () => {
  assert.equal(membershipExpiryDate("2026-10-01", 30), "2026-10-30");
  assert.equal(addDays("2026-10-01", 29), "2026-10-30");
});

test("inclusive membership expiry handles month ends and year boundaries", () => {
  assert.equal(membershipExpiryDate("2026-01-31", 30), "2026-03-01");
  assert.equal(membershipExpiryDate("2026-12-15", 30), "2027-01-13");
});

test("expiry remains valid through today in Asia/Karachi", () => {
  const now = new Date("2026-10-30T18:59:00.000Z");
  const today = gymToday(now, "Asia/Karachi");
  assert.equal(today, "2026-10-30");
  assert.equal(deriveMembershipStatus("2026-10-30", today), "Expiring");
  assert.equal(deriveSubscriptionStatus({ status: "active", startDate: dateOnly("2026-10-01"), expiryDate: dateOnly("2026-10-30") }, today), "active");
  assert.equal(deriveSubscriptionStatus({ status: "active", startDate: dateOnly("2026-10-01"), expiryDate: dateOnly("2026-10-30") }, "2026-10-31"), "expired");
});

test("member status and attendance use the same gym-local calendar day", () => {
  const now = new Date("2026-10-14T20:30:00.000Z");
  const attendanceDate = getGymDate(now);
  const today = gymToday(now, "Asia/Karachi");
  assert.equal(attendanceDate, "2026-10-15");
  assert.equal(deriveMembershipStatus("2026-10-15", today), "Expiring");
  assert.equal(membershipDaysRemaining("2026-10-15", attendanceDate), 0);
});

test("upcoming memberships remain distinct and cancellation takes precedence", () => {
  assert.equal(deriveMembershipStatus("2026-11-01", "2026-10-30", 7, "2026-11-01"), "Upcoming");
  assert.equal(deriveSubscriptionStatus({ status: "cancelled", startDate: dateOnly("2026-10-01"), expiryDate: dateOnly("2026-10-30") }, "2026-10-30"), "cancelled");
});

test("invalid dates and timezone configuration fail safely", () => {
  assert.equal(membershipExpiryDate("2026-02-30", 30), "");
  assert.equal(membershipExpiryDate("2026-10-01", 0), "");
  assert.equal(membershipDaysRemaining("not-a-date", "2026-10-15"), null);
  assert.equal(resolveGymTimezone("invalid/zone"), "Asia/Karachi");
  assert.equal(gymToday(new Date("2026-10-14T20:30:00.000Z"), "invalid/zone"), "2026-10-15");
});
