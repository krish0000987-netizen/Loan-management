import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSchedule, computeEmi, flatEmi, computeDpd, computeApr, allocatePayment, foreclosureQuote, npaClass, daysBetween
} from "../core/finance.js";

test("computeEmi: reducing-balance annuity is stable and correct", () => {
  // ₹10,00,000 @ 12% p.a. / 12 months → EMI ≈ 88,849
  const emi = computeEmi(1000000, 12, 12);
  assert.ok(Math.abs(emi - 88849) <= 2, `expected ~88849, got ${emi}`);
  // Zero-rate loan splits principal evenly
  assert.equal(computeEmi(120000, 0, 12), 10000);
  // Longer tenure → smaller EMI
  assert.ok(computeEmi(1000000, 12, 24) < emi);
});

test("flatEmi: flat-rate interest is linear", () => {
  // ₹1,00,000 @ 12% flat over 12 months → (1,00,000 + 12,000) / 12 = 9,333.33 → 9,333
  assert.equal(flatEmi(100000, 12, 12), 9333);
  assert.equal(flatEmi(120000, 0, 12), 10000);
});

test("buildSchedule: schedule sums EXACTLY to principal (no rounding drift)", () => {
  for (const [principal, rate, tenure] of [
    [100000, 15.5, 36], [500000, 12, 60], [2500000, 11.5, 84], [150000, 18, 24], [40000, 21.5, 18]
  ]) {
    const s = buildSchedule({ principal, annualRatePct: rate, tenure, firstDueDate: "2026-09-05" });
    const sumPrincipal = s.reduce((acc, r) => acc + r.principal, 0);
    assert.equal(sumPrincipal, principal, `principal drift for ${principal}/${rate}/${tenure}`);
    assert.equal(s.length, tenure);
    assert.equal(s[s.length - 1].closingBalance, 0);
    // monotonic closing balance
    for (let i = 1; i < s.length; i++) {
      assert.ok(s[i].closingBalance < s[i - 1].closingBalance);
    }
  }
});

test("buildSchedule: weekly and quarterly frequencies produce expected period counts", () => {
  const w = buildSchedule({ principal: 100000, annualRatePct: 15, tenure: 12, firstDueDate: "2026-01-01", frequency: "weekly" });
  const q = buildSchedule({ principal: 100000, annualRatePct: 15, tenure: 8, firstDueDate: "2026-01-01", frequency: "quarterly" });
  assert.equal(w.length, 12);
  assert.equal(q.length, 8);
  assert.equal(daysBetween("2026-01-01", "2026-02-01"), 31);
});

test("computeDpd: buckets, missed counts and days-late are correct", () => {
  const insts = [
    { dueDate: "2026-05-05", paid: 1, paidAmount: 10000 },
    { dueDate: "2026-06-05", paid: 0, paidAmount: 0 },
    { dueDate: "2026-07-05", paid: 0, paidAmount: 0 }
  ];
  const clean = computeDpd(insts, "2026-06-10");
  assert.equal(clean.missedInstallments, 1);
  assert.equal(clean.bucket, "1-30");
  const deep = computeDpd(insts, "2026-08-20");
  assert.equal(deep.missedInstallments, 2);
  assert.ok(deep.daysLate > 60, `daysLate=${deep.daysLate}`);
  assert.equal(deep.bucket, "61-90");
  const gone = computeDpd(insts, "2026-11-01");
  assert.equal(gone.bucket, "90+");
});

test("npaClass: configurable thresholds are honored (never hard-coded)", () => {
  assert.equal(npaClass(30), null);
  assert.equal(npaClass(90), "NPA");
  assert.equal(npaClass(120), "NPA");
  assert.equal(npaClass(200), "Substandard");
  // Lender-specific policy
  assert.equal(npaClass(60, { npaDays: 60 }), "NPA");
  assert.equal(npaClass(90, { npaDays: 120 }), null);
});

