import { useEffect, useState } from "react";
import { api, fmtDate, fmtDateTime } from "../lib/api";
import { PageHeader, Card, CardTitle, Badge, Tabs, Stat, Modal, Field } from "../components/ui";
import { ImportExport, AnyFileImport, SchemeForm } from "./gn/shared";

export default function Compliance() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("rules");
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState<any>({ category: "Service", priority: "medium", subject: "", description: "" });
  const [customers, setCustomers] = useState<any[]>([]);

  // Scheme compliance state
  const [schemes, setSchemes] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [schemeMsg, setSchemeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => api("/admin/compliance").then(setData);
  const loadSchemes = () => api("/gn/schemes").then(setSchemes).catch(() => setSchemes([]));
  const loadFiles = () => api("/gn/scheme-files").then(setFiles).catch(() => setFiles([]));
  useEffect(() => { load(); api("/customers?limit=100").then((r) => setCustomers(r.rows)); loadSchemes(); loadFiles(); }, []);

  if (!data) return null;

  const today = new Date().toISOString().slice(0, 10);
  const schemeStatus = (s: any) => {
    if (s.status === "inactive" || s.status === "blocked") return { badge: s.status, note: "Not accepting applications" };
    if (s.effective_to && s.effective_to < today) return { badge: "expired", note: `Expired ${fmtDate(s.effective_to)}` };
    if (s.effective_from && s.effective_from > today) return { badge: "scheduled", note: `Effective ${fmtDate(s.effective_from)}` };
    return { badge: "active", note: `Live since ${s.effective_from ? fmtDate(s.effective_from) : "—"}` };
  };

  return (
    <div>
      <PageHeader title="Compliance Center" sub="KYC · AML · Consent · KFS · Schemes · Grievance — India-focused compliance-control framework" breadcrumb="Compliance" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="KYC verified" value={data.kycStats?.verified ?? 0} tone="green" />
        <Stat label="KYC pending" value={data.kycStats?.pending ?? 0} tone="amber" />
        <Stat label="Active consents" value={data.consents?.filter((c: any) => c.status === "active").length ?? 0} />
        <Stat label="Open complaints" value={data.complaints?.filter((c: any) => ["open", "in_progress"].includes(c.status)).length ?? 0} tone="red" />
      </div>

      <Tabs active={tab} onChange={setTab} items={[
        { key: "rules", label: "Compliance rules", count: data.rules?.length },
        { key: "schemes", label: "Scheme compliance", count: schemes.length },
        { key: "consents", label: "Consents", count: data.consents?.length },
        { key: "kyc", label: "KYC records", count: data.kyc?.length },
        { key: "complaints", label: "Grievances", count: data.complaints?.length }
      ]} />

      {tab === "schemes" && (
        <div className="space-y-4">
          {/* Add your scheme here — banker form, integrated directly into the Compliance dashboard */}
          <Card>
            <CardTitle title="Add your scheme here" sub="Banker scheme form — publish a scheme live to the feed, matcher and this compliance register" right={schemeMsg ? <span className={`text-[11px] font-semibold ${schemeMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>{schemeMsg.text}</span> : null} />
            <SchemeForm compact onSaved={() => { setSchemeMsg({ ok: true, text: "Scheme published & registered for compliance tracking" }); loadSchemes(); loadFiles(); }} />
          </Card>

          {/* Scheme documents — bank circulars & policy files uploaded in any format */}
          <Card>
            <CardTitle title="Scheme documents" sub="Bank circulars & policy files uploaded in any format — PDF, Excel, image, CSV — retained for compliance review" right={
              <div className="flex items-center gap-2">
                <AnyFileImport entity="schemes" onImported={loadFiles} />
              </div>
            } />
            {files.length === 0 ? (
              <div className="text-[12px] text-zinc-400 py-8 text-center">No scheme documents yet. Upload a bank circular (PDF / Excel / image) — it is stored here for review.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b border-zinc-200 text-zinc-400 text-left">
                    <th className="th">Document</th><th className="th">Scheme / Lender</th><th className="th">Kind</th><th className="th">Size</th><th className="th">Uploaded</th><th className="th">Status</th><th className="th"></th>
                  </tr></thead>
                  <tbody>
                    {files.map((f: any) => (
                      <tr key={f.id} className="border-b border-zinc-50 hover:bg-zinc-50/40">
                        <td className="td">
                          <div className="font-medium text-zinc-800">{f.filename}</div>
                          <div className="text-[10.5px] text-zinc-400">{f.mime || "—"}</div>
                        </td>
                        <td className="td text-zinc-600">{f.scheme_name || "—"}{f.lender_name ? ` · ${f.lender_name}` : ""}</td>
                        <td className="td capitalize text-zinc-500">{f.kind || "—"}</td>
                        <td className="td text-zinc-500">{f.size ? `${(f.size / 1024).toFixed(1)} KB` : "—"}</td>
                        <td className="td text-zinc-500">{fmtDateTime(f.created_at)}</td>
                        <td className="td"><Badge status={f.status === "pending_review" ? "amber" : "green"} />{f.notes && <div className="text-[10px] text-zinc-400 mt-0.5">{f.notes}</div>}</td>
                        <td className="td">
                          <div className="flex gap-1 justify-end">
                            {f.has_content && <a className="btn btn-secondary btn-sm" href={`/api/gn/scheme-files/${f.id}/download`} download>Download</a>}
                            <button className="btn btn-secondary btn-sm" onClick={async () => { if (!confirm(`Delete ${f.filename}?`)) return; await api(`/gn/scheme-files/${f.id}`, { method: "DELETE" }); loadFiles(); }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle title="Scheme compliance register" sub="Every lender scheme with effective dates, policy and product eligibility — versioned and audit-logged" right={
              <div className="flex items-center gap-2">
                <ImportExport entity="schemes" onImported={loadSchemes} />
              </div>
            } />
            {schemes.length === 0 ? (
              <div className="text-[12px] text-zinc-400 py-8 text-center">No schemes registered yet. Use “Add scheme” or import a CSV.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="border-b border-zinc-200 text-zinc-400 text-left">
                    <th className="th">Scheme</th><th className="th">Bank / Lender</th><th className="th">Profile</th><th className="th">Loan range</th><th className="th">ROI</th><th className="th">Commission</th><th className="th">Effective</th><th className="th">Policy</th><th className="th">Status</th>
                  </tr></thead>
                  <tbody>
                    {schemes.map((s: any) => {
                      const st = schemeStatus(s);
                      let lp: any = {}, el: any = {}, pol: any = {};
                      try { lp = JSON.parse(s.loan_params || "{}"); } catch { }
                      try { el = JSON.parse(s.eligibility || "{}"); } catch { }
                      try { pol = JSON.parse(s.policy || "{}"); } catch { }
                      return (
                        <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50/40">
                          <td className="td">
                            <div className="font-medium text-zinc-800">{s.name}</div>
                            <div className="text-[10.5px] text-zinc-400">{s.product_name || s.product_category || "—"}</div>
                          </td>
                          <td className="td text-zinc-600">{s.lender_name}</td>
                          <td className="td capitalize text-zinc-600">{s.profile || "—"}</td>
                          <td className="td text-zinc-600">{lp.min_amount || lp.max_amount ? `₹${(lp.min_amount ?? 0).toLocaleString("en-IN")} – ₹${(lp.max_amount ?? "—").toLocaleString("en-IN")}` : "—"}</td>
                          <td className="td text-zinc-600">{lp.roi_min != null ? `${lp.roi_min}–${lp.roi_max ?? "—"}%` : "—"}</td>
                          <td className="td num font-semibold">{s.commission_pct ?? s.rate ?? 0}%</td>
                          <td className="td text-zinc-500">{s.effective_from ? fmtDate(s.effective_from) : "—"}{s.effective_to ? ` → ${fmtDate(s.effective_to)}` : ""}</td>
                          <td className="td">
                            <div className="flex flex-wrap gap-1">
                              {pol.cibil_required && <Badge status="indigo">CIBIL req.</Badge>}
                              {(pol.negative_list?.length ?? 0) > 0 && <Badge status="critical">Negative list ({pol.negative_list.length})</Badge>}
                              {el.max_ltv != null && <Badge status="zinc">LTV ≤ {el.max_ltv}%</Badge>}
                              {el.min_credit_score != null && <Badge status="zinc">Score ≥ {el.min_credit_score}</Badge>}
                              {el.max_foir != null && <Badge status="zinc">FOIR ≤ {el.max_foir}%</Badge>}
                              {!pol.cibil_required && !(pol.negative_list?.length) && el.max_ltv == null && el.min_credit_score == null && <span className="text-zinc-300 text-[11px]">No policy configured</span>}
                            </div>
                          </td>
                          <td className="td"><Badge status={st.badge} /> <div className="text-[10px] text-zinc-400 mt-0.5">{st.note}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "rules" && (
        <Card>
          <CardTitle title="Compliance rule versions" sub="Every rule carries source, effective dates, version and configurable policy" />
          <div className="divide-y divide-zinc-50">
            {data.rules?.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 py-3">
                <div className="w-14 shrink-0"><Badge status="indigo">{r.rule_id}</Badge></div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-zinc-800">{r.name} <span className="text-zinc-400 font-normal">· v{r.version}</span></div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{JSON.parse(r.config || "{}").description || "—"}</div>
                  <div className="text-[10.5px] text-zinc-400 mt-0.5">Source: {r.source} · effective {fmtDate(r.effective_from)}{r.expiry ? ` → ${fmtDate(r.expiry)}` : ""}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "consents" && (
        <Card>
          <CardTitle title="Consent ledger" sub="Type · purpose · channel · status — evidence retained" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-zinc-200 text-zinc-400 text-left">
                <th className="th">Customer</th><th className="th">Type</th><th className="th">Purpose</th><th className="th">Channel</th><th className="th">Obtained</th><th className="th">Status</th>
              </tr></thead>
              <tbody>
                {data.consents?.map((c: any) => (
                  <tr key={c.id} className="border-b border-zinc-50">
                    <td className="td font-medium">{c.customer_name}</td>
                    <td className="td capitalize">{c.type}</td>
                    <td className="td text-zinc-500">{c.purpose || "—"}</td>
                    <td className="td capitalize text-zinc-500">{c.channel}</td>
                    <td className="td text-zinc-500">{fmtDateTime(c.obtained_at)}</td>
                    <td className="td"><Badge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "kyc" && (
        <Card>
          <CardTitle title="KYC verification records" sub="Verification source, reference, consent and audit are always retained" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-zinc-200 text-zinc-400 text-left">
                <th className="th">Customer</th><th className="th">Type</th><th className="th">Provider</th><th className="th">Reference</th><th className="th">Verified</th><th className="th">Expires</th><th className="th">Status</th>
              </tr></thead>
              <tbody>
                {data.kyc?.map((k: any) => (
                  <tr key={k.id} className="border-b border-zinc-50">
                    <td className="td font-medium">{k.customer_name}</td>
                    <td className="td uppercase">{k.type}</td>
                    <td className="td text-zinc-500">{k.provider} {k.provider?.startsWith("MOCK") && <Badge status="sandbox">SANDBOX</Badge>}</td>
                    <td className="td font-mono text-[11px]">{k.reference_id}</td>
                    <td className="td text-zinc-500">{k.verified_at ? fmtDate(k.verified_at) : "—"}</td>
                    <td className="td text-zinc-500">{k.expires_at ? fmtDate(k.expires_at) : "—"}</td>
                    <td className="td"><Badge status={k.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "complaints" && (
        <Card>
          <CardTitle title="Customer grievance center" sub="Acknowledge → assign → resolve within SLA, with escalation" right={
            <button className="btn btn-primary btn-sm" onClick={() => setComplaintOpen(true)}>New complaint</button>
          } />
          <div className="divide-y divide-zinc-50">
            {data.complaints?.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium text-zinc-800">{c.complaint_no}</span>
                    <Badge status={c.priority} />
                    <span className="text-[12px] text-zinc-500">{c.subject}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{c.customer_name || "—"} · {c.category} · {fmtDate(c.created_at)} · SLA {c.sla_hours}h{c.resolved_at ? ` · resolved ${fmtDate(c.resolved_at)}` : ""}</div>
                  {c.resolution && <div className="text-[11px] text-zinc-500 mt-1">Resolution: {c.resolution}</div>}
                </div>
                <Badge status={c.status} />
                {["open", "in_progress"].includes(c.status) && (
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={async () => { await api(`/admin/complaints/${c.id}`, { method: "PATCH", body: { status: "in_progress" } }); load(); }}>Progress</button>
                    <button className="btn btn-primary btn-sm" onClick={async () => { const r = prompt("Resolution notes:"); await api(`/admin/complaints/${c.id}`, { method: "PATCH", body: { status: "resolved", resolution: r || "Resolved" } }); load(); }}>Resolve</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={complaintOpen} onClose={() => setComplaintOpen(false)} title="Raise customer complaint">
        <div className="space-y-3">
          <Field label="Customer">
            <select className="input" value={complaint.customer_id ?? ""} onChange={(e) => setComplaint({ ...complaint, customer_id: Number(e.target.value) })}>
              <option value="">Select customer…</option>
              {customers.slice(0, 100).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><input className="input" value={complaint.category} onChange={(e) => setComplaint({ ...complaint, category: e.target.value })} /></Field>
            <Field label="Priority">
              <select className="input" value={complaint.priority} onChange={(e) => setComplaint({ ...complaint, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </Field>
          </div>
          <Field label="Subject"><input className="input" value={complaint.subject} onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input min-h-16" value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setComplaintOpen(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={!complaint.customer_id || !complaint.subject} onClick={async () => { await api("/admin/complaints", { method: "POST", body: complaint }); setComplaintOpen(false); setComplaint({ category: "Service", priority: "medium", subject: "", description: "" }); load(); }}>Register complaint</button>
        </div>
      </Modal>
    </div>
  );
}
