import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { calculateOutstandingBalance, currentGymPaymentMonthRange, isPaymentWithinBalance, isValidIdempotencyKey, isWholeRupeePrice, makePaymentFingerprint, paymentMonthRange } from "../lib/paymentRules.js";

test("payment and subscription API routes retain authenticated access checks", async () => {
  const routes = [
    "../app/api/payments/route.js",
    "../app/api/payments/dues/route.js",
    "../app/api/payments/summary/route.js",
    "../app/api/payments/[id]/route.js",
    "../app/api/subscriptions/route.js",
    "../app/api/subscriptions/[id]/route.js",
    "../app/api/subscriptions/[id]/payments/route.js",
    "../app/api/subscriptions/[id]/renew/route.js",
  ];
  for (const route of routes) {
    const source = await readFile(fileURLToPath(new URL(route, import.meta.url)), "utf8");
    assert.match(source, /await requireApiUser\(/, `${route} must enforce API authentication`);
  }
});

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
  assert.notEqual(makePaymentFingerprint(first), makePaymentFingerprint({ ...first, subscriptionId: "subscription-1", renewalKey: "term-1" }));
});

test("one full payment clears its agreed invoice balance", () => {
  assert.deepEqual(calculateOutstandingBalance(12000, [{ amountPaid: 12000 }]), { agreedAmount: 12000, paid: 12000, outstanding: 0 });
});

test("multiple partial payments reduce the same agreed invoice balance", () => {
  assert.deepEqual(calculateOutstandingBalance(12000, [{ amountPaid: 3500 }, { amountPaid: 2500 }]), { agreedAmount: 12000, paid: 6000, outstanding: 6000 });
});

test("repeated installments do not create another full-price charge", () => {
  const payments = [{ amountPaid: 2000 }, { amountPaid: 3000 }, { amountPaid: 5000 }];
  assert.equal(calculateOutstandingBalance(10000, payments).outstanding, 0);
  assert.equal(calculateOutstandingBalance(10000, payments).agreedAmount, 10000);
});

test("payments above the outstanding balance are rejected", () => {
  assert.equal(isPaymentWithinBalance(4000, 4000), true);
  assert.equal(isPaymentWithinBalance(4001, 4000), false);
  assert.equal(isPaymentWithinBalance(0, 4000), false);
  assert.equal(isPaymentWithinBalance(2.5, 4000), false);
});

test("invoice dues equal agreed charges less payments and never go negative", () => {
  const invoiceBalances = [
    calculateOutstandingBalance(8000, [{ amountPaid: 2000 }, { amountPaid: 1000 }]).outstanding,
    calculateOutstandingBalance(5000, [{ amountPaid: 9000 }]).outstanding,
  ];
  assert.equal(invoiceBalances.reduce((sum, balance) => sum + balance, 0), 5000);
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