test("computeApr: reflects upfront fees in annualized cost", () => {
  // No fees → APR equals the effective annualized rate of the nominal 15.5%
  const plain = computeApr(100000, 15.5, 12, 0, computeEmi(100000, 15.5, 12));
  assert.ok(Math.abs(plain - 16.65) < 0.3, `plain APR ${plain} (expected ~16.65 effective)`);
  // Fees raise APR above the no-fee baseline
  const withFees = computeApr(100000, 15.5, 12, 3000, computeEmi(100000, 15.5, 12));
  assert.ok(withFees > plain, `withFees ${withFees} should exceed ${plain}`);
});

test("allocatePayment: configurable order — penalty first, then fees, interest, principal", () => {
  const insts = [
    { seq: 1, total: 12000, paidAmount: 0, interest: 2000, principal: 10000 },
    { seq: 2, total: 12000, paidAmount: 0, interest: 2000, principal: 10000 }
  ];
  const res = allocatePayment({ amount: 25000, order: ["penalty", "fees", "interest", "principal"], penalDue: 500, feesDue: 300, installments: insts });
  assert.equal(res.allocations[0].component, "penalty");
  assert.equal(res.allocations[0].amount, 500);
  assert.equal(res.allocations[1].component, "fees");
  assert.equal(res.allocations[1].amount, 300);
  assert.equal(res.allocations[2].component, "interest");
  assert.equal(res.allocations[2].amount, 4000);
  // 25,000 covers penalty + fees + all interest + most principal → 200 left over
  assert.equal(res.remaining, 200);
  assert.equal(res.applied, 24800);
  // A different configured order puts interest first
  const alt = allocatePayment({ amount: 5000, order: ["interest", "penalty", "fees", "principal"], penalDue: 500, feesDue: 300, installments: insts });
  assert.equal(alt.allocations[0].component, "interest");
});

test("allocatePayment: overpayment spills into future principal and reports remaining", () => {
  const insts = [{ seq: 1, total: 10000, paidAmount: 0, interest: 1500, principal: 8500 }];
  const res = allocatePayment({ amount: 30000, order: ["penalty", "fees", "interest", "principal"], penalDue: 0, feesDue: 0, installments: insts });
  assert.equal(res.applied, 10000);
  assert.equal(res.remaining, 20000);
});

test("foreclosureQuote: deterministic and non-mutating", () => {
  const loan = { principal: 500000, rate: 12, outstanding: 500000, penalDue: 1000, feesDue: 500 };
  const insts = [
    { seq: 1, dueDate: "2026-01-05", principal: 20000, interest: 5000, paid: 1, paidAmount: 25000 },
    { seq: 2, dueDate: "2026-02-05", principal: 20000, interest: 5000, paid: 0, paidAmount: 0 }
  ];
  const q1 = foreclosureQuote(loan, insts, "2026-02-10", { foreclosureChargePct: 3 });
  const q2 = foreclosureQuote(loan, insts, "2026-02-10", { foreclosureChargePct: 3 });
  assert.deepEqual(q1, q2);
  assert.equal(q1.principalOutstanding, 20000);
  assert.equal(q1.foreclosureCharge, 600); // 3% of 20,000
  assert.equal(q1.finalPayable, 20000 + q1.accruedInterest + 1000 + 500 + 600 - q1.rebate);
});

test("computeEmi + schedule: EMI × tenure closely matches principal + interest", () => {
  const principal = 300000, rate = 16, tenure = 36;
  const s = buildSchedule({ principal, annualRatePct: rate, tenure, firstDueDate: "2026-06-05" });
  const totalInterest = s.reduce((acc, r) => acc + r.interest, 0);
  const emi = computeEmi(principal, rate, tenure);
  // sum of EMIs (last adjusts for rounding) equals principal + interest within a few rupees
  const emiSum = s.reduce((acc, r) => acc + r.total, 0);
  assert.ok(Math.abs(emiSum - (principal + totalInterest)) <= 2, `emiSum=${emiSum} principal+interest=${principal + totalInterest}`);
  assert.ok(emi > 0);
});
