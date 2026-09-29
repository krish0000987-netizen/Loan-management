import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, PageHeader, Badge, Field, Modal, Drawer, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { ImportExport, WorkflowStepper } from "./shared";
import { Search, RefreshCw, UserPlus, Send, CheckCircle2, ShieldCheck, Database, GitCompare, FileText, Upload, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const TABS = [
  ["all", "All Applicants"], ["kyc", "KYC"], ["credit", "Credit Profile"], ["match", "Lender Match"],
  ["docs", "Documents"], ["uw", "Underwriting"], ["sanction", "Sanctions"], ["disbursement", "Disbursement"], ["payout", "Payouts"]
] as const;

const APP2GN: Record<string, string> = {
  none: "app_created", created: "app_created", submitted: "submitted", uw: "uw", approved: "approved",
  sanctioned: "sanction_generated", agreement: "agreement_completed", disb_initiated: "disb_initiated",
  disbursed: "disb_confirmed", payout: "payout_received", rejected: "rejected"
};

export function GnApplicants() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "all";
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [loanType, setLoanType] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback((t = tab) => {
    const p = new URLSearchParams({ tab: t, limit: "50" });
    if (q) p.set("q", q);
    if (loanType) p.set("loan_type", loanType);
    api(`/gn/co/applicants?${p}`).then((r) => { setRows(r.rows); setTotal(r.total); });
  }, [q, loanType, tab]);

  useEffect(() => { load(tab); }, [tab, load]);

  const openDetail = async (id: number) => {
    const r = await api(`/gn/co/applicants/${id}`);
    setDetail(r);
  };

  useEffect(() => {
    const id = params.get("id");
    if (id) { openDetail(Number(id)); setParams({}, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (label: string, fn: () => Promise<any>, reload = true) => {
    setBusy(label); setMsg(null);
    try {
      const r = await fn();
      if (reload) {
        await openDetail(detail.applicant.id);
        load(tab);
      }
      return r;
    } catch (e: any) {
      setMsg(e.message ?? "Action failed");
      return null;
    } finally { setBusy(null); }
  };

  const a = detail?.applicant;
  const app = detail?.applications?.[0];
  const disabled = (perm: string) => busy !== null || (busy === perm);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applicants"
        sub="Every applicant is individually traceable through KYC → credit → match → application → disbursement → payout"
        breadcrumb="Growth Nations / Command Center / Applicants"
        actions={
          <div className="flex items-center gap-2">
            <ImportExport entity="applicants" />
            <button className="btn btn-secondary text-[12px]" onClick={() => load(tab)}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</button>
            <Link to="/gn/co/new" className="btn btn-primary text-[12px]"><UserPlus className="w-3.5 h-3.5 mr-1" />New Applicant</Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => { setParams({ tab: key }); load(key); }}
            className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border ${tab === key ? "bg-brand-600 text-white border-brand-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-brand-300"}`}>
            {label}
          </button>
        ))}
      </div>

      <Card pad={false}>
        <div className="p-3 border-b border-zinc-100 flex flex-wrap items-center gap-2">
          <div className="flex items-center flex-1 min-w-[220px] border border-zinc-200 rounded-lg px-2.5 bg-white">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input className="input border-0 shadow-none flex-1 text-[12.5px]" placeholder="Search by ref, name, mobile or PAN…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          </div>
          <select className="input text-[12.5px] w-auto" value={loanType} onChange={(e) => { setLoanType(e.target.value); load(); }}>
            <option value="">All loan types</option>
            {["Personal Loan", "Business Loan", "Home Loan", "Loan Against Property", "Vehicle Loan", "Equipment Loan", "Working Capital"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <span className="text-[11px] text-zinc-400 font-semibold">{total} applicants</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                <th className="px-4 py-2.5">Applicant</th><th className="px-3 py-2.5">Loan</th><th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">KYC</th><th className="px-3 py-2.5">Credit</th><th className="px-3 py-2.5">Match</th>
                <th className="px-3 py-2.5">Docs</th><th className="px-3 py-2.5">Application</th><th className="px-3 py-2.5">Lender</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-brand-50/30 cursor-pointer" onClick={() => openDetail(r.id)}>
                  <td className="px-4 py-2.5">
                    <div className="text-[12.5px] font-semibold text-zinc-800">{r.name}</div>
                    <div className="text-[10px] text-zinc-400">{r.ref} · {r.mobile ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-zinc-600">{r.loan_type ?? "—"}</td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-zinc-800">{fmtInr(r.loan_amount)}</td>
                  <td className="px-3 py-2.5"><Badge status={r.kyc_status}>{r.kyc_status?.replace(/_/g, " ")}</Badge></td>
                  <td className="px-3 py-2.5 text-[12px] font-bold text-zinc-700">{r.credit_score ? `${r.credit_score} DEMO` : "—"}</td>
                  <td className="px-3 py-2.5"><Badge status={r.match_status}>{r.match_status?.replace(/_/g, " ")}</Badge></td>
                  <td className="px-3 py-2.5"><Badge status={r.doc_status}>{r.doc_status}</Badge></td>
                  <td className="px-3 py-2.5 text-[11px] text-zinc-500">{r.app_ref ?? "—"}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-zinc-600">{r.selected_lender ?? "—"}</td>
                  <td className="px-3 py-2.5"><Badge status={r.app_status}>{r.app_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="p-8"><EmptyState title="No applicants in this queue" sub="Create a new applicant or run the demo scenario" /></div>}
        </div>
      </Card>

      {msg && <div className="text-[12px] font-semibold text-rose-600">{msg}</div>}

      <Drawer open={!!a} onClose={() => setDetail(null)} title={a ? `${a.name} — ${a.ref}` : ""} width="max-w-3xl">
        {a && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge status={a.app_status}>{a.app_status}</Badge>
              <Badge status={a.kyc_status}>KYC: {a.kyc_status?.replace(/_/g, " ")}</Badge>
              <Badge status={a.consent_status}>Consent: {a.consent_status?.replace(/_/g, " ")}</Badge>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">DEMO</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
              <div><div className="text-zinc-400 text-[10px] uppercase">Loan</div><div className="font-semibold text-zinc-800">{a.loan_type ?? "—"}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">Amount</div><div className="font-semibold text-zinc-800">{fmtInr(a.loan_amount)}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">Tenure</div><div className="font-semibold text-zinc-800">{a.tenure ? `${a.tenure} mo` : "—"}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">Employment</div><div className="font-semibold text-zinc-800">{a.employment_type ?? "—"}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">City / State</div><div className="font-semibold text-zinc-800">{a.city ?? "—"}, {a.state ?? "—"}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">PAN</div><div className="font-semibold text-zinc-800">{a.pan ? `${a.pan.slice(0, 2)}XXXX${a.pan.slice(-2)}` : "—"}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">Mobile</div><div className="font-semibold text-zinc-800">{a.mobile ?? "—"}</div></div>
              <div><div className="text-zinc-400 text-[10px] uppercase">Source</div><div className="font-semibold text-zinc-800">{a.source ?? "—"}</div></div>
            </div>

            <WorkflowStepper status={APP2GN[a.app_status] ?? "app_created"} amount={a.loan_amount} />

            {/* OTP + Consent */}
            <div className="rounded-xl border border-zinc-200 p-3.5">
              <div className="text-[12px] font-bold text-zinc-800 mb-2">1 · Mobile OTP & Consent</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-secondary text-[11px]" disabled={disabled("otp")} onClick={() => act("otp", () => api(`/gn/co/applicants/${a.id}/otp`, { method: "POST", body: { action: "send" } }), false).then(() => openDetail(a.id))}><Send className="w-3 h-3 mr-1" />Send OTP (demo 123456)</button>
                <button className="btn btn-secondary text-[11px]" disabled={disabled("otp")} onClick={() => act("otp", () => api(`/gn/co/applicants/${a.id}/otp`, { method: "POST", body: { action: "verify", otp: "123456" } }))}><CheckCircle2 className="w-3 h-3 mr-1" />Verify OTP</button>
                <button className="btn btn-secondary text-[11px]" disabled={disabled("consent")} onClick={() => act("consent", () => api(`/gn/co/applicants/${a.id}/consent`, { method: "POST", body: { purpose: "Loan application, KYC, credit information & lender sharing" } }))}><ShieldCheck className="w-3 h-3 mr-1" />Capture Consent</button>
              </div>
              {a.otp_status === "verified" && <div className="mt-2 text-[11px] text-emerald-600 font-semibold">✓ Mobile verified · consent {a.consent_status}</div>}
            </div>

            {/* KYC */}
            <div className="rounded-xl border border-zinc-200 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-zinc-800">2 · KYC Verification Center</div>
                <button className="btn btn-secondary text-[11px]" disabled={disabled("kyc") || a.consent_status !== "received"} onClick={() => act("kyc", () => api(`/gn/co/applicants/${a.id}/kyc`, { method: "POST", body: {} }))}><ShieldCheck className="w-3 h-3 mr-1" />Run Demo KYC</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {["mobile", "pan", "identity", "address", "bank"].map((t) => {
                  const k = detail.kyc?.find((x: any) => x.kyc_type === t);
                  return (
                    <div key={t} className={`rounded-lg border px-2.5 py-2 ${k?.status === "verified" ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-100 bg-zinc-50"}`}>
                      <div className="text-[10px] uppercase text-zinc-400 font-semibold">{t}</div>
                      <div className="text-[11px] font-bold mt-0.5">{k?.status === "verified" ? "Verified ✓" : k ? k.status : "Pending"}</div>
                      {k?.reference && <div className="text-[9.5px] text-zinc-400 mt-0.5">{k.reference}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Credit */}
            <div className="rounded-xl border border-zinc-200 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-zinc-800">3 · Credit Profile</div>
                <button className="btn btn-secondary text-[11px]" disabled={disabled("credit") || a.consent_status !== "received"} onClick={() => act("credit", () => api(`/gn/co/applicants/${a.id}/credit`, { method: "POST", body: {} }))}><Database className="w-3 h-3 mr-1" />Fetch Demo Credit</button>
              </div>
              {detail.credit ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center">
                    <div className="text-[20px] font-extrabold text-indigo-700">{detail.credit.score}</div>
                    <div className="text-[8px] font-bold text-indigo-400 uppercase">DEMO Score</div>
                  </div>
                  <div className="text-[11px] text-zinc-500 space-y-0.5">
                    <div>Accounts: {detail.credit.active_accounts} active · {detail.credit.closed_accounts} closed · {detail.credit.enquiries_6m} enquiries (6m)</div>
                    <div>Outstanding: {fmtInr(detail.credit.total_outstanding)} · Utilization {detail.credit.utilization_pct}%</div>
                    <div className="text-amber-600 font-semibold">DEMO CREDIT DATA — not a real bureau result</div>
                  </div>
                </div>
              ) : <EmptyState title="No credit profile" sub="Fetch the demo credit profile (consent required)" />}
            </div>

            {/* Matches */}
            <div className="rounded-xl border border-zinc-200 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-zinc-800">4 · Lender / Product Matching</div>
                <button className="btn btn-secondary text-[11px]" disabled={disabled("match") || !detail.credit} onClick={() => act("match", () => api(`/gn/co/applicants/${a.id}/match`, { method: "POST", body: {} }))}><GitCompare className="w-3 h-3 mr-1" />Run Matcher</button>
              </div>
              <div className="space-y-2">
                {detail.matches?.map((m: any) => (
                  <div key={m.id} className={`rounded-lg border px-3 py-2 ${m.selected ? "border-brand-300 bg-brand-50/40" : "border-zinc-100"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-semibold text-zinc-800">{m.lender_name} · {m.product_name}</div>
                        <div className="text-[10px] text-zinc-400">{m.category} · {fmtInr(m.min_amount)}–{fmtInr(m.max_amount)} · {m.roi ?? "—"} · {m.tenure ?? "—"}</div>
                        {m.reasons?.length ? <div className="text-[9.5px] text-amber-600 mt-0.5">{JSON.parse(m.reasons).join(" · ")}</div> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-extrabold ${m.status === "eligible" ? "text-emerald-600" : m.status === "maybe" ? "text-amber-600" : "text-rose-500"}`}>{m.score}%</span>
                        <Badge status={m.status}>{m.status}</Badge>
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">Growth Nations product-match score — NOT a lender approval score · commission {m.commission_pct}%</div>
                  </div>
                ))}
                {!detail.matches?.length && <EmptyState title="No matches yet" sub="Run the matcher to see eligible lender products" />}
              </div>
            </div>

            {/* Application */}
            <div className="rounded-xl border border-zinc-200 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-bold text-zinc-800">5 · Application & Documents</div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary text-[11px]" disabled={disabled("apply") || !detail.matches?.length || !!app} onClick={() => act("apply", () => api(`/gn/co/applicants/${a.id}/apply`, { method: "POST", body: { match_id: detail.matches.find((m: any) => m.status === "eligible")?.id ?? detail.matches[0]?.id } }))}><FileText className="w-3 h-3 mr-1" />Create Application</button>
                  {app && <button className="btn btn-secondary text-[11px]" disabled={disabled("docs")} onClick={() => act("docs", () => api(`/gn/co/applicants/${a.id}/docs-complete`, { method: "POST", body: {} }))}><Upload className="w-3 h-3 mr-1" />Verify All Docs</button>}
                </div>
              </div>
              {app && (
                <div className="mb-2 text-[11.5px] text-zinc-600">
                  <span className="font-bold text-zinc-800">{app.ref}</span> · {app.lender_name ?? "—"} · {app.product_name ?? "—"} · {fmtInr(app.amount)} · <Badge status={app.status}>{app.status?.replace(/_/g, " ")}</Badge>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {detail.docs?.map((d: any) => (
                  <span key={d.id} className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${d.status === "verified" || d.status === "uploaded" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : d.status === "rejected" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-zinc-200 bg-white text-zinc-500"}`}>
                    {d.name}
                  </span>
                ))}
                {!detail.docs?.length && <span className="text-[11px] text-zinc-400">Create the application to generate its document checklist</span>}
              </div>
            </div>

            {/* Lender journey */}
            {app && (
              <div className="rounded-xl border border-zinc-200 p-3.5">
                <div className="text-[12px] font-bold text-zinc-800 mb-2">6 · Lender Journey (Demo)</div>
                <div className="flex flex-wrap gap-2">
                  {!["submitted", "uw", "approved", "sanction_generated", "agreement_completed", "disb_initiated", "disb_fully", "disb_confirmed", "crm_updated", "payout_received"].includes(app.status) && (
                    <button className="btn btn-secondary text-[11px]" disabled={disabled("submit")} onClick={() => act("submit", () => api(`/gn/co/applicants/${a.id}/submit`, { method: "POST", body: {} }))}><Rocket className="w-3 h-3 mr-1" />Submit to Lender</button>
                  )}
                  {app.status === "submitted" && <button className="btn btn-secondary text-[11px]" onClick={() => act("uw", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "underwrite" } }))}><Database className="w-3 h-3 mr-1" />Simulate Underwriting</button>}
                  {app.status === "uw" && <button className="btn btn-secondary text-[11px]" onClick={() => act("approve", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "approve", amount: app.amount } }))}><CheckCircle2 className="w-3 h-3 mr-1" />Simulate Approval</button>}
                  {app.status === "approved" && <button className="btn btn-secondary text-[11px]" onClick={() => act("sanction", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "sanction" } }))}><FileText className="w-3 h-3 mr-1" />Generate Sanction</button>}
                  {app.status === "sanction_generated" && <button className="btn btn-secondary text-[11px]" onClick={() => act("agreement", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "agreement" } }))}><ShieldCheck className="w-3 h-3 mr-1" />Complete Agreement / eSign</button>}
                  {app.status === "agreement_completed" && <button className="btn btn-secondary text-[11px]" onClick={() => act("disburse", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "disburse", amount: app.amount } }))}><Rocket className="w-3 h-3 mr-1" />Trigger Disbursement</button>}
                  {app.status === "disb_initiated" && <button className="btn btn-secondary text-[11px]" onClick={() => act("fund", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "fund", amount: app.amount } }))}><Rocket className="w-3 h-3 mr-1" />Fund Transfer</button>}
                  {app.status === "disb_fully" && <button className="btn btn-secondary text-[11px]" onClick={() => act("confirm", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "confirm" } }))}><CheckCircle2 className="w-3 h-3 mr-1" />Confirm Disbursement</button>}
                  {app.status === "disb_confirmed" && <button className="btn btn-secondary text-[11px]" onClick={() => act("payout", () => api(`/gn/co/applicants/${a.id}/lender`, { method: "POST", body: { action: "payout" } }))}><Rocket className="w-3 h-3 mr-1" />Calculate Payout</button>}
                  {busy && <span className="text-[11px] text-brand-600 font-semibold self-center">Processing {busy}…</span>}
                </div>

                {/* Sanction / Agreement / Disbursement / Payout records */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <div className="rounded-lg border border-zinc-100 p-2.5">
                    <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">Sanction</div>
                    {detail.sanctions?.[0] ? <div className="text-[11px] font-bold text-zinc-800 mt-0.5">{fmtInr(detail.sanctions[0].sanctioned_amount)}</div> : <div className="text-[11px] text-zinc-400 mt-0.5">—</div>}
                  </div>
                  <div className="rounded-lg border border-zinc-100 p-2.5">
                    <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">Agreement</div>
                    <div className="text-[11px] font-bold text-zinc-800 mt-0.5">{detail.agreements?.[0]?.status ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-100 p-2.5">
                    <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">Disbursement</div>
                    {detail.disbursements?.[0] ? <div className="text-[11px] font-bold text-zinc-800 mt-0.5">{fmtInr(detail.disbursements[0].amount)}</div> : <div className="text-[11px] text-zinc-400 mt-0.5">—</div>}
                  </div>
                  <div className="rounded-lg border border-zinc-100 p-2.5">
                    <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">Payout</div>
                    {detail.payouts?.[0] ? <div className="text-[11px] font-bold text-emerald-700 mt-0.5">{fmtInr(detail.payouts[0].gross)}</div> : <div className="text-[11px] text-zinc-400 mt-0.5">—</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-xl border border-zinc-200 p-3.5">
              <div className="text-[12px] font-bold text-zinc-800 mb-2">Applicant Timeline & Audit</div>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {[...(detail.events ?? [])].map((e: any) => (
                  <div key={e.id} className="flex items-start gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1 shrink-0" />
                    <div><span className="font-bold text-zinc-700">{e.event}</span> <span className="text-zinc-400">· {e.note}</span> <span className="text-zinc-300">· {fmtDate(e.created_at)}</span></div>
                  </div>
                ))}
                {!detail.events?.length && <div className="text-[11px] text-zinc-400">No events yet</div>}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
