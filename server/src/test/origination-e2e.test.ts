import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createApp } from "../app.js";
import { q1 } from "../db/connection.js";

let server: Server;
let base = "";
let adminToken = "";

async function api(
  pathname: string,
  { method = "GET", token, journeyToken, body }: { method?: string; token?: string; journeyToken?: string; body?: unknown } = {}
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (journeyToken) headers["x-journey-token"] = journeyToken;

  const res = await fetch(base + "/api" + pathname, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const json: any = await res.json().catch(() => ({}));
  return { status: res.status, json, ok: res.ok };
}

before(async () => {
  const app = await createApp();
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 8787}`;

  const loginRes = await api("/auth/login", {
    method: "POST",
    body: { email: "admin@nexus.demo", password: "demo1234" }
  });
  adminToken = loginRes.json.token;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("E2E DIGITAL ORIGINATION: complete 16-step journey from mobile start to LMS loan ledger", async () => {
  const suffix = Math.floor(10000000 + Math.random() * 89999999).toString();
  const testMobile = "98" + suffix;

  // 1. Start journey with mobile
  const startRes = await api("/origination/mobile/start", {
    method: "POST",
    body: { mobile: testMobile, amount: 400000, tenure: 36, source: "digital" }
  });
  assert.equal(startRes.status, 200);
  assert.ok(startRes.json.journey_id);
  assert.equal(startRes.json.masked_mobile, "******" + testMobile.slice(-4));
  const journeyId = startRes.json.journey_id;
  const demoOtp = startRes.json.demo_otp || "123456";

  // 2. Verify OTP
  const verifyRes = await api("/origination/otp/verify", {
    method: "POST",
    body: { journey_id: journeyId, otp: demoOtp }
  });
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyRes.json.ok, true);
  assert.equal(verifyRes.json.status, "OTP_VERIFIED");

  // 3. Resume journey
  const resumeRes = await api("/origination/journey", { journeyToken: journeyId });
  assert.equal(resumeRes.status, 200);
  assert.ok(resumeRes.json.completed_steps.includes("otp"));

  // 4. Submit consents
  const consentRes = await api("/origination/consent", {
    method: "POST",
    journeyToken: journeyId,
    body: { categories: ["kyc", "pan", "bureau", "lender_matching"], agreed: true }
  });
  assert.equal(consentRes.status, 200);
  assert.equal(consentRes.json.ok, true);

  // 5. Update Profile
  const profileRes = await api("/origination/profile", {
    method: "PATCH",
    journeyToken: journeyId,
    body: {
      full_name: "Rahul Digitalson",
      dob: "1990-05-15",
      gender: "male",
      email: "rahul.digital@example.com",
      pan: "ABCDE1234F",
      address: "Flat 402, Green Meadows",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      employment_type: "salaried",
      employer_name: "Tech Solutions Pvt Ltd",
      monthly_income: 75000,
      annual_income: 900000,
      complete: true
    }
  });
  assert.equal(profileRes.status, 200);
  assert.equal(profileRes.json.ok, true);

  // 6. Verify KYC
  const kycRes = await api("/origination/kyc/verify", {
    method: "POST",
    journeyToken: journeyId,
    body: { type: "pan", pan: "ABCDE1234F", name: "Rahul Digitalson" }
  });
  assert.equal(kycRes.status, 200);
  assert.equal(kycRes.json.status, "verified");

  // 7. Upload Document
  const docRes = await api("/origination/documents", {
    method: "POST",
    journeyToken: journeyId,
    body: { category: "salary_slip", name: "Salary_Slip_May2026.pdf" }
  });
  assert.equal(docRes.status, 200);
  assert.equal(docRes.json.status, "verified");

  // 8. Credit Check
  const creditRes = await api("/origination/credit/check", {
    method: "POST",
    journeyToken: journeyId
  });
  assert.equal(creditRes.status, 200);
  assert.equal(creditRes.json.status, "completed");
  assert.ok(creditRes.json.score >= 600);

  // 9. Match Lenders
  const matchRes = await api("/origination/lenders/match", {
    method: "POST",
    journeyToken: journeyId
  });
  assert.equal(matchRes.status, 200);
  assert.ok(matchRes.json.offers.length > 0);
  const selectedOffer = matchRes.json.offers[0];

  // 10. Select Offer
  const selectRes = await api(`/origination/offers/${selectedOffer.lender_id}/select`, {
    method: "POST",
    journeyToken: journeyId
  });
  assert.equal(selectRes.status, 200);
  assert.equal(selectRes.json.ok, true);

  // 11. Submit Canonical Application
  const submitRes = await api("/origination/application/submit", {
    method: "POST",
    journeyToken: journeyId
  });
  assert.equal(submitRes.status, 200);
  assert.ok(submitRes.json.application_id);
  assert.ok(submitRes.json.application_no.startsWith("APP"));
  const canonicalAppId = submitRes.json.application_id;

  // 12. Retrieve Canonical Application status
  const appRes = await api("/origination/application", { journeyToken: journeyId });
  assert.equal(appRes.status, 200);
  assert.equal(appRes.json.application.source, "digital");

  // 13. Verify Application in Internal LOS API
  const internalApp = await api(`/applications/${canonicalAppId}`, { token: adminToken });
  assert.equal(internalApp.status, 200);
  assert.equal(internalApp.json.app.source, "digital");
  assert.equal(internalApp.json.app.customer_name, "Rahul Digitalson");

  // 14. Agreement generation
  const agreeRes = await api("/origination/agreement", {
    method: "POST",
    journeyToken: journeyId
  });
  assert.equal(agreeRes.status, 200);
  assert.equal(agreeRes.json.ok, true);

  // 15. E-Sign execution
  const esignRes = await api("/origination/esign/start", {
    method: "POST",
    journeyToken: journeyId
  });
  assert.equal(esignRes.status, 200);
  assert.equal(esignRes.json.status, "completed");

  // 16. Disbursement with Idempotency Key
  const idempotencyKey = `DISB-E2E-${Date.now()}`;
  const disbRes = await api("/origination/disbursement/request", {
    method: "POST",
    journeyToken: journeyId,
    body: {
      account_number: "9876543210001",
      ifsc: "HDFC0000060",
      beneficiary_name: "Rahul Digitalson",
      idempotency_key: idempotencyKey
    }
  });

  assert.equal(disbRes.status, 200);
  assert.equal(disbRes.json.status, "SUCCESS");
  assert.ok(disbRes.json.loan_no.startsWith("LN"));
  assert.ok(disbRes.json.utr.startsWith("UTR"));
  assert.equal(disbRes.json.is_duplicate, false);

  // Verify Loan in LMS via internal Loans API
  const lmsLoans = await api("/loans", { token: adminToken });
  assert.equal(lmsLoans.status, 200);
  const createdLoan = lmsLoans.json.rows.find((l: any) => l.application_id === canonicalAppId);
  assert.ok(createdLoan, "Loan must appear in canonical LMS loans list");
  assert.equal(createdLoan.loan_no, disbRes.json.loan_no);
});
