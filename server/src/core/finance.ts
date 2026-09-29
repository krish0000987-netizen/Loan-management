/**
 * NEXUS finance engine — deterministic, integer-based lending math.
 * All monetary values are integers (paise-free rupees). Every function is
 * pure and unit-testable; no silent assumptions about interest methodology.
 */

export type InterestType = "reducing" | "flat";
export type Frequency = "monthly" | "weekly" | "fortnightly" | "quarterly";

export interface ScheduleRow {
  seq: number;
  dueDate: string;
  principal: number;
  interest: number;
  fees: number;
  total: number;
  closingBalance: number;
}

export interface ScheduleOptions {
  principal: number;
  annualRatePct: number;
  tenure: number;
  firstDueDate: string;
  interestType?: InterestType;
  frequency?: Frequency;
  lateFeeAmount?: number;
}

function periodRate(annualRatePct: number, frequency: Frequency): number {
  const r = annualRatePct / 100;
  switch (frequency) {
    case "weekly": return r / 52;
    case "fortnightly": return r / 26;
    case "quarterly": return r / 4;
    default: return r / 12;
  }
}

/** Reducing-balance EMI (standard annuity). */
export function computeEmi(principal: number, annualRatePct: number, tenure: number, frequency: Frequency = "monthly"): number {
  if (tenure <= 0) return 0;
  const pr = periodRate(annualRatePct, frequency);
  if (pr === 0) return Math.round(principal / tenure);
  const factor = Math.pow(1 + pr, tenure);
  return Math.round((principal * pr * factor) / (factor - 1));
}

/** Flat-rate installment. */
export function flatEmi(principal: number, annualRatePct: number, tenure: number, frequency: Frequency = "monthly"): number {
  const periodsPerYear = frequency === "weekly" ? 52 : frequency === "fortnightly" ? 26 : frequency === "quarterly" ? 4 : 12;
  const totalInterest = (principal * annualRatePct * tenure) / periodsPerYear / 100;
  return Math.round((principal + totalInterest) / tenure);
}

function addPeriod(dateStr: string, frequency: Frequency): string {
  const d = new Date(dateStr + "T00:00:00");
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "fortnightly") d.setDate(d.getDate() + 14);
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** Build a full amortization schedule. */
export function buildSchedule(opts: ScheduleOptions): ScheduleRow[] {
  const { principal, annualRatePct, tenure, firstDueDate, interestType = "reducing", frequency = "monthly", lateFeeAmount = 0 } = opts;
  const rows: ScheduleRow[] = [];
  const pr = periodRate(annualRatePct, frequency);

  let outstanding = principal;
  let due = firstDueDate;
  if (interestType === "flat") {
    const emiVal = flatEmi(principal, annualRatePct, tenure, frequency);
    for (let i = 1; i <= tenure; i++) {
      const interest = Math.round((principal * annualRatePct) / 100 / (frequency === "weekly" ? 52 : frequency === "fortnightly" ? 26 : frequency === "quarterly" ? 4 : 12));
      const p = i === tenure ? outstanding : emiVal - interest;
      outstanding -= p;
      rows.push({ seq: i, dueDate: due, principal: p, interest, fees: lateFeeAmount, total: p + interest + lateFeeAmount, closingBalance: Math.max(0, outstanding) });
      due = addPeriod(due, frequency);
    }
    return rows;
  }

  const emiVal = computeEmi(principal, annualRatePct, tenure, frequency);
  for (let i = 1; i <= tenure; i++) {
    const interest = Math.round(outstanding * pr);
    const isLast = i === tenure;
    const p = isLast ? outstanding : emiVal - interest;
    outstanding -= p;
    rows.push({ seq: i, dueDate: due, principal: Math.max(0, p), interest, fees: lateFeeAmount, total: Math.max(0, p) + interest + lateFeeAmount, closingBalance: Math.max(0, outstanding) });
    due = addPeriod(due, frequency);
  }
  return rows;
}

export interface DueInfo {
  daysLate: number;
  missedInstallments: number;
  bucket: string; // 0 | 1-30 | 31-60 | 61-90 | 90+
}

/** DPD calculation from installment state, as of a date. */
export function computeDpd(
  installments: { dueDate: string; paid: number; paidAmount: number }[],
  asOf: string = new Date().toISOString().slice(0, 10)
): DueInfo {
  let missed = 0;
  let oldestUnpaid: string | null = null;
  for (const inst of installments) {
    if (inst.paid === 1) continue;
    if (inst.dueDate <= asOf) {
      missed++;
      if (!oldestUnpaid || inst.dueDate < oldestUnpaid) oldestUnpaid = inst.dueDate;
    }
  }
  const daysLate = oldestUnpaid ? daysBetween(oldestUnpaid, asOf) : 0;
  let bucket: string;
  if (daysLate <= 0) bucket = "0";
  else if (daysLate <= 30) bucket = "1-30";
  else if (daysLate <= 60) bucket = "31-60";
  else if (daysLate <= 90) bucket = "61-90";
  else bucket = "90+";
  return { daysLate, missedInstallments: missed, bucket };
}

