import { useEffect, useState } from "react";
import { Badge, Card, CardTitle, KV, Modal, Field, Progress } from "./ui";
import { api, fmtInr } from "../lib/api";

type Props = { app: any };

const VERDICT_TONE: Record<string, string> = { ELIGIBLE: "badge-green", MAYBE: "badge-amber", NOT_ELIGIBLE: "badge-red" };

export function LosToolsPanel({ app }: Props) {
  const [tab, setTab] = useState("eligibility");
  const [eligibility, setEligibility] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [memo, setMemo] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [collateral, setCollateral] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any>(null);
  const [modal, setModal] = useState<null | "exception" | "party" | "collateral" | "memo" | "offer">(null);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState("");

  const load = () => {
    api(`/applications/${app.id}/eligibility`).then(setEligibility);
    api(`/applications/${app.id}/checklist`).then(setChecklist);
    api(`/applications/${app.id}/exceptions`).then((r) => setExceptions(r.rows));
    api(`/applications/${app.id}/memo`).then(setMemo).catch(() => null);
    api(`/applications/${app.id}/offers`).then((r) => setOffers(r.offers));
    api(`/applications/${app.id}/parties`).then((r) => setParties(r.rows));
    api(`/applications/${app.id}/collateral`).then((r) => setCollateral(r.rows));
    api(`/applications/duplicates?pan=${app.pan ?? ""}`).then(setDuplicates).catch(() => null);
  };
  useEffect(() => { load(); }, [app.id]);

  const run = async (fn: () => Promise<any>, ok: string) => {
    try { await fn(); setMsg(ok); load(); setTimeout(() => setMsg(""), 3500); }
    catch (e: any) { setMsg(`Error: ${e.message}`); setTimeout(() => setMsg(""), 5000); }
  };

  const TABS = [
    { key: "eligibility", label: "Eligibility" },
    { key: "checklist", label: "Checklist" },
    { key: "duplicates", label: "Duplicates" },
    { key: "exceptions", label: "Exceptions", count: exceptions.length },
    { key: "memo", label: "Credit memo" },
    { key: "offers", label: "Offers", count: offers.length },
    { key: "parties", label: "Parties", count: parties.length },
    { key: "collateral", label: "Collateral", count: collateral.length }
  ];

  return (
    <Card>
      {msg && <div className="mb-3 rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2 text-[11.5px] text-emerald-800">{msg}</div>}
      <div className="flex items-center gap-1 border-b border-zinc-200 pb-px mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} className={`tabs-btn ${tab === t.key ? "tabs-btn-active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}{t.count !== undefined && t.count > 0 && <span className="ml-1 text-[10.5px] font-semibold text-zinc-400">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ELIGIBILITY */}
      {tab === "eligibility" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13.5px] font-semibold text-zinc-900">Pre-screening engine</h3>
              <p className="text-[11.5px] text-zinc-500 mt-0.5">Deterministic check of product bands, age, income, FOIR, bureau and exposure</p>
            </div>
            {eligibility && <span className={VERDICT_TONE[eligibility.verdict] || "badge-gray"}>{eligibility.verdict}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(eligibility?.checks ?? []).map((c: any) => (
              <div key={c.key} className={`rounded-md border px-3 py-2.5 ${c.passed ? "border-zinc-100" : "border-rose-200 bg-rose-50/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-zinc-700">{c.label}</span>
                  <span className={`text-[10.5px] font-bold uppercase ${c.passed ? "text-emerald-600" : "text-rose-600"}`}>{c.passed ? "Pass" : "Fail"}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11.5px]">
                  <span className="num text-zinc-800">{c.value}</span>
                  <span className="text-zinc-400">vs {c.threshold}</span>
                </div>
                {!c.passed && <div className="mt-1 text-[10.5px] text-amber-600">{c.hard ? "Hard requirement" : "Soft check"}</div>}
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11.5px] text-zinc-500">
            {(eligibility?.reasons ?? []).map((r: string) => <div key={r} className="py-0.5">• {r}</div>)}
          </div>
        </div>
      )}

      {/* CHECKLIST */}
      {tab === "checklist" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-semibold text-zinc-900">Document checklist</h3>
            {checklist?.summary && (
              <span className="text-[11.5px] text-zinc-500">{checklist.summary.verified}/{checklist.summary.required} required docs verified</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(checklist?.rows ?? []).filter((r: any) => r.required).map((r: any) => (
              <div key={r.category} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2.5">
                <div>
                  <div className="text-[12px] font-medium text-zinc-700">{r.name}</div>
                  {r.documents.length > 0 && <div className="text-[10.5px] text-zinc-400">v{r.documents[r.documents.length - 1].version} · {r.documents.length} upload(s)</div>}
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DUPLICATES */}
      {tab === "duplicates" && (
        <div>
          <h3 className="text-[13.5px] font-semibold text-zinc-900 mb-1">Duplicate / fraud detection</h3>
          <p className="text-[11.5px] text-zinc-500 mb-3">Scanned against PAN {app.pan || "—"} for same identity, mobile or email across the tenant</p>
          {(duplicates?.matches ?? []).map((m: any) => (
            <div key={m.customer.id} className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2.5 mb-2">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] font-semibold text-zinc-800">{m.customer.name} <span className="text-zinc-400 font-normal">({m.customer.customer_no})</span></div>
                <div className="flex gap-1">{m.flags.map((f: string) => <span key={f} className="badge-red">{f}</span>)}</div>
              </div>
              {m.active_loans.length > 0 && <div className="mt-1.5 text-[11.5px] text-rose-700">Active exposure: {m.active_loans.map((l: any) => `${l.loan_no} (${fmtInr(l.outstanding)})`).join(", ")}</div>}
              {m.applications.length > 0 && <div className="mt-0.5 text-[11px] text-zinc-500">{m.applications.length} application(s): {m.applications.map((a: any) => a.application_no).join(", ")}</div>}
            </div>
          ))}
          {duplicates && duplicates.matches.length === 0 && <div className="text-[12.5px] text-zinc-500 py-4">No duplicate customers found — clean application.</div>}
        </div>
      )}

      {/* EXCEPTIONS */}
      {tab === "exceptions" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-semibold text-zinc-900">Policy exceptions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal("exception")}>Raise exception</button>
          </div>
          <div className="space-y-2">
            {exceptions.map((e: any) => (
              <div key={e.id} className="rounded-md border border-zinc-100 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-zinc-800">{e.rule_name}</span>
                  <Badge status={e.status} />
                </div>
                <div className="text-[11.5px] text-zinc-600 mt-1">{e.reason}</div>
                <div className="text-[10.5px] text-zinc-400 mt-1">Risk: {e.risk ?? "medium"} · approver {e.approver_required ? "required" : "not required"}{e.note ? ` · note: ${e.note}` : ""}</div>
                {e.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={() => run(async () => api(`/applications/exceptions/${e.id}/decide`, { method: "POST", body: { action: "approve", note: "Approved — conditions attached" } }), "Exception approved")}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => run(async () => api(`/applications/exceptions/${e.id}/decide`, { method: "POST", body: { action: "reject", note: "Declined" } }), "Exception rejected")}>Reject</button>
                  </div>
                )}
              </div>
            ))}
            {!exceptions.length && <div className="py-6 text-center text-[12px] text-zinc-400">No exceptions raised.</div>}
          </div>
        </div>
      )}

      {/* MEMO */}
      {tab === "memo" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-semibold text-zinc-900">Credit appraisal memo</h3>
            <div className="flex items-center gap-2">
              <Badge status={memo?.memo?.status} />
              {memo?.memo && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => run(async () => api(`/applications/${app.id}/memo`, { method: "PATCH", body: { status: "submitted" } }), "Memo submitted")}>Submit</button>
                  <button className="btn btn-primary btn-sm" onClick={() => run(async () => api(`/applications/${app.id}/memo`, { method: "PATCH", body: { status: "approved" } }), "Memo approved")}>Approve</button>
                </>
              )}
            </div>
          </div>
          {memo?.memo?.content ? (
            <MemoBody c={memo.memo.content} />
          ) : (
            <div className="text-[12.5px] text-zinc-500 py-4">Generating memo… <button className="ml-2 btn btn-secondary btn-sm" onClick={load}>Retry</button></div>
          )}
        </div>
      )}

      {/* OFFERS */}
      {tab === "offers" && (
        <div>
          <h3 className="text-[13.5px] font-semibold text-zinc-900 mb-1">Offer comparison</h3>
          <p className="text-[11.5px] text-zinc-500 mb-3">Multiple configured offers with full cost disclosure — select the applicable offer before sanction</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {offers.map((o) => (
              <div key={o.id} className={`rounded-lg border px-4 py-3.5 ${o.selected ? "border-brand-300 bg-brand-50/50 ring-1 ring-brand-200" : "border-zinc-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-zinc-900">{o.label}</span>
                  {o.selected ? <span className="badge-green">Selected</span> : <span className={VERDICT_TONE[o.risk_grade] || "badge-gray"}>{o.risk_grade}</span>}
                </div>
                <div className="mt-2 text-[22px] font-semibold num text-zinc-900">{fmtInr(o.amount)}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{o.rate}% p.a. · {o.tenure} months</div>
                <div className="mt-3 space-y-1.5 text-[12px]">
                  <div className="flex justify-between"><span className="text-zinc-500">EMI</span><span className="num font-medium">{fmtInr(o.emi)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">APR (incl. fees)</span><span className="num font-medium">{o.apr}%</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Upfront fees</span><span className="num">{fmtInr(o.fees)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Total repayment</span><span className="num font-medium">{fmtInr(o.total_repayment)}</span></div>
                </div>
                {!o.selected && (
                  <button className="btn btn-secondary w-full mt-3" onClick={() => run(async () => api(`/applications/${app.id}/offers/${o.id}/select`, { method: "POST", body: {} }), `Offer ${o.label} selected`)}>Select offer</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARTIES */}
      {tab === "parties" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-semibold text-zinc-900">Co-applicants & guarantors</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal("party")}>Add party</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {parties.map((p) => (
              <div key={p.id} className="rounded-md border border-zinc-100 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-zinc-800">{p.name}</span>
                  <Badge status={p.type} />
                </div>
                <div className="text-[11.5px] text-zinc-500 mt-1">PAN {p.pan || "—"} · {p.relationship || "—"} · {p.employment_type || "—"}</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Income {p.monthly_income ? fmtInr(p.monthly_income) : "—"} · Consent {p.consent ? "✓" : "pending"}</div>
              </div>
            ))}
            {!parties.length && <div className="col-span-2 py-6 text-center text-[12px] text-zinc-400">No co-applicants or guarantors.</div>}
          </div>
        </div>
      )}

      {/* COLLATERAL */}
      {tab === "collateral" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-semibold text-zinc-900">Collateral 360</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal("collateral")}>Add collateral</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {collateral.map((c) => (
              <div key={c.id} className="rounded-md border border-zinc-100 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-zinc-800">{c.asset_type}</span>
                  <Badge status={c.verification_status} />
                </div>
                <div className="text-[11.5px] text-zinc-500 mt-1">Owner {c.owner_name || "—"} · {c.location || "—"}</div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[11.5px]">
                  <div className="rounded bg-zinc-50 px-2 py-1.5"><div className="text-zinc-400 text-[10px]">Value</div><div className="num font-medium">{fmtInr(c.value)}</div></div>
                  <div className="rounded bg-zinc-50 px-2 py-1.5"><div className="text-zinc-400 text-[10px]">LTV</div><div className="num font-medium">{c.ltv ?? "—"}%</div></div>
                  <div className="rounded bg-zinc-50 px-2 py-1.5"><div className="text-zinc-400 text-[10px]">Insurance</div><div className="font-medium">{c.insurance ? "Yes" : "No"}</div></div>
                </div>
                {c.verification_status === "pending" && (
                  <button className="btn btn-primary btn-sm mt-2.5" onClick={() => run(async () => api(`/collateral/${c.id}`, { method: "PATCH", body: { verification_status: "verified" } }), "Collateral verified")}>Mark verified</button>
                )}
              </div>
            ))}
            {!collateral.length && <div className="col-span-2 py-6 text-center text-[12px] text-zinc-400">No collateral registered for this application.</div>}
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal === "exception" && (
        <Modal open onClose={() => setModal(null)} title="Raise policy exception">
          <div className="space-y-3">
            <Field label="Rule"><input className="input w-full" value={form.rule_name || ""} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} placeholder="e.g. Minimum bureau score" /></Field>
            <Field label="Reason"><textarea className="input w-full min-h-[70px]" value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why is this exception justified?" /></Field>
            <Field label="Risk"><select className="input w-full" value={form.risk || "medium"} onChange={(e) => setForm({ ...form, risk: e.target.value })}>{["low", "medium", "high"].map((r) => <option key={r}>{r}</option>)}</select></Field>
            <button className="btn btn-primary w-full" disabled={!form.rule_name || !form.reason} onClick={() => { run(async () => api(`/applications/${app.id}/exceptions`, { method: "POST", body: { rule_name: form.rule_name, reason: form.reason, risk: form.risk } }), "Exception raised"); setModal(null); setForm({}); }}>Raise exception</button>
          </div>
        </Modal>
      )}
      {modal === "party" && (
        <Modal open onClose={() => setModal(null)} title="Add co-applicant / guarantor">
          <div className="space-y-3">
            <Field label="Type"><select className="input w-full" value={form.type || "co_applicant"} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["co_applicant", "guarantor", "joint"].map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Name"><input className="input w-full" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="PAN"><input className="input w-full" value={form.pan || ""} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} /></Field>
            <Field label="Relationship"><input className="input w-full" value={form.relationship || ""} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Spouse / Director / Guarantor" /></Field>
            <Field label="Monthly income"><input className="input w-full num" value={form.monthly_income || ""} onChange={(e) => setForm({ ...form, monthly_income: Number(e.target.value.replace(/[^0-9]/g, "")) || undefined })} /></Field>
            <label className="flex items-center gap-2 text-[12px] text-zinc-600"><input type="checkbox" checked={!!form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /> Consent obtained</label>
            <button className="btn btn-primary w-full" disabled={!form.name} onClick={() => { run(async () => api(`/applications/${app.id}/parties`, { method: "POST", body: form }), "Party added"); setModal(null); setForm({}); }}>Add party</button>
          </div>
        </Modal>
      )}
      {modal === "collateral" && (
        <Modal open onClose={() => setModal(null)} title="Register collateral">
          <div className="space-y-3">
            <Field label="Asset type"><input className="input w-full" value={form.asset_type || ""} onChange={(e) => setForm({ ...form, asset_type: e.target.value })} placeholder="Property / Vehicle / Gold" /></Field>
            <Field label="Owner"><input className="input w-full" value={form.owner_name || ""} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></Field>
            <Field label="Value (₹)"><input className="input w-full num" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value.replace(/[^0-9]/g, "")) || undefined })} /></Field>
            <Field label="Location"><input className="input w-full" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-[12px] text-zinc-600"><input type="checkbox" checked={!!form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.checked })} /> Insured</label>
            <button className="btn btn-primary w-full" disabled={!form.asset_type || !form.value} onClick={() => { run(async () => api(`/applications/${app.id}/collateral`, { method: "POST", body: form }), "Collateral registered"); setModal(null); setForm({}); }}>Register collateral</button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function MemoBody({ c }: { c: any }) {
  if (!c) return null;
  const section = (title: string, rows: [string, string][]) => (
    <div className="mb-3">
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-zinc-400 mb-1">{title}</div>
      <div className="rounded-md border border-zinc-100 px-3 py-2">
        {rows.map(([k, v]) => <KV key={k} k={k} v={v} />)}
      </div>
    </div>
  );
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] text-zinc-500">Generated {fmtDate(c.generated_at)} · {c.application_no}</span>
        <span className={`text-[11px] font-bold uppercase ${c.recommendation === "APPROVE" ? "text-emerald-600" : "text-amber-600"}`}>{c.recommendation}</span>
      </div>
      {section("Customer", [
        ["Name", c.customer?.name || "—"], ["Age", String(c.customer?.age ?? "—")], ["Employment", c.customer?.employment_type || "—"],
        ["Income", fmtInr(c.customer?.monthly_income)], ["KYC", c.customer?.kyc_status || "—"]
      ])}
      {section("Loan request", [["Product", c.loan_request?.product || "—"], ["Amount", fmtInr(c.loan_request?.amount)], ["Tenure", `${c.loan_request?.tenure} months`], ["Purpose", c.loan_request?.purpose || "—"]])}
      {c.credit && section("Credit", [["Score", String(c.credit.score ?? "—")], ["Band", c.credit.band || "—"], ["Utilization", `${c.credit.utilization}%`], ["Enquiries 6m", String(c.credit.enquiries_6m)], ["Bureau DPD max", String(c.credit.dpd_max)]])}
      {c.capacity && section("Capacity", [["Income", fmtInr(c.capacity.income)], ["Obligations", fmtInr(c.capacity.obligations)], ["Surplus", fmtInr(c.capacity.surplus)], ["FOIR", c.capacity.foir != null ? `${c.capacity.foir}%` : "—"], ["DSCR", c.capacity.dscr != null ? String(c.capacity.dscr) : "—"]])}
      {c.banking && section("Banking", [["Monthly income", fmtInr(c.banking.monthly_income)], ["Surplus", fmtInr(c.banking.surplus)], ["Bounces", String(c.banking.bounces)], ["Risk", c.banking.risk || "—"]])}
      {c.collateral?.length > 0 && section("Collateral", c.collateral.map((x: any) => [x.asset_type, `${fmtInr(x.value)} · LTV ${x.ltv}%`]))}
      {c.policy_exceptions?.length > 0 && section("Policy exceptions", c.policy_exceptions.map((x: any) => [x.rule_name, `${x.status}`]))}
      {section("Proposal", [["Amount", fmtInr(c.proposal?.amount)], ["Tenure", `${c.proposal?.tenure} months`], ["Rate", `${c.proposal?.rate}%`], ["EMI", fmtInr(c.proposal?.emi)], ["Fees", fmtInr(c.proposal?.fee)], ["APR", `${c.proposal?.apr}%`]])}
      {c.eligibility && section("Eligibility verdict", [[c.eligibility.verdict, (c.eligibility.reasons ?? []).join("; ")]])}
      {c.bre && section("Rules engine", c.bre.detail?.map((r: any) => [r.rule, r.passed ? "Pass" : "Fail"]) ?? [["result", c.bre.result]])}
      <div className="rounded-md bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-[11px] text-zinc-500">
        Risk grade: <b className="uppercase">{c.risk}</b> · This memo is advisory — a human decision is always required.
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
