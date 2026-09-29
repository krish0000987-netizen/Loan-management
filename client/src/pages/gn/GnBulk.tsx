import { useCallback, useEffect, useRef, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Drawer, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate, getToken } from "../../lib/api";
import { Upload, Plus, Rocket, RefreshCw, Pause, Play, XCircle, RotateCcw, Download, Layers, Loader2, CheckCircle2 } from "lucide-react";

const WIZARD_STEPS = ["Details", "Upload", "Mapping", "Validation", "Dedupe", "Preview", "Processing", "Results"];

const STATUS_TONES: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700", processing: "border-sky-200 bg-sky-50 text-sky-700",
  validating: "border-amber-200 bg-amber-50 text-amber-700", validated: "border-indigo-200 bg-indigo-50 text-indigo-700",
  uploaded: "border-zinc-200 bg-zinc-50 text-zinc-600", draft: "border-zinc-200 bg-white text-zinc-500",
  failed: "border-rose-200 bg-rose-50 text-rose-700", paused: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-zinc-200 bg-zinc-100 text-zinc-500"
};

const ROW_TONES: Record<string, string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-700", invalid: "border-rose-200 bg-rose-50 text-rose-700",
  duplicate: "border-amber-200 bg-amber-50 text-amber-700", missing: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-zinc-200 bg-zinc-50 text-zinc-500", applicant_created: "border-sky-200 bg-sky-50 text-sky-700",
  app_created: "border-sky-200 bg-sky-50 text-sky-700", submitted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700", rejected: "border-rose-200 bg-rose-50 text-rose-700",
  disbursed: "border-emerald-200 bg-emerald-50 text-emerald-700", failed: "border-rose-200 bg-rose-50 text-rose-700",
  skipped: "border-zinc-200 bg-zinc-100 text-zinc-500"
};

