// Comprehensive audit script testing all major API groups in SNIPER
async function auditAllApis() {
  const base = "http://127.0.0.1:8787/api";
  console.log("==================================================");
  console.log("   SNIPER COMPREHENSIVE API & DASHBOARD AUDIT     ");
  console.log("==================================================\n");

  const results: { category: string; endpoint: string; status: number; ok: boolean; summary: string }[] = [];

  async function check(category: string, endpoint: string, opts: { method?: string; token?: string; body?: any; journeyToken?: string } = {}) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
    if (opts.journeyToken) headers["x-journey-token"] = opts.journeyToken;

    try {
      const res = await fetch(base + endpoint, {
        method: opts.method || "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      const ok = res.status >= 200 && res.status < 300;
      const count = Array.isArray(data) ? data.length : data?.total ?? (data?.rows ? data.rows.length : (data?.offers ? data.offers.length : undefined));
      const summary = count !== undefined ? `count/total: ${count}` : (data?.status || data?.message || (ok ? "OK" : "Failed"));
      results.push({ category, endpoint, status: res.status, ok, summary });
      return { ok, status: res.status, data };
    } catch (err: any) {
      results.push({ category, endpoint, status: 0, ok: false, summary: err.message });
      return { ok: false, status: 0, data: null };
    }
  }

  // 1. Core Health & Auth
  await check("Core", "/health");
  const loginRes = await check("Auth", "/auth/login", {
    method: "POST",
    body: { email: "admin@nexus.demo", password: "demo1234" }
  });
  const adminToken = loginRes.data?.token;

  if (!adminToken) {
    console.error("Failed to obtain admin auth token. Aborting authenticated checks.");
    return;
  }

  // 2. Dashboards & Core LOS / LMS
  await check("Dashboard", "/dashboard", { token: adminToken });
  await check("LOS", "/applications", { token: adminToken });
  await check("LOS", "/applications?source=digital", { token: adminToken });
  await check("LOS", "/products", { token: adminToken });
  await check("LOS", "/customers", { token: adminToken });
  await check("LOS", "/leads", { token: adminToken });
  await check("LMS", "/loans", { token: adminToken });
  await check("LMS", "/payments", { token: adminToken });
  await check("Collections", "/collections/queue", { token: adminToken });
  await check("Collections", "/collections/dashboard", { token: adminToken });
  await check("Compliance", "/admin/compliance", { token: adminToken });
  await check("Audit", "/admin/audit", { token: adminToken });

  // 3. Growth Nations (GN) Disbursement & Pipeline
  await check("GN", "/gn/dashboard", { token: adminToken });
  await check("GN", "/gn/applications", { token: adminToken });
  await check("GN", "/gn/applications?status=disb_confirmed", { token: adminToken });
  await check("GN", "/gn/applications?stage=lead", { token: adminToken });
  await check("GN", "/gn/lenders", { token: adminToken });
  await check("GN", "/gn/schemes", { token: adminToken });
  await check("GN", "/gn/finance/income", { token: adminToken });
  await check("GN", "/gn/finance/receivable", { token: adminToken });
  await check("GN", "/gn/finance/payouts", { token: adminToken });

  // 4. Digital Origination Flow (Customer Payout & Disbursement Engine)
  const testMobile = "98" + Math.floor(10000000 + Math.random() * 89999999);
  const start = await check("Origination", "/origination/mobile/start", {
    method: "POST",
    body: { mobile: testMobile, amount: 250000, tenure: 24, source: "digital" }
  });
  const journeyId = start.data?.journey_id;
  const journeyToken = start.data?.journey_token || journeyId;
  const demoOtp = start.data?.demo_otp || "123456";

  if (journeyToken) {
    await check("Origination", "/origination/otp/verify", {
      method: "POST",
      journeyToken,
      body: { journey_id: journeyId, otp: demoOtp }
    });
    await check("Origination", "/origination/journey", { journeyToken });
    await check("Origination", "/origination/consent", {
      method: "POST",
      journeyToken,
      body: { categories: ["kyc", "bureau", "lender_matching"], agreed: true }
    });
    await check("Origination", "/origination/profile", {
      method: "PATCH",
      journeyToken,
      body: {
        full_name: "Audit User",
        pan: "ABCDE1234F",
        email: "audit.user@example.com",
        address: "Marine Lines",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400020",
        monthly_income: 90000,
        complete: true
      }
    });
    await check("Origination", "/origination/kyc/verify", {
      method: "POST",
      journeyToken,
      body: { type: "pan", pan: "ABCDE1234F", name: "Audit User" }
    });
    await check("Origination", "/origination/documents", {
      method: "POST",
      journeyToken,
      body: { category: "salary_slip", name: "Salary_Slip.pdf" }
    });
    await check("Origination", "/origination/credit/check", { method: "POST", journeyToken });
    const match = await check("Origination", "/origination/lenders/match", { method: "POST", journeyToken });
    const firstOffer = match.data?.offers?.[0];
    if (firstOffer) {
      await check("Origination", `/origination/offers/${firstOffer.lender_id}/select`, { method: "POST", journeyToken });
    }
    const appSubmit = await check("Origination", "/origination/application/submit", { method: "POST", journeyToken });
    const appId = appSubmit.data?.application_id;

    if (appId) {
      await check("Origination", "/origination/application", { journeyToken });
      await check("LOS Workspace", `/applications/${appId}`, { token: adminToken });
    }

    await check("Origination", "/origination/agreement", { method: "POST", journeyToken });
    await check("Origination", "/origination/esign/start", { method: "POST", journeyToken });
    await check("Origination", "/origination/esign/status", { journeyToken });

    // Instant Disbursement Trigger
    const disb = await check("Origination", "/origination/disbursement/request", {
      method: "POST",
      journeyToken,
      body: {
        account_number: "9876543210001",
        ifsc: "HDFC0000060",
        beneficiary_name: "Audit User",
        idempotency_key: `DISB-AUDIT-${Date.now()}`
      }
    });
    await check("Origination", "/origination/disbursement/status", { journeyToken });

    if (disb.data?.loan_no) {
      const loanCheck = await check("LMS", "/loans", { token: adminToken });
      const found = loanCheck.data?.rows?.find((l: any) => l.loan_no === disb.data.loan_no);
      console.log(`\n[LMS VERIFICATION] Created loan ${disb.data.loan_no} verified in LMS: ${!!found}`);
    }
  }

  console.log("\n==================================================");
  console.log("              AUDIT RESULTS TABLE                 ");
  console.log("==================================================");
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.ok ? "✔" : "✖";
    if (r.ok) passed++; else failed++;
    console.log(`${icon} [${r.category.padEnd(14)}] ${r.endpoint.padEnd(42)} ${r.status} (${r.summary})`);
  }
  console.log("==================================================");
  console.log(`TOTAL ENDPOINTS TESTED: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

auditAllApis().catch((err) => {
  console.error("FATAL ERROR IN API AUDIT:", err);
  process.exit(1);
});
