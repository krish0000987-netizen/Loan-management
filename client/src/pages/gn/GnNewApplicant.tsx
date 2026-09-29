import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader, Field } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";
import { Badge } from "../../components/ui";
import { CheckCircle2, ChevronLeft, ChevronRight, Send, ShieldCheck, Database, GitCompare, FileText, Rocket, Loader2 } from "lucide-react";

const STEPS = ["Mobile & Requirement", "OTP", "Consent", "Profile", "Financials", "Credit", "Lender Match", "Application", "Submit", "Lender Journey", "Done"];

const LOAN_TYPES = ["Personal Loan", "Business Loan", "Home Loan", "Loan Against Property", "Vehicle Loan", "Equipment Loan", "Working Capital"];

export function GnNewApplicant() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [otp, setOtp] = useState("123456");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    mobile: "", loan_type: "Business Loan", loan_amount: 2500000, tenure: 48, purpose: "",
    name: "", dob: "", gender: "Male", email: "", pan: "", city: "", state: "", pincode: "",
    applicant_type: "Individual", employment_type: "Self-employed",
    employer: "", designation: "", monthly_income: 150000, business_name: "", business_type: "", business_vintage: 3, annual_turnover: 24000000,
    gst: "", udyam: "", existing_emi: 0, bank_name: "HDFC Bank", bank_account: ""
  });

  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const refreshDetail = async (id: number) => {
    const r = await api(`/gn/co/applicants/${id}`);
    setDetail(r);
    setApplicant(r.applicant);
    return r;
  };

  const run = async (label: string, fn: () => Promise<any>) => {
    setBusy(true); setMsg(null);
    try { return await fn(); }
    catch (e: any) { setMsg(e.message ?? "Action failed"); return null; }
    finally { setBusy(false); }
  };

  const createAndSend = async () => {
    await run("create", async () => {
      const a = await api("/gn/co/applicants", {
        method: "POST",
        body: { name: form.name || "New Applicant", mobile: form.mobile, loan_type: form.loan_type, loan_amount: Number(form.loan_amount), tenure: Number(form.tenure) || 12, purpose: form.purpose || "Business requirement", source: "command_center" }
      });
      setApplicant(a);
      await api(`/gn/co/applicants/${a.id}/otp`, { method: "POST", body: { action: "send" } });
      await refreshDetail(a.id);
      setStep(1);
    });
  };

  const verifyOtp = async () => {
    const ok = await run("otp", async () => {
      await api(`/gn/co/applicants/${applicant.id}/otp`, { method: "POST", body: { action: "verify", otp } });
      await refreshDetail(applicant.id);
      setStep(2);
    });
    return ok;
  };

  const grantConsent = async () => {
    await run("consent", async () => {
      await api(`/gn/co/applicants/${applicant.id}/consent`, { method: "POST", body: {} });
      await refreshDetail(applicant.id);
      setStep(3);
    });
  };

  const saveProfile = async () => {
    await run("profile", async () => {
      await api(`/gn/co/applicants/${applicant.id}`, {
        method: "PATCH",
        body: {
          name: form.name, dob: form.dob || null, gender: form.gender, email: form.email || null, pan: form.pan || null,
          city: form.city || null, state: form.state || null, pincode: form.pincode || null, applicant_type: form.applicant_type,
          employment_type: form.employment_type, employer: form.employer || null, designation: form.designation || null,
          business_name: form.business_name || null, business_type: form.business_type || null, business_vintage: Number(form.business_vintage) || null,
          gst: form.gst || null, udyam: form.udyam || null, bank_name: form.bank_name || null, bank_account: form.bank_account || null
        }
      });
      await refreshDetail(applicant.id);
      setStep(4);
    });
  };

  const saveFinancials = async () => {
    await run("financials", async () => {
      await api(`/gn/co/applicants/${applicant.id}`, {
        method: "PATCH",
        body: { monthly_income: Number(form.monthly_income) || null, annual_turnover: Number(form.annual_turnover) || null, existing_emi: Number(form.existing_emi) || 0 }
      });
      await refreshDetail(applicant.id);
      setStep(5);
    });
  };

  const runCredit = async () => {
    await run("credit", async () => {
      await api(`/gn/co/applicants/${applicant.id}/credit`, { method: "POST", body: {} });
      await refreshDetail(applicant.id);
      setStep(6);
    });
  };

  const runMatch = async () => {
    await run("match", async () => {
      await api(`/gn/co/applicants/${applicant.id}/match`, { method: "POST", body: {} });
      const r = await refreshDetail(applicant.id);
      const best = r.matches?.find((m: any) => m.status === "eligible") ?? r.matches?.[0];
      if (best) setSelectedMatch(best.id);
      setStep(7);
    });
  };

  const createApp = async () => {
    await run("apply", async () => {
      await api(`/gn/co/applicants/${applicant.id}/apply`, { method: "POST", body: { match_id: selectedMatch, amount: Number(form.loan_amount), tenure: Number(form.tenure) } });
      await api(`/gn/co/applicants/${applicant.id}/docs-complete`, { method: "POST", body: {} });
      await refreshDetail(applicant.id);
      setStep(8);
    });
  };

  const submit = async () => {
    await run("submit", async () => {
      await api(`/gn/co/applicants/${applicant.id}/submit`, { method: "POST", body: {} });
      await refreshDetail(applicant.id);
      setStep(9);
    });
  };

  const lender = async (action: string, amount?: number) => {
    await run(action, async () => {
      await api(`/gn/co/applicants/${applicant.id}/lender`, { method: "POST", body: { action, amount } });
      await refreshDetail(applicant.id);
    });
  };

  const finish = async () => {
    await run("finish", async () => {
      await api(`/gn/co/applicants/${applicant.id}/lender`, { method: "POST", body: { action: "payout" } });
      await refreshDetail(applicant.id);
      setStep(10);
    });
  };

  const app = detail?.applications?.[0];
  const appStatus = app?.status;

  const input = "input text-[12.5px]";

  return (
    <div className="space-y-5">
      <PageHeader
        title="New Applicant"
        sub="Guided loan origination — mobile → OTP → consent → profile → KYC → credit → lender match → application → disbursement"
        breadcrumb="Growth Nations / Command Center / New Applicant"
        actions={<Link to="/gn/co/applicants" className="btn btn-secondary text-[12px]">Back to Applicants</Link>}
      />

      <div className="flex items-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-semibold ${i === step ? "bg-brand-600 text-white" : i < step ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-50 text-zinc-400 border border-zinc-100"}`}>
              {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current text-center leading-3">{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="w-2 h-px bg-zinc-200" />}
          </div>
        ))}
      </div>

      {msg && <div className="text-[12px] font-semibold text-rose-600">{msg}</div>}

      <Card>
        {/* STEP 0 — Mobile & Requirement */}
        {step === 0 && (
          <div className="space-y-4">
            <StepTitle n={1} title="Mobile Number & Loan Requirement" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Mobile Number">
                <input className={input} placeholder="10-digit mobile" value={form.mobile} onChange={(e) => f("mobile", e.target.value)} />
              </Field>
              <Field label="Loan Type">
                <select className={input} value={form.loan_type} onChange={(e) => f("loan_type", e.target.value)}>
                  {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Loan Amount (₹)">
                <input type="number" className={input} value={form.loan_amount} onChange={(e) => f("loan_amount", e.target.value)} />
              </Field>
              <Field label="Tenure (months)">
                <input type="number" className={input} value={form.tenure} onChange={(e) => f("tenure", e.target.value)} />
              </Field>
              <Field label="Purpose">
                <input className={input} value={form.purpose} onChange={(e) => f("purpose", e.target.value)} placeholder="e.g. Working capital expansion" />
              </Field>
            </div>
            <div className="text-[10.5px] text-zinc-400">Demo mode: OTP 123456 · no real SMS is sent</div>
            <button className="btn btn-primary text-[12px]" disabled={busy || form.mobile.length < 10} onClick={createAndSend}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}Create Applicant & Send OTP
            </button>
          </div>
        )}

        {/* STEP 1 — OTP */}
        {step === 1 && (
          <div className="space-y-4 max-w-md">
            <StepTitle n={2} title="OTP Verification" />
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-semibold text-amber-700">Demo OTP: 123456</div>
            <Field label="Enter OTP">
              <input className={input} value={otp} onChange={(e) => setOtp(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <button className="btn btn-primary text-[12px]" disabled={busy} onClick={verifyOtp}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Verify OTP</button>
              <button className="btn btn-secondary text-[12px]" onClick={() => api(`/gn/co/applicants/${applicant.id}/otp`, { method: "POST", body: { action: "send" } })}>Resend OTP</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Consent */}
        {step === 2 && (
          <div className="space-y-4 max-w-2xl">
            <StepTitle n={3} title="Customer Consent" />
            <div className="rounded-xl border border-zinc-200 p-4 text-[12px] text-zinc-600 space-y-2">
              <div><span className="font-bold text-zinc-800">Purpose of data collection:</span> processing of this loan application, KYC verification, credit information, lender sharing and communication.</div>
              <div><span className="font-bold text-zinc-800">Lender sharing:</span> your information will be shared with matched lenders solely to assess and process this application.</div>
              <div className="text-amber-600 text-[10.5px] font-semibold">Consent is never pre-checked. In production use the consent wording approved for the applicable regulated arrangement.</div>
            </div>
            <label className="flex items-start gap-2 text-[12px] text-zinc-700 cursor-pointer">
              <input type="checkbox" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} className="mt-0.5" />
              <span>I agree to the applicable terms and consent to processing of my information for the stated purpose.</span>
            </label>
            <label className="flex items-start gap-2 text-[12px] text-zinc-700 cursor-pointer">
              <input type="checkbox" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} className="mt-0.5" />
              <span>I consent to my information being shared with matched lenders for loan assessment.</span>
            </label>
            <button className="btn btn-primary text-[12px]" disabled={busy || !consent1 || !consent2} onClick={grantConsent}><ShieldCheck className="w-3.5 h-3.5 mr-1" />Continue</button>
          </div>
        )}

        {/* STEP 3 — Profile */}
        {step === 3 && (
          <div className="space-y-4">
            <StepTitle n={4} title="Basic Profile & KYC Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Full Name"><input className={input} value={form.name} onChange={(e) => f("name", e.target.value)} /></Field>
              <Field label="Date of Birth"><input type="date" className={input} value={form.dob} onChange={(e) => f("dob", e.target.value)} /></Field>
              <Field label="Gender">
                <select className={input} value={form.gender} onChange={(e) => f("gender", e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select>
              </Field>
              <Field label="Email"><input className={input} value={form.email} onChange={(e) => f("email", e.target.value)} /></Field>
              <Field label="PAN"><input className={input} value={form.pan} onChange={(e) => f("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" /></Field>
              <Field label="Applicant Type">
                <select className={input} value={form.applicant_type} onChange={(e) => f("applicant_type", e.target.value)}>
                  {["Individual", "Company", "Partnership", "Proprietorship"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Employment Type">
                <select className={input} value={form.employment_type} onChange={(e) => f("employment_type", e.target.value)}>
                  {["Salaried", "Self-employed", "Business Owner"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="City"><input className={input} value={form.city} onChange={(e) => f("city", e.target.value)} /></Field>
              <Field label="State"><input className={input} value={form.state} onChange={(e) => f("state", e.target.value)} /></Field>
              <Field label="Pincode"><input className={input} value={form.pincode} onChange={(e) => f("pincode", e.target.value)} /></Field>
            </div>
            <button className="btn btn-primary text-[12px]" disabled={busy || form.name.length < 2} onClick={saveProfile}><ChevronRight className="w-3.5 h-3.5 mr-1" />Save & Continue</button>
          </div>
        )}

        {/* STEP 4 — Financials */}
        {step === 4 && (
          <div className="space-y-4">
            <StepTitle n={5} title="Financial Data" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {form.employment_type === "Salaried" && (
                <>
                  <Field label="Employer"><input className={input} value={form.employer} onChange={(e) => f("employer", e.target.value)} /></Field>
                  <Field label="Designation"><input className={input} value={form.designation} onChange={(e) => f("designation", e.target.value)} /></Field>
                </>
              )}
              <Field label="Monthly Income (₹)"><input type="number" className={input} value={form.monthly_income} onChange={(e) => f("monthly_income", e.target.value)} /></Field>
              {form.employment_type !== "Salaried" && (
                <>
                  <Field label="Business Name"><input className={input} value={form.business_name} onChange={(e) => f("business_name", e.target.value)} /></Field>
                  <Field label="Business Type"><input className={input} value={form.business_type} onChange={(e) => f("business_type", e.target.value)} /></Field>
                  <Field label="Business Vintage (years)"><input type="number" className={input} value={form.business_vintage} onChange={(e) => f("business_vintage", e.target.value)} /></Field>
                  <Field label="Annual Turnover (₹)"><input type="number" className={input} value={form.annual_turnover} onChange={(e) => f("annual_turnover", e.target.value)} /></Field>
                  <Field label="GST"><input className={input} value={form.gst} onChange={(e) => f("gst", e.target.value)} /></Field>
                </>
              )}
              <Field label="Existing EMI (₹)"><input type="number" className={input} value={form.existing_emi} onChange={(e) => f("existing_emi", e.target.value)} /></Field>
              <Field label="Bank Account No."><input className={input} value={form.bank_account} onChange={(e) => f("bank_account", e.target.value)} /></Field>
            </div>
            <button className="btn btn-primary text-[12px]" disabled={busy} onClick={saveFinancials}><Database className="w-3.5 h-3.5 mr-1" />Save & Fetch Credit</button>
          </div>
        )}

        {/* STEP 5 — Credit */}
        {step === 5 && (
          <div className="space-y-4">
            <StepTitle n={6} title="Credit Profile" />
            <p className="text-[11.5px] text-zinc-500">Fetch a demo credit profile. In production this connects to an authorized credit bureau provider.</p>
            {!detail?.credit ? (
              <button className="btn btn-primary text-[12px]" disabled={busy} onClick={runCredit}><Database className="w-3.5 h-3.5 mr-1" />Fetch Demo Credit Profile</button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center">
                  <div className="text-[26px] font-extrabold text-indigo-700">{detail.credit.score}</div>
                  <div className="text-[8px] font-bold text-indigo-400 uppercase">DEMO Score</div>
                </div>
                <div className="text-[11.5px] text-zinc-500">
                  <div>Active accounts: {detail.credit.active_accounts} · Enquiries (6m): {detail.credit.enquiries_6m}</div>
                  <div>Total outstanding: {fmtInr(detail.credit.total_outstanding)}</div>
                  <div className="text-amber-600 font-semibold mt-1">DEMO CREDIT DATA — not a real bureau result</div>
                </div>
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={() => setStep(6)}><ChevronRight className="w-3.5 h-3.5 mr-1" />Continue to Matching</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 6 — Match */}
        {step === 6 && (
          <div className="space-y-4">
            <StepTitle n={7} title="Lender / Product Matching" />
            {!detail?.matches?.length ? (
              <button className="btn btn-primary text-[12px]" disabled={busy} onClick={runMatch}><GitCompare className="w-3.5 h-3.5 mr-1" />Run Matcher</button>
            ) : (
              <div className="space-y-2">
                {detail.matches.map((m: any) => (
                  <label key={m.id} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer ${selectedMatch === m.id ? "border-brand-400 bg-brand-50/50 ring-1 ring-brand-200" : "border-zinc-200"}`}>
                    <input type="radio" name="match" checked={selectedMatch === m.id} onChange={() => setSelectedMatch(m.id)} />
                    <div className="flex-1">
                      <div className="text-[12.5px] font-semibold text-zinc-800">{m.lender_name} · {m.product_name}</div>
                      <div className="text-[10.5px] text-zinc-400">{m.category} · {fmtInr(m.min_amount)}–{fmtInr(m.max_amount)} · {m.roi ?? "—"} · {m.tenure ?? "—"} · fee {m.processing_fee ?? "—"}</div>
                    </div>
                    <span className={`text-[15px] font-extrabold ${m.status === "eligible" ? "text-emerald-600" : m.status === "maybe" ? "text-amber-600" : "text-rose-500"}`}>{m.score}%</span>
                    <Badge status={m.status}>{m.status}</Badge>
                  </label>
                ))}
                <div className="text-[10px] text-zinc-400">Growth Nations product-match score — platform routing guidance, NOT a lender approval score.</div>
                <button className="btn btn-primary text-[12px]" disabled={busy || !selectedMatch} onClick={createApp}><FileText className="w-3.5 h-3.5 mr-1" />Create Application & Verify Documents</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 7 — Application summary */}
        {step === 7 && app && (
          <div className="space-y-4">
            <StepTitle n={8} title="Application Summary" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
              {[["Application", app.ref], ["Lender", app.lender_name ?? "—"], ["Product", app.product_name ?? "—"], ["Amount", fmtInr(app.amount)], ["Tenure", `${app.tenure} months`], ["Documents", "All verified"], ["Status", app.status], ["KYC / Consent", "Complete"]].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-zinc-200 p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">{l}</div>
                  <div className="font-bold text-zinc-800 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary text-[12px]" disabled={busy} onClick={submit}><Rocket className="w-3.5 h-3.5 mr-1" />Submit Application to Lender</button>
          </div>
        )}

        {/* STEP 8-9 — Lender journey */}
        {step >= 8 && step <= 9 && app && (
          <div className="space-y-4">
            <StepTitle n={step === 8 ? 9 : 10} title={step === 8 ? "Submit to Lender" : "Lender Journey (Demo)"} />
            <div className="flex flex-wrap gap-2">
              {step === 8 && <button className="btn btn-primary text-[12px]" disabled={busy} onClick={submit}><Rocket className="w-3.5 h-3.5 mr-1" />Submit Application</button>}
              {step === 9 && (
                <>
                  {appStatus === "submitted" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("underwrite")}><Database className="w-3.5 h-3.5 mr-1" />Simulate Underwriting</button>}
                  {appStatus === "uw" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("approve", app.amount)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Simulate Approval</button>}
                  {appStatus === "approved" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("sanction")}><FileText className="w-3.5 h-3.5 mr-1" />Generate Sanction</button>}
                  {appStatus === "sanction_generated" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("agreement")}><ShieldCheck className="w-3.5 h-3.5 mr-1" />Complete Agreement / eSign</button>}
                  {appStatus === "agreement_completed" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("disburse", app.amount)}><Rocket className="w-3.5 h-3.5 mr-1" />Trigger Disbursement</button>}
                  {appStatus === "disb_initiated" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("fund", app.amount)}><Rocket className="w-3.5 h-3.5 mr-1" />Fund to Borrower</button>}
                  {appStatus === "disb_fully" && <button className="btn btn-secondary text-[12px]" onClick={() => lender("confirm")}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Confirm Disbursement</button>}
                  {appStatus === "disb_confirmed" && <button className="btn btn-primary text-[12px]" onClick={finish}><Rocket className="w-3.5 h-3.5 mr-1" />Calculate Payout & Finish</button>}
                  {busy && <span className="text-[11px] text-brand-600 font-semibold self-center">Processing…</span>}
                </>
              )}
            </div>
            <div className="text-[11px] text-zinc-500">
              Current status: <Badge status={app.status}>{app.status?.replace(/_/g, " ")}</Badge> · Lender reference: LND-DEMO series (sandbox)
            </div>
          </div>
        )}

        {/* STEP 10 — Done */}
        {step === 10 && app && (
          <div className="space-y-4 text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></div>
            <div className="text-[16px] font-bold text-zinc-800">LOAN DISBURSED ✓</div>
            <div className="text-[12.5px] text-zinc-500">
              {app.ref} · {fmtInr(app.amount)} credited to borrower's bank account · Growth Nations CRM updated<br />
              Commission / payout calculated & tracked (demo)
            </div>
            <div className="flex justify-center gap-2">
              <Link to={`/gn/co/applicants?id=${applicant.id}`} className="btn btn-primary text-[12px]">Open Applicant</Link>
              <Link to="/gn/co" className="btn btn-secondary text-[12px]">Command Center</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center">{n}</span>
      <span className="text-[14px] font-bold text-zinc-800">{title}</span>
    </div>
  );
}
