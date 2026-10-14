import test from "node:test";
import assert from "node:assert/strict";
import { currentGymPaymentMonthRange, isValidIdempotencyKey, isWholeRupeePrice, makePaymentFingerprint, paymentMonthRange } from "../lib/paymentRules.js";

test("plan prices require positive safe whole rupees", () => {
  assert.equal(isWholeRupeePrice(4500), true);
  assert.equal(isWholeRupeePrice(0), false);
  assert.equal(isWholeRupeePrice(4500.5), false);
  assert.equal(isWholeRupeePrice(Number.MAX_SAFE_INTEGER + 1), false);
});

test("same payment payload fingerprints identically for retry; separate payments remain distinct", () => {
  const first = { memberId: "ABCDEF0123456789ABCDEF01", amountPaid: 1000, method: "cash", paymentDate: "2026-10-14", notes: "  October  " };
  assert.equal(makePaymentFingerprint(first), makePaymentFingerprint({ ...first, memberId: first.memberId.toLowerCase(), notes: "October" }));
  assert.notEqual(makePaymentFingerprint(first), makePaymentFingerprint({ ...first, paymentDate: "2026-10-15" }));
  assert.notEqual(makePaymentFingerprint(first), makePaymentFingerprint({ ...first, amountPaid: 500 }));
});

test("idempotency keys have an accepted length and character set", () => {
  assert.equal(isValidIdempotencyKey("3dcfcd5c-2ba7-4e25-b99a-f2107f6919bd"), true);
  assert.equal(isValidIdempotencyKey("short"), false);
  assert.equal(isValidIdempotencyKey("invalid key with spaces"), false);
});

test("month ranges reject invalid values and use exclusive next-month boundaries", () => {
  assert.equal(paymentMonthRange("2026-13"), null);
  const range = paymentMonthRange("2026-02");
  assert.equal(range.start.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-03-01T00:00:00.000Z");
});

test("current payment month follows GYM_TIMEZONE across UTC month boundaries", () => {
  const range = currentGymPaymentMonthRange(new Date("2026-10-31T20:00:00.000Z"), "Asia/Karachi");
  assert.equal(range.start.toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-12-01T00:00:00.000Z");
});
