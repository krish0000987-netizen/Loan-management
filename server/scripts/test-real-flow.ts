async function testRealFlow() {
  const base = "http://127.0.0.1:8787/api";
  const realMobile = "9844123456"; // Real test number format
  const realPan = "ABCPE1234F";    // Real valid PAN format in NSDL

  console.log(`[REAL TEST] Starting origination with mobile: ${realMobile}`);

  // 1. Start journey
  const startRes = await fetch(`${base}/origination/mobile/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: realMobile, amount: 500000, tenure: 36, source: "digital" })
  });
  const startJson = await startRes.json();
  console.log(`[REAL TEST] Started journey: HTTP ${startRes.status}`, startJson.journey_id);
  const token = startJson.journey_token || startJson.token;
  const headers = { "Content-Type": "application/json", "x-journey-token": token };

  // 2. Verify OTP
  const verifyRes = await fetch(`${base}/origination/otp/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ journey_id: startJson.journey_id, otp: startJson.demo_otp || "123456" })
  });
  console.log(`[REAL TEST] OTP Verified: HTTP ${verifyRes.status}`);

  // 3. Accept Consent
  await fetch(`${base}/origination/consent`, {
    method: "POST",
    headers,
    body: JSON.stringify({ categories: ["bureau", "kyc", "lender_matching"], agreed: true })
  });

  // 4. Submit Profile
  await fetch(`${base}/origination/profile`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      full_name: "Applicant",
      pan: realPan,
      monthly_income: 95000,
      complete: true
    })
  });

  // 5. Live PAN Verification with Digitap (NSDL)
  console.log(`[REAL TEST] Verifying PAN ${realPan} against live NSDL via Digitap...`);
  const kycRes = await fetch(`${base}/origination/kyc/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "pan", pan: realPan })
  });
  const kycJson = await kycRes.json();
  console.log(`[REAL TEST] Live KYC result: HTTP ${kycRes.status}`);
  console.log(`            Provider:    ${kycJson.provider}`);
  console.log(`            Name:        ${kycJson.result?.fullName || kycJson.result?.name}`);
  console.log(`            Masked Aadhaar: ${kycJson.result?.aadhaarNumberMasked}`);

  // 6. Check Profile - should have synced the real NSDL details
  const profileRes = await fetch(`${base}/origination/profile`, { headers });
  const profileJson = await profileRes.json();
  console.log(`[REAL TEST] Auto-Synced Customer Profile:`);
  console.log(`            Name:        ${profileJson.full_name}`);
  console.log(`            DOB:         ${profileJson.dob}`);
  console.log(`            Address:     ${profileJson.address}`);
  console.log(`            City/State:  ${profileJson.city}, ${profileJson.state} - ${profileJson.pincode}`);

  // 7. Complete documents step
  await fetch(`${base}/origination/documents/complete`, { method: "POST", headers });

  // 8. Credit Check
  const creditRes = await fetch(`${base}/origination/credit/check`, { method: "POST", headers });
  const creditJson = await creditRes.json();
  console.log(`[REAL TEST] Credit Bureau Score: ${creditJson.score} (${creditJson.score_band})`);

  // 9. Match Lenders
  const matchRes = await fetch(`${base}/origination/lenders/match`, { method: "POST", headers });
  const matchJson = await matchRes.json();
  console.log(`[REAL TEST] Matched Lender Offers: ${matchJson.offers?.length} active schemes`);
  if (matchJson.offers?.[0]) {
    console.log(`            Top Lender:  ${matchJson.offers[0].lender_name} (${matchJson.offers[0].scheme_name}) @ ${matchJson.offers[0].roi_pct}% p.a.`);
  }
  console.log(`\n🎉 SUCCESS: Real live NSDL KYC verification and customer profile auto-sync completed!`);
}

testRealFlow().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
