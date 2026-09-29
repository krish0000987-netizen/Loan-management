// Verification script testing all origination endpoints through the Vite dev proxy
async function runSmoke() {
  const base = "http://127.0.0.1:5173/api";
  const mobile = "98" + Math.floor(10000000 + Math.random() * 89999999);
  console.log(`[TEST] 1. Starting journey for mobile: ${mobile}`);

  const startRes = await fetch(`${base}/origination/mobile/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, amount: 350000, tenure: 36, source: "digital" })
  });
  const startJson = await startRes.json();
  console.log(`[TEST] Start Response:`, startRes.status, startJson);
  const journeyId = startJson.journey_id;
  const token = startJson.journey_token || startJson.journey_id;
  const headers = { "Content-Type": "application/json", "x-journey-token": token };

  console.log(`[TEST] 2. Verifying OTP`);
  const verifyRes = await fetch(`${base}/origination/otp/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ journey_id: journeyId, otp: startJson.demo_otp || "123456" })
  });
  console.log(`[TEST] Verify Response:`, verifyRes.status, await verifyRes.json());

  console.log(`[TEST] 3. Recording Consents`);
  const consentRes = await fetch(`${base}/origination/consent`, {
    method: "POST",
    headers,
    body: JSON.stringify({ categories: ["bureau", "kyc", "lender_matching", "comms"], agreed: true })
  });
  console.log(`[TEST] Consent Response:`, consentRes.status, await consentRes.json());

  console.log(`[TEST] 4. Updating Profile`);
  const profileRes = await fetch(`${base}/origination/profile`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      full_name: "Aman Gupta",
      dob: "1988-04-12",
      gender: "male",
      email: "aman.gupta@example.com",
      pan: "ABCDE1234F",
      address: "102 Sky Tower, Powai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400076",
      employment_type: "salaried",
      employer_name: "Boat Lifestyle",
      monthly_income: 120000,
      annual_income: 1440000,
      complete: true
    })
  });
  console.log(`[TEST] Profile Response:`, profileRes.status, await profileRes.json());

  console.log(`[TEST] 5. Verifying KYC`);
  const kycRes = await fetch(`${base}/origination/kyc/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "pan", pan: "ABCDE1234F", name: "Aman Gupta" })
  });
  console.log(`[TEST] KYC Response:`, kycRes.status, await kycRes.json());

  console.log(`[TEST] 6. Uploading Document`);
  const docRes = await fetch(`${base}/origination/documents`, {
    method: "POST",
    headers,
    body: JSON.stringify({ category: "salary_slip", name: "Salary_Slip_May2026.pdf" })
  });
  console.log(`[TEST] Document Response:`, docRes.status, await docRes.json());

  console.log(`[TEST] 7. Checking Bureau Credit`);
  const creditRes = await fetch(`${base}/origination/credit/check`, {
    method: "POST",
    headers
  });
  const creditJson = await creditRes.json();
  console.log(`[TEST] Credit Response:`, creditRes.status, creditJson);

  console.log(`[TEST] 8. Matching Lenders`);
  const matchRes = await fetch(`${base}/origination/lenders/match`, {
    method: "POST",
    headers
  });
  const matchJson = await matchRes.json();
  console.log(`[TEST] Match Response: ${matchRes.status}, count: ${matchJson.offers?.length}`);
  const selectedOffer = matchJson.offers[0];

  console.log(`[TEST] 9. Selecting Offer (Lender ID: ${selectedOffer.lender_id})`);
  const selectRes = await fetch(`${base}/origination/offers/${selectedOffer.lender_id}/select`, {
    method: "POST",
    headers
  });
  console.log(`[TEST] Select Response:`, selectRes.status, await selectRes.json());

  console.log(`[TEST] 10. Submitting Canonical Application`);
  const submitRes = await fetch(`${base}/origination/application/submit`, {
    method: "POST",
    headers
  });
  const submitJson = await submitRes.json();
  console.log(`[TEST] Submit Response:`, submitRes.status, submitJson);
  const appId = submitJson.application_id;

  console.log(`[TEST] 11. Drafting Agreement`);
  const agreeRes = await fetch(`${base}/origination/agreement`, {
    method: "POST",
    headers
  });
  console.log(`[TEST] Agreement Response:`, agreeRes.status, await agreeRes.json());

  console.log(`[TEST] 12. E-Signing Agreement`);
  const esignRes = await fetch(`${base}/origination/esign/start`, {
    method: "POST",
    headers
  });
  console.log(`[TEST] E-Sign Response:`, esignRes.status, await esignRes.json());

  console.log(`[TEST] 13. Requesting Instant Disbursement`);
  const disbRes = await fetch(`${base}/origination/disbursement/request`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      account_number: "9876543210001",
      ifsc: "HDFC0000060",
      beneficiary_name: "Aman Gupta",
      idempotency_key: `DISB-LIVE-${Date.now()}`
    })
  });
  const disbJson = await disbRes.json();
  console.log(`[TEST] Disbursement Response:`, disbRes.status, disbJson);

  console.log(`[TEST] 14. Verifying Application in Canonical LOS`);
  const loginRes = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@nexus.demo", password: "demo1234" })
  });
  const adminToken = (await loginRes.json()).token;

  const appCheck = await fetch(`${base}/applications/${appId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const appCheckJson = await appCheck.json();
  console.log(`[TEST] Internal LOS Application: ${appCheckJson.app?.application_no}, source: ${appCheckJson.app?.source}, customer: ${appCheckJson.app?.customer_name}`);
  console.log(`[TEST] Digital Journey in LOS: linked=${!!appCheckJson.originationJourney}, matches=${appCheckJson.lenderMatches?.length}`);

  const loansCheck = await fetch(`${base}/loans`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const loansJson = await loansCheck.json();
  const createdLoan = loansJson.rows.find((l: any) => l.application_id === appId);
  console.log(`[TEST] Canonical LMS Loan Check: loan_no=${createdLoan?.loan_no}, status=${createdLoan?.status}, principal=${createdLoan?.principal}`);

  if (createdLoan && disbJson.status === "SUCCESS") {
    console.log(`\n🎉 SUCCESS! FULL DIGITAL ORIGINATION ENGINE VERIFIED END-TO-END!`);
  } else {
    throw new Error("Failed validation");
  }
}

runSmoke().catch((e) => {
  console.error("SMOKE TEST FAILED:", e);
  process.exit(1);
});