export function GnBulk() {
  const [data, setData] = useState<any>(null);
  const [wizard, setWizard] = useState(false);
  const [wStep, setWStep] = useState(0);
  const [batch, setBatch] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [detailTab, setDetailTab] = useState("overview");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => { api("/gn/bulk").then(setData).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (label: string, fn: () => Promise<any>, refresh = true) => {
    setBusy(true); setMsg(null);
    try {
      const r = await fn();
      if (refresh) { load(); if (detail) openDetail(detail.batch.id); }
      return r;
    } catch (e: any) { setMsg(e.message ?? `${label} failed`); return null; }
    finally { setBusy(false); }
  };

  const openDetail = async (id: number) => {
    const r = await api(`/gn/bulk/batches/${id}?limit=30`);
    setDetail(r);
    setDetailTab("overview");
  };

  const kpi = data?.kpi ?? {};

  /* ---------------- Create-batch wizard ---------------- */

  const [form, setForm] = useState<any>({ name: "", description: "", source: "DSA", loan_type: "", assigned_team: "", priority: "normal", mode: "assisted" });
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const createBatch = async () => {
    const b = await run("create", () => api("/gn/bulk/batches", { method: "POST", body: form }));
    if (b) { setBatch(b); setWStep(1); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !batch) return;
    const buf = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const r = await run("upload", () => api(`/gn/bulk/batches/${batch.id}/upload`, { method: "POST", body: { filename: file.name, data: base64 } }));
    if (r) {
      setFileInfo(r);
      setMapping(r.mapping ?? {});
      setWStep(2);
    }
    e.target.value = "";
  };

  const saveMapping = async () => {
    const r = await run("map", () => api(`/gn/bulk/batches/${batch.id}/map`, { method: "POST", body: { mapping } }));
    if (r) setWStep(3);
  };

  const validate = async () => {
    const r = await run("validate", () => api(`/gn/bulk/batches/${batch.id}/validate`, { method: "POST", body: {} }));
    if (r) { await openDetail(batch.id); setWStep(4); }
  };

  const dedupe = async () => {
    const r = await run("dedupe", () => api(`/gn/bulk/batches/${batch.id}/dedupe`, { method: "POST", body: {} }));
    if (r) { await openDetail(batch.id); setWStep(5); }
  };

  const preview = async () => {
    const r = await run("preview", () => api(`/gn/bulk/batches/${batch.id}/preview`, { method: "POST", body: {} }));
    if (r) { setDetail(r); setWStep(6); }
  };

  const process = async () => {
    setWStep(7);
    const r = await run("process", () => api(`/gn/bulk/batches/${batch.id}/process`, { method: "POST", body: {} }));
    if (r) { await openDetail(batch.id); setDetailTab("overview"); }
  };

  const loadDemo = async () => {
    const r = await run("demo", () => api("/gn/bulk/demo", { method: "POST", body: {} }));
    if (r) await openDetail(r.batchId);
  };

  const control = (action: string) => run(action, () => api(`/gn/bulk/batches/${detail.batch.id}/control`, { method: "POST", body: { action } }));

  const doExport = async (filter = "") => {
    const r = await run("export", () => api(`/gn/bulk/batches/${detail.batch.id}/export`, { method: "POST", body: { filter } }), false);
    if (!r) return;
    const blob = new Blob([r], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bulk_${detail.batch.name.replace(/\s+/g, "_")}_${filter || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadTemplate = (type: string) => {
    const a = document.createElement("a");
    a.href = `/api/gn/bulk/template/${type}`;
    a.setAttribute("data-token", getToken() ?? "");
    fetch(`/api/gn/bulk/template/${type}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.blob())
      .then((blob) => { const u = URL.createObjectURL(blob); a.href = u; a.download = `gn_bulk_template_${type}.csv`; a.click(); URL.revokeObjectURL(u); });
  };

  const mappedFields = ["name", "mobile", "email", "pan", "dob", "city", "state", "pincode", "loan_type", "loan_amount", "tenure", "monthly_income", "annual_turnover", "business_name", "business_vintage", "gst", "source", "dsa", "purpose"];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bulk Applications"
        sub="Bulk loan origination — upload CSV/XLSX, validate, dedupe, and process thousands of applicants through the full pipeline"
        breadcrumb="Growth Nations / Command Center / Bulk Applications"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary text-[12px]" onClick={loadDemo} disabled={busy}><Layers className="w-3.5 h-3.5 mr-1" />Load 500-Applicant Demo Batch</button>
            <button className="btn btn-secondary text-[12px]" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</button>
            <button className="btn btn-primary text-[12px]" onClick={() => { setWizard(true); setWStep(0); setBatch(null); setFileInfo(null); setMsg(null); }}><Plus className="w-3.5 h-3.5 mr-1" />Create New Batch</button>
          </div>
        }
      />

      {msg && <div className="text-[12px] font-semibold text-rose-600">{msg}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          ["Total Batches", kpi.total_batches ?? 0], ["Processing", kpi.processing ?? 0], ["Completed", kpi.completed ?? 0], ["Failed", kpi.failed ?? 0],
          ["Total Applicants", kpi.total_rows ?? 0], ["Valid", kpi.valid ?? 0], ["Duplicates", kpi.duplicates ?? 0], ["Missing Data", kpi.invalid ?? 0]
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-3.5 py-3">
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div>
            <div className="text-[17px] font-bold text-zinc-800 mt-0.5">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Applications Created", kpi.applications_created ?? 0], ["Submitted", kpi.submitted ?? 0], ["Approved", kpi.approved ?? 0],
          ["Disbursed", kpi.disbursed ?? 0], ["Total Disbursement", fmtInr(kpi.disbursed_amount)]
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-3.5 py-3">
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div>
            <div className="text-[17px] font-bold text-zinc-800 mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      <Card pad={false}>
        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="text-[13px] font-bold text-zinc-800">Batches</div>
          <div className="text-[10.5px] text-zinc-400">Click a batch to open its command center — every metric is database-driven</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                <th className="px-4 py-2.5">Batch</th><th className="px-3 py-2.5">Source</th><th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Rows</th><th className="px-3 py-2.5">Valid</th><th className="px-3 py-2.5">Dup</th>
                <th className="px-3 py-2.5">Apps</th><th className="px-3 py-2.5">Disbursed</th><th className="px-3 py-2.5">Amount</th><th className="px-3 py-2.5">Progress</th>
              </tr>
            </thead>
            <tbody>
              {data?.batches?.map((b: any) => (
                <tr key={b.id} className="border-b border-zinc-50 hover:bg-brand-50/30 cursor-pointer" onClick={() => openDetail(b.id)}>
                  <td className="px-4 py-2.5">
                    <div className="text-[12.5px] font-semibold text-zinc-800">{b.name}</div>
                    <div className="text-[10px] text-zinc-400">{fmtDate(b.created_at)} · {b.created_name ?? "—"}{b.is_demo ? " · DEMO" : ""}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-zinc-600">{b.source}</td>
                  <td className="px-3 py-2.5"><Badge status={b.status}>{b.status}</Badge></td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold">{b.rows ?? 0}</td>
                  <td className="px-3 py-2.5 text-[12px] text-emerald-700 font-semibold">{b.valid}</td>
                  <td className="px-3 py-2.5 text-[12px] text-amber-700 font-semibold">{b.duplicates}</td>
                  <td className="px-3 py-2.5 text-[12px]">{b.applications_created}</td>
                  <td className="px-3 py-2.5 text-[12px]">{b.disbursed}</td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-zinc-800">{fmtInr(b.disbursed_amount)}</td>
                  <td className="px-3 py-2.5">
                    <div className="w-28 h-1.5 rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${b.progress ?? 0}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.batches?.length && <div className="p-8"><EmptyState title="No batches yet" sub="Create a batch or load the 500-applicant demo" /></div>}
        </div>
      </Card>

      {/* ---------------- Wizard ---------------- */}
      <Modal open={wizard} onClose={() => setWizard(false)} title={`Create Bulk Batch — ${WIZARD_STEPS[wStep]}`} wide>
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${i === wStep ? "bg-brand-600 text-white" : i < wStep ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-400"}`}>
              {i < wStep ? <CheckCircle2 className="w-3 h-3" /> : null}{s}
            </div>
          ))}
        </div>

        {wStep === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Batch Name"><input className="input text-[12.5px]" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="e.g. August Builder Leads — Mumbai" /></Field>
            <Field label="Source"><select className="input text-[12.5px]" value={form.source} onChange={(e) => f("source", e.target.value)}>{["Builder", "OEM", "DSA", "CA", "Dealer", "Branch", "Campaign", "Manual"].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Description"><input className="input text-[12.5px]" value={form.description} onChange={(e) => f("description", e.target.value)} /></Field>
            <Field label="Loan Type"><input className="input text-[12.5px]" value={form.loan_type} onChange={(e) => f("loan_type", e.target.value)} placeholder="Mixed / Home Loan / Business Loan…" /></Field>
            <Field label="Assigned Team"><input className="input text-[12.5px]" value={form.assigned_team} onChange={(e) => f("assigned_team", e.target.value)} /></Field>
            <Field label="Priority"><select className="input text-[12.5px]" value={form.priority} onChange={(e) => f("priority", e.target.value)}>{["low", "normal", "high", "urgent"].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Processing Mode"><select className="input text-[12.5px]" value={form.mode} onChange={(e) => f("mode", e.target.value)}>{["manual", "assisted", "automated"].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <div className="flex items-end"><button className="btn btn-primary text-[12px]" disabled={busy || form.name.length < 2} onClick={createBatch}><Plus className="w-3.5 h-3.5 mr-1" />Create & Continue</button></div>
          </div>
        )}

        {wStep === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-zinc-200 p-6 text-center cursor-pointer hover:border-brand-300" onClick={() => fileRef.current?.click()}>
              <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <div className="text-[13px] font-semibold text-zinc-700">Drop CSV / TSV / JSON / Excel here or click to browse</div>
              <div className="text-[11px] text-zinc-400 mt-1">Max 10 MB · 10,000 rows · supported columns auto-mapped (Name, Mobile, PAN, Loan Amount, …)</div>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.json,.xlsx,.xls" className="hidden" onChange={onFile} />
            </div>
            <div className="flex flex-wrap gap-2">
              {[["Personal Loan", "personal"], ["Business Loan", "business"], ["Home Loan", "home"], ["LAP", "lap"], ["Vehicle / Equipment", "vehicle"], ["All Columns", "all"]].map(([l, t]) => (
                <button key={t} className="btn btn-secondary text-[11px]" onClick={() => downloadTemplate(t)}><Download className="w-3 h-3 mr-1" />Template: {l}</button>
              ))}
            </div>
          </div>
        )}

        {wStep === 2 && fileInfo && (
          <div className="space-y-4">
            <div className="text-[11.5px] text-zinc-500">{fileInfo.rows} rows parsed — auto-mapped columns (adjust if needed, then Save):</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {fileInfo.header.map((h: string, i: number) => {
                const field = Object.keys(mapping).find((k) => mapping[k] === i);
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10.5px] text-zinc-500 flex-1 truncate">{h}</span>
                    <select className="input text-[11px] py-1 w-36" value={field ?? ""} onChange={(e) => {
                      const next = { ...mapping };
                      if (field) delete next[field];
                      if (e.target.value) next[e.target.value] = i;
                      setMapping(next);
                    }}>
                      <option value="">— ignore —</option>
                      {mappedFields.map((mf) => <option key={mf} value={mf}>{mf}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary text-[12px]" disabled={busy} onClick={saveMapping}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Save Mapping & Validate</button>
          </div>
        )}

        {wStep >= 3 && wStep <= 5 && (
          <div className="space-y-4">
            {wStep === 3 && (
              <>
                <div className="text-[11.5px] text-zinc-500">Validation engine checks mobile / PAN / email / DOB / pincode / loan amount / tenure formats.</div>
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={validate}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Run Validation</button>
              </>
            )}
            {wStep === 4 && (
              <>
                <ValidationSummary detail={detail} />
                <div className="text-[11.5px] text-zinc-500">Duplicate detection checks existing customers, applicants and within-batch mobile/PAN/email.</div>
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={dedupe}><Layers className="w-3.5 h-3.5 mr-1" />Run Duplicate Check</button>
              </>
            )}
            {wStep === 5 && (
              <>
                <ValidationSummary detail={detail} />
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={preview}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Generate Preview</button>
              </>
            )}
            <div className="max-h-64 overflow-y-auto">
              {detail?.errors?.filter((e: any) => e.status === "open").slice(0, 20).map((e: any) => (
                <div key={e.id} className="flex justify-between items-start gap-3 border-b border-zinc-50 py-1.5 text-[11px]">
                  <div><span className="text-zinc-400">Row {e.row_no}</span> · <span className="font-semibold text-zinc-700">{e.message}</span></div>
                  <div className="text-zinc-400 text-right max-w-xs">{e.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {wStep === 6 && detail && (
          <div className="space-y-4">
            <div className="text-[13px] font-bold text-zinc-800">Batch Preview — {detail.batch.name}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {detail.byStatus?.map((s: any) => (
                <div key={s.status} className="rounded-xl border border-zinc-200 p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">{s.status}</div>
                  <div className="text-[18px] font-bold text-zinc-800">{s.n}</div>
                </div>
              ))}
            </div>
            <div className="text-[11.5px] text-zinc-500">Ready to process {detail.batch.valid} applicants through KYC → credit → match → application → submission → disbursement (demo).</div>
            <button className="btn btn-primary text-[12px]" disabled={busy} onClick={process}><Rocket className="w-3.5 h-3.5 mr-1" />Process {detail.batch.valid} Applicants</button>
          </div>
        )}

        {wStep === 7 && (
          <div className="text-center py-6">
            {busy ? (
              <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-zinc-700"><Loader2 className="w-4 h-4 animate-spin text-brand-600" />Processing batch in background pipeline…</div>
            ) : (
              <div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-[14px] font-bold text-zinc-800">Batch processed</div>
                <div className="text-[11.5px] text-zinc-500 mt-1">Applicants created, applications submitted and disbursement/payout outcomes recorded — every row individually traceable.</div>
                <button className="btn btn-primary text-[12px] mt-3" onClick={() => { setWizard(false); if (batch) openDetail(batch.id); }}>Open Batch Command Center</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ---------------- Batch detail ---------------- */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.batch ? `${detail.batch.name} — Batch #${detail.batch.id}` : ""} width="max-w-4xl">
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={detail.batch.status}>{detail.batch.status}</Badge>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">DEMO / SANDBOX</span>
              {detail.batch.status !== "completed" && detail.batch.status !== "cancelled" && (
                <>
                  {detail.batch.status !== "paused"
                    ? <button className="btn btn-secondary text-[11px]" onClick={() => control("pause")}><Pause className="w-3 h-3 mr-1" />Pause</button>
                    : <button className="btn btn-secondary text-[11px]" onClick={() => control("resume")}><Play className="w-3 h-3 mr-1" />Resume</button>}
                  <button className="btn btn-secondary text-[11px]" onClick={() => control("cancel")}><XCircle className="w-3 h-3 mr-1" />Cancel</button>
                </>
              )}
              <button className="btn btn-secondary text-[11px]" onClick={() => control("retry")}><RotateCcw className="w-3 h-3 mr-1" />Retry Failed</button>
              <button className="btn btn-secondary text-[11px]" onClick={() => doExport("")}><Download className="w-3 h-3 mr-1" />Export CSV</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11.5px]">
              {[["Source", detail.batch.source], ["Created", fmtDate(detail.batch.created_at)], ["Rows", detail.batch.total_rows], ["Valid", detail.batch.valid],
                ["Duplicates", detail.batch.duplicates], ["Invalid", detail.batch.invalid], ["Missing", detail.batch.missing], ["Priority", detail.batch.priority]].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-zinc-100 px-2.5 py-2"><div className="text-[9px] uppercase text-zinc-400 font-semibold">{l}</div><div className="font-bold text-zinc-800 mt-0.5">{v}</div></div>
              ))}
            </div>

            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${detail.batch.progress ?? 0}%` }} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[["overview", "Overview"], ["applicants", "Applicants"], ["errors", "Errors"], ["jobs", "Jobs"]].map(([k, l]) => (
                <button key={k} onClick={() => setDetailTab(k)} className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border ${detailTab === k ? "bg-brand-600 text-white border-brand-600" : "bg-white text-zinc-600 border-zinc-200"}`}>{l}</button>
              ))}
            </div>

            {detailTab === "overview" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[["Applicants Created", detail.batch.applicants_created], ["Applications Created", detail.batch.applications_created], ["Submitted", detail.batch.submitted],
                  ["Approved", detail.batch.approved], ["Disbursed", detail.batch.disbursed], ["Total Disbursement", fmtInr(detail.batch.disbursed_amount)],
                  ["Expected Payout (1% demo)", fmtInr(detail.batch.expected_payout)], ["Open Errors", detail.batch.open_errors ?? 0]].map(([l, v]) => (
                  <div key={l} className="rounded-xl border border-zinc-200 p-3"><div className="text-[9.5px] uppercase text-zinc-400 font-semibold">{l}</div><div className="text-[15px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
                ))}
              </div>
            )}

            {detailTab === "applicants" && (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead><tr className="text-[10px] uppercase text-zinc-400 border-b border-zinc-100">
                    <th className="px-3 py-2">Row</th><th className="px-3 py-2">Applicant</th><th className="px-3 py-2">Loan</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">App</th><th className="px-3 py-2">Error</th>
                  </tr></thead>
                  <tbody>
                    {detail.rows.map((r: any) => {
                      const m = JSON.parse(r.mapped ?? "{}");
                      return (
                        <tr key={r.id} className="border-b border-zinc-50 text-[11.5px]">
                          <td className="px-3 py-2 text-zinc-400">{r.row_no}</td>
                          <td className="px-3 py-2 font-semibold text-zinc-800">{m.name ?? "—"}</td>
                          <td className="px-3 py-2 text-zinc-600">{m.loan_type ?? "—"}</td>
                          <td className="px-3 py-2">{fmtInr(Number(m.loan_amount) || 0)}</td>
                          <td className="px-3 py-2"><Badge status={r.status}>{r.status?.replace(/_/g, " ")}</Badge></td>
                          <td className="px-3 py-2 text-zinc-500">{r.application_id ? `#${r.application_id}` : "—"}</td>
                          <td className="px-3 py-2 text-rose-600 max-w-[200px] truncate" title={r.error ?? ""}>{r.error ?? ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {detailTab === "errors" && (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {detail.errors.map((e: any) => (
                  <div key={e.id} className="rounded-lg border border-zinc-100 px-3 py-2">
                    <div className="flex justify-between gap-2 text-[11.5px]"><span className="text-zinc-400">Row {e.row_no}</span><Badge status={e.category}>{e.category}</Badge></div>
                    <div className="text-[12px] font-semibold text-zinc-800 mt-0.5">{e.message}</div>
                    <div className="text-[10.5px] text-zinc-400 mt-0.5">Recommendation: {e.recommendation}</div>
                  </div>
                ))}
                {!detail.errors.length && <EmptyState title="No errors" sub="This batch processed cleanly" />}
              </div>
            )}

            {detailTab === "jobs" && (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[["Total", detail.jobs?.total ?? 0], ["Completed", detail.jobs?.completed ?? 0], ["Failed", detail.jobs?.failed ?? 0], ["Pending", detail.jobs?.pending ?? 0]].map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-zinc-100 px-2.5 py-2 text-center"><div className="text-[9px] uppercase text-zinc-400 font-semibold">{l}</div><div className="text-[15px] font-bold text-zinc-800">{v}</div></div>
                  ))}
                </div>
                {detail.jobRows.map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-1.5 text-[11px]">
                    <div><span className="text-zinc-400">Row {j.row_no}</span> · <span className="font-semibold text-zinc-700">{j.job_type}</span></div>
                    <div className="flex items-center gap-2"><span className="text-zinc-400">{j.provider ?? "—"}</span><Badge status={j.status}>{j.status}</Badge></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function ValidationSummary({ detail }: { detail: any }) {
  const byStatus = detail?.byStatus ?? [];
  const total = byStatus.reduce((s: number, x: any) => s + x.n, 0) || detail?.batch?.total_rows;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"><div className="text-[9.5px] uppercase text-emerald-600 font-semibold">Total</div><div className="text-[18px] font-bold text-zinc-800">{total}</div></div>
      {byStatus.map((s: any) => (
        <div key={s.status} className="rounded-xl border border-zinc-200 p-3">
          <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">{s.status}</div>
          <div className={`text-[18px] font-bold ${s.status === "valid" ? "text-emerald-600" : s.status === "duplicate" ? "text-amber-600" : s.status === "invalid" || s.status === "missing" ? "text-rose-600" : "text-zinc-800"}`}>{s.n}</div>
        </div>
      ))}
    </div>
  );
}
