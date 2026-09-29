/**
 * Multi-Lender Matching Engine for SNIPER Digital Origination.
 * Evaluates borrower attributes against active lender master policies and schemes.
 * A match is an indicative pre-qualification, NOT a guaranteed approval.
 */

import { q, q1 } from "../db/connection.js";
import { computeEmi } from "./finance.js";

export interface BorrowerCriteria {
  amount: number;
  tenure: number;
  loanType?: string;
  category?: string;
  age?: number | null;
  monthlyIncome?: number | null;
  annualTurnover?: number | null;
  businessVintageYears?: number | null;
  employmentType?: string | null;
  creditScore?: number | null;
  state?: string | null;
  city?: string | null;
  foir?: number | null;
}

export interface LenderMatchResult {
  lender_id: number;
  lender_name: string;
  lender_type: string;
  scheme_id?: number;
  scheme_name?: string;
  product_id?: number;
  product_name?: string;
  eligible: boolean;
  match_score: number;
  eligible_amount: number;
  rate_from: number;
  rate_to: number;
  tenure_from: number;
  tenure_to: number;
  estimated_emi: number;
  processing_fee: number;
  status: "matched" | "conditional" | "not_eligible";
  reasons: string[];
  conditions: string[];
  disclaimer: string;
}

export async function matchLenders(
  tenantId: number,
  criteria: BorrowerCriteria
): Promise<LenderMatchResult[]> {
  const reqAmount = criteria.amount || 200000;
  const reqTenure = criteria.tenure || 36;
  const score = criteria.creditScore || 720;
  const income = criteria.monthlyIncome || 35000;
  const empType = (criteria.employmentType || "salaried").toLowerCase();
  const state = (criteria.state || "").trim().toLowerCase();

  // Query active lenders from the lender master
  const lenders = await q<Record<string, any>>(
    `SELECT l.id, l.name, l.type, l.status, l.api_status
     FROM gn_lenders l
     WHERE l.tenant_id = ? AND l.status = 'active'
     ORDER BY l.id`,
    [tenantId]
  );

  if (!lenders || lenders.length === 0) {
    return [];
  }

  const results: LenderMatchResult[] = [];

  for (const lender of lenders) {
    // Find schemes for this lender
    const schemes = await q<Record<string, any>>(
      `SELECT s.*, p.category, p.name AS product_name, p.min_amount AS p_min_amount, p.max_amount AS p_max_amount,
              p.min_tenure AS p_min_tenure, p.max_tenure AS p_max_tenure, p.roi_min AS p_roi_min, p.roi_max AS p_roi_max
       FROM gn_schemes s
       JOIN gn_products p ON p.id = s.product_id
       WHERE s.lender_id = ? AND s.tenant_id = ? AND s.status = 'active'`,
      [lender.id, tenantId]
    );

    const candidates = schemes.length > 0 ? schemes : [
      {
        id: null,
        name: `${lender.name} Standard Term`,
        product_id: null,
        product_name: "Standard Digital Loan",
        category: criteria.category || "Personal Loan",
        loan_params: JSON.stringify({
          min_amount: 50000,
          max_amount: 2500000,
          min_tenure: 12,
          max_tenure: 60,
          roi_min: 11.5,
          roi_max: 18.0,
          processing_fee_pct: 1.5
        }),
        eligibility: JSON.stringify({
          min_age: 21,
          max_age: 60,
          min_income: 20000,
          min_credit_score: 650,
          max_foir: 60
        }),
        profile: "Both",
        states: "[]"
      }
    ];

    for (const scheme of candidates) {
      let loanParams: Record<string, any> = {};
      let eligibility: Record<string, any> = {};
      let allowedStates: string[] = [];

      try { loanParams = typeof scheme.loan_params === "string" ? JSON.parse(scheme.loan_params) : scheme.loan_params || {}; } catch {}
      try { eligibility = typeof scheme.eligibility === "string" ? JSON.parse(scheme.eligibility) : scheme.eligibility || {}; } catch {}
      try { allowedStates = typeof scheme.states === "string" ? JSON.parse(scheme.states) : scheme.states || []; } catch {}

      const minAmt = loanParams.min_amount || scheme.p_min_amount || 50000;
      const maxAmt = loanParams.max_amount || scheme.p_max_amount || 2000000;
      const minTen = loanParams.min_tenure || scheme.p_min_tenure || 12;
      const maxTen = loanParams.max_tenure || scheme.p_max_tenure || 60;
      const rateFrom = loanParams.roi_min || scheme.p_roi_min || 11.0;
      const rateTo = loanParams.roi_max || scheme.p_roi_max || 16.5;
      const feePct = loanParams.processing_fee_pct || 1.5;

      const minScore = eligibility.min_credit_score || 650;
      const minInc = eligibility.min_income || 20000;
      const minAge = eligibility.min_age || 21;
      const maxAge = eligibility.max_age || 65;
      const maxFoir = eligibility.max_foir || 60;

      const reasons: string[] = [];
      const blockers: string[] = [];
      let scoreWeight = 100;

      // 1. Amount check
      if (reqAmount < minAmt) {
        blockers.push(`Requested amount ₹${reqAmount.toLocaleString("en-IN")} is below lender minimum of ₹${minAmt.toLocaleString("en-IN")}`);
      } else if (reqAmount > maxAmt) {
        scoreWeight -= 20;
        reasons.push(`Offer capped at lender limit of ₹${maxAmt.toLocaleString("en-IN")}`);
      } else {
        reasons.push("Requested amount within lender band");
      }

      // 2. Credit score check
      if (score < minScore) {
        scoreWeight -= 40;
        blockers.push(`Bureau score ${score} is below policy cutoff of ${minScore}`);
      } else {
        const scoreDiff = score - minScore;
        scoreWeight += Math.min(10, Math.floor(scoreDiff / 20));
        reasons.push(`Credit score meets criteria (Cutoff: ${minScore})`);
      }

      // 3. Income check
      if (income < minInc) {
        scoreWeight -= 30;
        blockers.push(`Monthly income ₹${income.toLocaleString("en-IN")} is below minimum ₹${minInc.toLocaleString("en-IN")}`);
      } else {
        reasons.push("Income criteria verified");
      }

      // 4. Age check
      if (criteria.age != null) {
        if (criteria.age < minAge || criteria.age > maxAge) {
          blockers.push(`Applicant age (${criteria.age}) must be between ${minAge} and ${maxAge} years`);
        }
      }

      // 5. State / Geography check
      if (allowedStates.length > 0 && state) {
        const stateMatch = allowedStates.some((s) => s.toLowerCase() === state);
        if (!stateMatch) {
          scoreWeight -= 25;
          blockers.push(`Geography ${criteria.state} is outside standard serviceable territory`);
        } else {
          reasons.push(`Serviceable in ${criteria.state}`);
        }
      }

      // 6. Employment type check
      const profile = (scheme.profile || "Both").toLowerCase();
      if (profile !== "both") {
        if (empType === "salaried" && !profile.includes("salaried")) {
          scoreWeight -= 30;
          blockers.push("Scheme target: Self-Employed / Business only");
        } else if (empType !== "salaried" && profile.includes("salaried") && !profile.includes("self")) {
          scoreWeight -= 30;
          blockers.push("Scheme target: Salaried borrowers only");
        }
      }

      const isEligible = blockers.length === 0;
      const finalScore = Math.max(20, Math.min(98, Math.round(scoreWeight)));
      const approvedAmt = Math.min(reqAmount, maxAmt);
      const tenureChoice = Math.min(Math.max(reqTenure, minTen), maxTen);
      const midRate = Math.round(((rateFrom + rateTo) / 2) * 10) / 10;
      const estEmi = computeEmi(approvedAmt, midRate, tenureChoice);
      const fee = Math.round((approvedAmt * feePct) / 100);

      results.push({
        lender_id: lender.id,
        lender_name: lender.name,
        lender_type: lender.type || "Bank",
        scheme_id: scheme.id || undefined,
        scheme_name: scheme.name,
        product_id: scheme.product_id || undefined,
        product_name: scheme.product_name,
        eligible: isEligible,
        match_score: isEligible ? finalScore : Math.min(50, finalScore),
        eligible_amount: approvedAmt,
        rate_from: rateFrom,
        rate_to: rateTo,
        tenure_from: minTen,
        tenure_to: maxTen,
        estimated_emi: estEmi,
        processing_fee: fee,
        status: isEligible ? "matched" : blockers.length === 1 ? "conditional" : "not_eligible",
        reasons: isEligible ? reasons : blockers,
        conditions: [
          "Subject to complete document verification",
          "Final interest rate determined during underwriting",
          "Disbursement conditioned on signed loan agreement and eSign"
        ],
        disclaimer: "Indicative offer subject to lender approval. Final terms subject to underwriting."
      });
    }
  }

  // Sort: eligible first, then highest match score
  return results.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.match_score - a.match_score;
  });
}
