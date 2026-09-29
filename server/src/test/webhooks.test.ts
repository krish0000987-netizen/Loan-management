import { test, before } from "node:test";
import assert from "node:assert/strict";
import { processWebhookEvent, computePayloadHash } from "../core/webhook-handler.js";
import { createSchema } from "../db/schema.js";
import { run, q1 } from "../db/connection.js";

let testAppId: number;

before(async () => {
  await createSchema();
  await run("INSERT OR IGNORE INTO tenants (id, code, name) VALUES (1, 'default', 'Default Tenant')");

  const suffix = Date.now().toString().slice(-6);
  const custId = (await run(
    "INSERT INTO customers (tenant_id, customer_no, name, mobile) VALUES (1, ?, 'Webhook Test Customer', '9888888888')",
    [`CUST-WH-${suffix}`]
  )).lastId;

  const prod = await q1<{ id: number }>("SELECT id FROM products LIMIT 1");
  const prodId = prod?.id || (await run(
    "INSERT INTO products (tenant_id, code, name, category, min_amount, max_amount, min_tenure, max_tenure, interest_rate) VALUES (1, ?, 'Webhook Loan', 'personal', 50000, 1000000, 12, 36, 14.0)",
    [`WH-PROD-${suffix}`]
  )).lastId;

  testAppId = (await run(
    `INSERT INTO applications (tenant_id, application_no, customer_id, product_id, source, requested_amount, tenure, status, stage)
     VALUES (1, ?, ?, ?, 'digital', 200000, 24, 'in_progress', 'application')`,
    [`APP-WH-${suffix}`, custId, prodId]
  )).lastId;
});

test("webhook: processes UNDERWRITING_STARTED and advances stage", async () => {
  const payload = {
    event: "UNDERWRITING_STARTED",
    application_id: testAppId,
    timestamp: Date.now()
  };
  const rawBody = JSON.stringify(payload);
  const signature = computePayloadHash(rawBody);

  const res = await processWebhookEvent("partner_lender", rawBody, payload, {
    "x-webhook-signature": signature
  });

  assert.equal(res.ok, true);
  assert.equal(res.duplicate, false);

  const app = await q1<Record<string, any>>("SELECT stage FROM applications WHERE id = ?", [testAppId]);
  assert.equal(app?.stage, "underwriting");

  // Deduplication: re-sending the same webhook returns duplicate=true
  const dupRes = await processWebhookEvent("partner_lender", rawBody, payload, {
    "x-webhook-signature": signature
  });
  assert.equal(dupRes.ok, true);
  assert.equal(dupRes.duplicate, true);
});
