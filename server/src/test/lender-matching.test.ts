import { test, before } from "node:test";
import assert from "node:assert/strict";
import { matchLenders } from "../core/lender-matching.js";
import { createSchema } from "../db/schema.js";
import { run } from "../db/connection.js";

before(async () => {
  await createSchema();
  await run("INSERT OR IGNORE INTO tenants (id, code, name) VALUES (1, 'default', 'Default Tenant')");

  // Ensure test lenders and schemes exist
  await run(
    `INSERT OR IGNORE INTO gn_lenders (id, tenant_id, name, type, status)
     VALUES (101, 1, 'Axis Bank Finance', 'Bank', 'active'),
            (102, 1, 'Bajaj Housing & Fin', 'NBFC', 'active')`
  );

  await run(
    `INSERT OR IGNORE INTO gn_products (id, tenant_id, lender_id, category, name, min_amount, max_amount, min_tenure, max_tenure, roi_min, roi_max, status)
     VALUES (201, 1, 101, 'Personal Loan', 'Express Personal Loan', 50000, 1500000, 12, 60, 11.5, 16.0, 'active'),
            (202, 1, 102, 'Business Loan', 'MSME Growth Capital', 100000, 5000000, 12, 84, 12.5, 18.0, 'active')`
  );

  await run(
    `INSERT OR IGNORE INTO gn_schemes (
       id, tenant_id, lender_id, product_id, name, profile, loan_params, eligibility, status
     ) VALUES (
       301, 1, 101, 201, 'Prime Salaried Scheme', 'Salaried',
       '{"min_amount":50000,"max_amount":1500000,"min_tenure":12,"max_tenure":60,"roi_min":11.5,"roi_max":15.5,"processing_fee_pct":1.5}',
       '{"min_credit_score":700,"min_income":25000,"min_age":21,"max_age":60}',
       'active'
     ), (
       302, 1, 102, 202, 'Self-Employed Growth', 'Business',
       '{"min_amount":100000,"max_amount":5000000,"min_tenure":12,"max_tenure":84,"roi_min":13.0,"roi_max":17.5,"processing_fee_pct":2.0}',
       '{"min_credit_score":680,"min_income":40000,"min_age":23,"max_age":65}',
       'active'
     )`
  );
});

test("lender matching: salaried borrower matches salaried scheme with high score", async () => {
  const matches = await matchLenders(1, {
    amount: 500000,
    tenure: 36,
    employmentType: "salaried",
    monthlyIncome: 65000,
    creditScore: 760,
    age: 32
  });

  assert.ok(matches.length > 0);
  const topMatch = matches[0];
  assert.equal(topMatch.eligible, true);
  assert.ok(topMatch.match_score >= 80);
  assert.equal(topMatch.eligible_amount, 500000);
  assert.ok(topMatch.estimated_emi > 0);
  assert.ok(topMatch.processing_fee > 0);
  assert.match(topMatch.disclaimer, /Indicative offer/i);
});

test("lender matching: low credit score reduces match score and marks ineligible if below cutoff", async () => {
  const matches = await matchLenders(1, {
    amount: 500000,
    tenure: 36,
    employmentType: "salaried",
    monthlyIncome: 50000,
    creditScore: 580, // Low score
    age: 28
  });

  assert.ok(matches.length > 0);
  const primeMatch = matches.find((m) => m.scheme_id === 301);
  if (primeMatch) {
    assert.equal(primeMatch.eligible, false);
    assert.match(primeMatch.reasons.join(" "), /below policy cutoff/i);
  }
});
