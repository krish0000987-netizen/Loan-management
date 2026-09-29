import { test, before } from "node:test";
import assert from "node:assert/strict";
import { requestDisbursement } from "../core/disbursement-orchestrator.js";
import { createSchema } from "../db/schema.js";
import { run, q1 } from "../db/connection.js";

let testAppId: number;

before(async () => {
  await createSchema();
  await run("INSERT OR IGNORE INTO tenants (id, code, name) VALUES (1, 'default', 'Default Tenant')");

  const rand = Math.floor(100000 + Math.random() * 900000);

  // Create test customer
  const custId = (await run(
    `INSERT INTO customers (tenant_id, customer_no, name, mobile, kyc_status)
     VALUES (1, ?, 'Disbursement Test User', '9899999999', 'verified')`,
    [`CUST-DISB-${rand}`]
  )).lastId;

  // Create test product
  const prodId = (await run(
    `INSERT INTO products (tenant_id, code, name, category, min_amount, max_amount, min_tenure, max_tenure, interest_rate)
     VALUES (1, ?, 'Test Personal Loan', 'personal', 50000, 1000000, 12, 60, 13.5)`,
    [`PL-TEST-${rand}`]
  )).lastId;

  // Create approved application
  testAppId = (await run(
    `INSERT INTO applications (
       tenant_id, application_no, customer_id, product_id, source, requested_amount, approved_amount,
       tenure, rate, status, stage, decision
     ) VALUES (1, ?, ?, ?, 'digital', 300000, 300000, 24, 13.5, 'approved', 'underwriting', 'approve')`,
    [`APP-DISB-${rand}`, custId, prodId]
  )).lastId;

  // Issue sanction
  await run(
    `INSERT INTO sanctions (application_id, sanction_no, amount, tenure, rate, emi, status)
     VALUES (?, ?, 300000, 24, 13.5, 14332, 'approved')`,
    [testAppId, `SNC-DISB-${rand}`]
  );

  // Sign agreement
  await run(
    `INSERT INTO agreements (application_id, template, status, signed_at, signer_name, hash)
     VALUES (?, 'digital_loan_agreement_v1', 'signed', datetime('now'), 'Disbursement Test User', 'SHA256:abcd')`,
    [testAppId]
  );
});

test("disbursement: creates canonical loan and schedule in LMS with UTR", async () => {
  const idempotencyKey = `DISB-KEY-${Date.now()}`;

  const res = await requestDisbursement({
    tenantId: 1,
    applicationId: testAppId,
    idempotencyKey,
    accountNumber: "50100293849182",
    ifsc: "HDFC0000060",
    beneficiaryName: "Disbursement Test User"
  });

  assert.equal(res.status, "SUCCESS");
  assert.equal(res.isDuplicate, false);
  assert.ok(res.loanId);
  assert.ok(res.loanNo?.startsWith("LN"));
  assert.ok(res.utr?.startsWith("UTR"));
  assert.equal(res.disbursedAmount, 300000);

  // Verify loan row in loans table
  const loan = await q1<Record<string, any>>("SELECT * FROM loans WHERE id = ?", [res.loanId]);
  assert.ok(loan);
  assert.equal(loan.principal, 300000);
  assert.equal(loan.status, "active");

  // Verify installments schedule in installments table
  const installments = await q1<{ count: number }>("SELECT COUNT(*) AS count FROM installments WHERE loan_id = ?", [res.loanId]);
  assert.equal(installments?.count, 24);

  // Verify application stage advanced to disbursement
  const app = await q1<Record<string, any>>("SELECT stage, status FROM applications WHERE id = ?", [testAppId]);
  assert.equal(app?.stage, "disbursement");

  // Test idempotency: repeated request returns existing transaction
  const repeatRes = await requestDisbursement({
    tenantId: 1,
    applicationId: testAppId,
    idempotencyKey,
    accountNumber: "50100293849182",
    ifsc: "HDFC0000060"
  });

  assert.equal(repeatRes.status, "SUCCESS");
  assert.equal(repeatRes.isDuplicate, true);
  assert.equal(repeatRes.transactionId, res.transactionId);
  assert.equal(repeatRes.loanId, res.loanId);
});
