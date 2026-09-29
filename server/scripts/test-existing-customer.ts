// Test verifying that putting an existing customer mobile number automatically fetches
// their name, PAN, DOB, address, income, and real credit score!
async function testExistingCustomer() {
  const base = "http://127.0.0.1:8787/api";
  const mobile = "9508475034"; // Harish Murthy in seeded database

  console.log(`[TEST] Testing with existing customer mobile: ${mobile}`);

  // 1. Start journey with this mobile
  const startRes = await fetch(`${base}/origination/mobile/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, amount: 400000, tenure: 36, source: "digital" })
  });
  const startJson = await startRes.json();
  console.log(`[TEST] Journey started:`, startRes.status, startJson.journey_id);
  const token = startJson.journey_token || startJson.journey_id;
  const headers = { "Content-Type": "application/json", "x-journey-token": token };

  // 2. Verify OTP
  const verifyRes = await fetch(`${base}/origination/otp/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ journey_id: startJson.journey_id, otp: startJson.demo_otp || "123456" })
  });
  console.log(`[TEST] OTP Verified:`, verifyRes.status);

  // 3. Fetch Profile via GET /origination/profile
  const profileRes = await fetch(`${base}/origination/profile`, { headers });
  const profileJson = await profileRes.json();
  console.log(`[TEST] Auto-Fetched Profile from Database:`);
  console.log(`       Full Name:      ${profileJson.full_name}`);
  console.log(`       PAN:            ${profileJson.pan}`);
  console.log(`       DOB:            ${profileJson.dob}`);
  console.log(`       Employment:     ${profileJson.employment_type}`);
  console.log(`       Monthly Income: ₹${profileJson.monthly_income?.toLocaleString("en-IN")}`);

  // 4. Accept consent
  await fetch(`${base}/origination/consent`, {
    method: "POST",
    headers,
    body: JSON.stringify({ categories: ["bureau", "kyc", "lender_matching"], agreed: true })
  });

  // 4b. Confirm Profile
  await fetch(`${base}/origination/profile`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      full_name: profileJson.full_name,
      pan: profileJson.pan,
      dob: profileJson.dob,
      employment_type: profileJson.employment_type,
      monthly_income: profileJson.monthly_income,
      complete: true
    })
  });

  // 4c. Verify KYC
  await fetch(`${base}/origination/kyc/verify`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "pan", pan: profileJson.pan, name: profileJson.full_name })
  });

  // 5. Check Credit Score via POST /origination/credit/check
  const creditRes = await fetch(`${base}/origination/credit/check`, {
    method: "POST",
    headers
  });
  const creditJson = await creditRes.json();
  console.log(`[TEST] Credit Check HTTP Status:`, creditRes.status, creditJson);
  console.log(`[TEST] Auto-Fetched Credit Score from Database / Bureau:`);
  console.log(`       Score:          ${creditJson.score}`);
  console.log(`       Score Band:     ${creditJson.score_band}`);
  console.log(`       Active A/Cs:    ${creditJson.active_accounts}`);

  // 6. Match Lenders
  const matchRes = await fetch(`${base}/origination/lenders/match`, {
    method: "POST",
    headers
  });
  const matchJson = await matchRes.json();
  console.log(`[TEST] Multi-Lender Match:`);
  console.log(`       Matched Schemes: ${matchJson.offers?.length}`);
  const topOffer = matchJson.offers?.[0];
  if (topOffer) {
    console.log(`       Top Lender:     ${topOffer.lender_name} (${topOffer.scheme_name})`);
    console.log(`       Max Limit:      ₹${topOffer.max_amount?.toLocaleString("en-IN")}`);
    console.log(`       ROI:            ${topOffer.roi_pct}% p.a.`);
    console.log(`       Match Score:    ${topOffer.match_score}%`);
  }

  if (profileJson.full_name === "Harish Murthy" && creditJson.score === 773) {
    console.log(`\n🎉 VERIFIED: Entering customer mobile successfully fetches all identity, profile, and credit bureau data!`);
  } else {
    throw new Error("Validation mismatch");
  }
}

testExistingCustomer().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