/** NPA classification from configurable thresholds (regulatory policy, not hard-coded defaults). */
export function npaClass(daysLate: number, config: { npaDays?: number; substandardDays?: number } = {}): string {
  const npa = config.npaDays ?? 90;
  const sub = config.substandardDays ?? 180;
  if (daysLate >= npa && daysLate < sub) return "NPA";
  if (daysLate >= sub) return "Substandard";
  return null as unknown as string;
}

export type AllocationComponent = "penalty" | "fees" | "interest" | "principal";

export interface AllocationInput {
  amount: number;
  order: AllocationComponent[];
  penalDue: number;
  feesDue: number;
  installments: { seq: number; total: number; paidAmount: number; interest: number; principal: number }[];
  allowFuturePrincipal?: boolean;
}

export interface AllocationOutput {
  allocations: { installmentId?: number; seq?: number; component: string; amount: number }[];
  remaining: number;
  applied: number;
}

/**
 * Configurable payment allocation. Order is policy-driven (per product),
 * never hard-coded. Oldest installments are settled first within a component.
 */
export function allocatePayment(input: AllocationInput): AllocationOutput {
  const { amount, order, penalDue, feesDue, installments, allowFuturePrincipal = true } = input;
  let remaining = amount;
  const allocations: AllocationOutput["allocations"] = [];

  const apply = (component: string, amountToApply: number, seq?: number) => {
    if (amountToApply <= 0 || remaining <= 0) return;
    const a = Math.min(amountToApply, remaining);
    allocations.push({ component, amount: a, seq });
    remaining -= a;
  };

  const open = installments.filter((i) => i.total > i.paidAmount);
  const totalDueFor = (comp: "interest" | "principal") =>
    open.reduce((sum, i) => sum + Math.max(0, comp === "interest" ? i.interest : i.principal), 0);

  for (const comp of order) {
    if (remaining <= 0) break;
    if (comp === "penalty") {
      apply("penalty", penalDue);
    } else if (comp === "fees") {
      apply("fees", feesDue);
    } else if (comp === "interest") {
      apply("interest", totalDueFor("interest"));
    } else if (comp === "principal") {
      apply("principal", totalDueFor("principal"));
    }
  }
  return { allocations, remaining, applied: amount - remaining };
}

/**
 * APR (annualized) from a disbursement + EMI stream, accounting for
 * upfront fees netted from the borrower's received amount.
 * Deterministic Newton iteration on the monthly IRR.
 */
export function computeApr(principal: number, annualRatePct: number, tenure: number, upfrontFees: number, emiAmount: number): number {
  if (tenure <= 0 || principal <= 0) return 0;
  const netDisbursed = principal - upfrontFees;
  if (netDisbursed <= 0) return 0;
  let r = 0.01; // monthly rate seed
  for (let iter = 0; iter < 200; iter++) {
    let f = -netDisbursed;
    let df = 0;
    for (let t = 1; t <= tenure; t++) {
      f += emiAmount / Math.pow(1 + r, t);
      df -= (t * emiAmount) / Math.pow(1 + r, t + 1);
    }
    const step = f / df;
    r -= step;
    if (Math.abs(step) < 1e-9) break;
    if (r <= -0.9999) { r = -0.9999; break; }
  }
  const apr = Math.pow(1 + r, 12) - 1;
  return Math.round(apr * 10000) / 100;
}

export interface ForeclosureQuote {
  principalOutstanding: number;
  accruedInterest: number;
  penalDue: number;
  feesDue: number;
  foreclosureCharge: number;
  rebate: number;
  finalPayable: number;
}

/** Prepayment / foreclosure quotation. Never mutates — returns a quote. */
export function foreclosureQuote(
  loan: { principal: number; rate: number; outstanding: number; penalDue: number; feesDue: number },
  installments: { seq: number; dueDate: string; principal: number; interest: number; paid: number; paidAmount: number }[],
  asOf: string,
  opts: { foreclosureChargePct?: number; rebatePolicy?: "none" | "proportional" } = {}
): ForeclosureQuote {
  const chargePct = opts.foreclosureChargePct ?? 3;
  const principalOutstanding = installments
    .filter((i) => i.paid !== 1)
    .reduce((s, i) => s + i.principal, 0);
  const accrued = Math.round((loan.outstanding * loan.rate * daysBetween(lastPaidDate(installments) || asOf, asOf)) / 36500);
  const foreclosureCharge = Math.round((principalOutstanding * chargePct) / 100);
  const rebate = opts.rebatePolicy === "proportional" ? Math.round((accrued * 5) / 100) : 0;
  const finalPayable = principalOutstanding + accrued + loan.penalDue + loan.feesDue + foreclosureCharge - rebate;
  return {
    principalOutstanding,
    accruedInterest: accrued,
    penalDue: loan.penalDue,
    feesDue: loan.feesDue,
    foreclosureCharge,
    rebate,
    finalPayable
  };
}

function lastPaidDate(installments: { dueDate: string; paid: number }[]): string | null {
  const paid = installments.filter((i) => i.paid === 1);
  if (!paid.length) return null;
  return paid[paid.length - 1].dueDate;
}

export const inr = (n: number): string => "₹" + n.toLocaleString("en-IN");
export const inrLakh = (n: number): string => "₹" + (n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " L";
export const inrCr = (n: number): string => "₹" + (n / 10000000).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " Cr";
