import { test, before } from "node:test";
import assert from "node:assert/strict";
import { canTransition, transitionJourney, STEP_MAP, ORIGINATION_STATES } from "../core/origination-state.js";
import { run, q1 } from "../db/connection.js";
import { createSchema } from "../db/schema.js";

before(async () => {
  await createSchema();
  // Ensure tenant 1 exists
  await run("INSERT OR IGNORE INTO tenants (id, code, name) VALUES (1, 'default', 'Default Tenant')");
});

test("canTransition: validates valid and invalid forward state transitions", () => {
  assert.equal(canTransition("MOBILE_ENTERED", "OTP_PENDING"), true);
  assert.equal(canTransition("OTP_PENDING", "OTP_VERIFIED"), true);
  assert.equal(canTransition("OTP_VERIFIED", "CONSENT_COMPLETED"), true);
  assert.equal(canTransition("CONSENT_COMPLETED", "PROFILE_COMPLETED"), true);
  assert.equal(canTransition("PROFILE_COMPLETED", "KYC_COMPLETED"), true);
  assert.equal(canTransition("KYC_COMPLETED", "CREDIT_COMPLETED"), true);
  assert.equal(canTransition("CREDIT_COMPLETED", "LENDER_MATCHED"), true);
  assert.equal(canTransition("LENDER_MATCHED", "OFFER_SELECTED"), true);
  assert.equal(canTransition("OFFER_SELECTED", "APPLICATION_SUBMITTED"), true);
  assert.equal(canTransition("APPLICATION_SUBMITTED", "UNDERWRITING"), true);
  assert.equal(canTransition("UNDERWRITING", "APPROVED"), true);
  assert.equal(canTransition("APPROVED", "SANCTIONED"), true);
  assert.equal(canTransition("SANCTIONED", "AGREEMENT_PENDING"), true);
  assert.equal(canTransition("AGREEMENT_PENDING", "ESIGN_COMPLETED"), true);
  assert.equal(canTransition("ESIGN_COMPLETED", "DISBURSEMENT_PENDING"), true);
  assert.equal(canTransition("DISBURSEMENT_PENDING", "DISBURSED"), true);

  // Invalid backward or jumping transitions
  assert.equal(canTransition("MOBILE_ENTERED", "DISBURSED"), false);
  assert.equal(canTransition("OTP_PENDING", "APPROVED"), false);
  assert.equal(canTransition("DISBURSED", "MOBILE_ENTERED"), false);
});

test("STEP_MAP: covers all origination states with friendly screen step identifiers", () => {
  for (const s of ORIGINATION_STATES) {
    assert.ok(STEP_MAP[s], `Missing step mapping for state: ${s}`);
  }
});

test("transitionJourney: updates database, step, and creates audit log", async () => {
  const token = `test_token_${Date.now()}`;
  const jId = (await run(
    `INSERT INTO origination_journeys (tenant_id, journey_token, mobile, current_step, status, expires_at)
     VALUES (1, ?, '9876543210', 'mobile', 'MOBILE_ENTERED', datetime('now', '+1 hour'))`,
    [token]
  )).lastId;

  const res = await transitionJourney({
    journeyId: jId,
    tenantId: 1,
    nextState: "OTP_PENDING",
    actor: "9876543210",
    actorType: "customer",
    metadata: { reason: "OTP sent" }
  });

  assert.equal(res.success, true);
  assert.equal(res.oldState, "MOBILE_ENTERED");
  assert.equal(res.newState, "OTP_PENDING");
  assert.equal(res.currentStep, "otp");

  const row = await q1<{ status: string; current_step: string }>("SELECT status, current_step FROM origination_journeys WHERE id = ?", [jId]);
  assert.equal(row?.status, "OTP_PENDING");
  assert.equal(row?.current_step, "otp");

  // Invalid transition throws error
  await assert.rejects(
    async () => {
      await transitionJourney({
        journeyId: jId,
        tenantId: 1,
        nextState: "DISBURSED"
      });
    },
    /Invalid state transition/
  );
});
