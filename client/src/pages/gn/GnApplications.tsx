import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Drawer, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { ImportExport } from "./shared";
import { gnBadge, gnStatusLabel, GN_STAGE_LABELS } from "../../lib/gn";
import { ProcessFlow, WorkflowStepper } from "./shared";
import { LayoutList, KanbanSquare, Plus, Search, RefreshCw } from "lucide-react";

const STAGE_GROUPS = ["lead", "application", "lender", "agreement", "disbursement", "completed"];

export function GnApplications() {
  const [rows, setRows] = useState<any[]>([]);
  const [lenders, setLenders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [lenderId, setLenderId] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (lenderId) params.set("lender_id", lenderId);
    params.set("limit", "200");
    api(`/gn/applications?${params}`).then((r) => { setRows(r.rows); setCounts(r.counts); });
  };
  useEffect(() => {
    load();
    api("/gn/lenders").then(setLenders).catch(() => {});
    api("/gn/products").then((r) => setProducts(r.rows)).catch(() => {});
    api("/gn/partners").then(setPartners).catch(() => {});
  }, []);
  useEffect(load, [status, lenderId]);

  const openDetail = async (id: number) => {
    setDetailId(id);
    const r = await api(`/gn/applications/${id}`);
    setDetail(r);
  };
  const act = async (fn: () => Promise<any>) => {
    setBusy(true);
    try { await fn(); await openDetail(detailId!); load(); } finally { setBusy(false); }
  };
  const app = detail?.application;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Loan Applications"
        sub="Track applications from logged through sanction to disbursement — commissions auto-calculate on disbursement"
        breadcrumb="Growth Nations / Loan Applications"
        actions={
          <div className="flex items-center gap-2">
            <ImportExport entity="applications" />
            <button className="btn btn-secondary text-[12px]" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</button>
            <button className="btn btn-primary text-[12px]" onClick={() => setCreateOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Application</button>
          </div>
        }
      />

      <ProcessFlow status={rows[0]?.status} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Apps", counts.total ?? 0], ["At Lender", counts.at_lender ?? 0], ["Disbursed", counts.disbursed ?? 0], ["Rejected", counts.rejected ?? 0]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div>
            <div className="text-[19px] font-bold text-zinc-800 mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      <Card pad={false}>
        <div className="p-3 border-b border-zinc-100 flex flex-wrap items-center gap-2">
          <div className="flex items-center flex-1 min-w-[220px] border border-zinc-200 rounded-lg px-2.5 bg-white">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input className="input border-0 shadow-none flex-1 text-[12.5px]" placeholder="Search by ref, borrower or mobile…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          </div>
          <select className="input text-[12.5px] w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {["lead", "application", "lender", "agreement", "disbursement", "completed"].map((g) => (
              <optgroup key={g} label={GN_STAGE_LABELS[g]}>
                {statusesInGroup(g).map((s) => <option key={s} value={s}>{gnStatusLabel(s)}</option>)}
              </optgroup>
            ))}
          </select>
          <select className="input text-[12.5px] w-auto" value={lenderId} onChange={(e) => setLenderId(e.target.value)}>
            <option value="">All banks</option>
            {lenders.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select className="input text-[12.5px] w-auto" defaultValue="">
            <option value="">All products</option>
            {products.slice(0, 40).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input text-[12.5px] w-auto" defaultValue="">
            <option value="">All agents</option>
          </select>
          <select className="input text-[12.5px] w-auto" defaultValue="">
            <option value="">All partners</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
            <button className={`px-2.5 py-1.5 ${view === "list" ? "bg-brand-600 text-white" : "bg-white text-zinc-500"}`} onClick={() => setView("list")}><LayoutList className="w-3.5 h-3.5" /></button>
            <button className={`px-2.5 py-1.5 ${view === "kanban" ? "bg-brand-600 text-white" : "bg-white text-zinc-500"}`} onClick={() => setView("kanban")}><KanbanSquare className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {view === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                  <th className="px-3 py-2.5 font-semibold">Ref</th>
                  <th className="px-3 py-2.5 font-semibold">Borrower</th>
                  <th className="px-3 py-2.5 font-semibold">Mobile</th>
                  <th className="px-3 py-2.5 font-semibold">Bank</th>
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Applied Amt</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Commission</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">TAT</th>
                  <th className="px-3 py-2.5 font-semibold">Assigned To</th>
                  <th className="px-3 py-2.5 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60 cursor-pointer" onClick={() => openDetail(r.id)}>
                    <td className="px-3 py-2.5 font-semibold text-brand-700">{r.ref}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-zinc-800">{r.name}</div>
                      {r.is_direct_booking ? <span className="text-[9.5px] text-violet-600 font-bold uppercase">Direct Booking</span> : null}
                      {r.is_cross_sell ? <span className="text-[9.5px] text-pink-600 font-bold uppercase">Cross Sell</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600">{r.mobile}</td>
                    <td className="px-3 py-2.5 text-zinc-700">{r.lender_name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{r.product_name ?? r.product_category ?? "—"}</td>
                    <td className="px-3 py-2.5 font-medium text-zinc-800 text-right">{fmtInr(r.amount)}</td>
                    <td className="px-3 py-2.5 text-right">{r.commission_gross > 0 ? <span className="font-semibold text-emerald-600">{fmtInr(r.commission_gross)}</span> : <span className="text-zinc-300">—</span>}</td>
                    <td className="px-3 py-2.5"><Badge status=""><span className={gnBadge(r.status)}>{gnStatusLabel(r.status)}</span></Badge></td>
                    <td className="px-3 py-2.5 text-zinc-500">{tatDays(r.created_at)}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{r.assigned_name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState title="No loan applications found" sub="Create an application or clear your filters" />}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 p-3">
            {STAGE_GROUPS.map((g) => {
              const items = rows.filter((r) => r.stage === g);
              return (
                <div key={g} className="rounded-lg bg-zinc-50/70 p-2 min-h-[180px]">
                  <div className="text-[10.5px] font-bold uppercase tracking-wide text-zinc-500 mb-2 px-1 flex items-center justify-between">
                    <span>{GN_STAGE_LABELS[g]}</span><span className="bg-white border border-zinc-200 rounded-full px-1.5 text-[9.5px]">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <div key={r.id} className="rounded-lg bg-white border border-zinc-200 px-3 py-2 cursor-pointer hover:border-brand-300" onClick={() => openDetail(r.id)}>
                        <div className="text-[10px] font-bold text-brand-700">{r.ref}</div>
                        <div className="text-[12px] font-semibold text-zinc-800 truncate">{r.name}</div>
                        <div className="text-[10.5px] text-zinc-400 truncate">{r.lender_name ?? "—"} · {r.product_category ?? ""}</div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11.5px] font-bold text-zinc-800">{fmtInr(r.amount)}</span>
                          {r.commission_gross > 0 && <span className="text-[10px] font-semibold text-emerald-600">{fmtInr(r.commission_gross)}</span>}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className="text-[10.5px] text-zinc-300 text-center py-3">Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} lenders={lenders} products={products} partners={partners} onCreated={() => { setCreateOpen(false); load(); }} />

      <Drawer open={detailId !== null} onClose={() => setDetailId(null)} title={app ? `${app.ref} — ${app.name}` : "Application"} width="max-w-4xl">
        {detail && app && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["Lender", app.lender_name ?? "—"], ["Product", app.product_name ?? app.product_category ?? "—"], ["Applied", fmtInr(app.amount)], ["Tenure", `${app.tenure} months`], ["Partner", app.partner_name ?? "—"], ["DSA Code", app.dsa_code ?? "—"], ["Assigned", app.assigned_name ?? "—"], ["Source", app.source ?? "—"]].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-zinc-100 px-3 py-2"><div className="text-[9.5px] uppercase tracking-wide text-zinc-400 font-semibold">{l}</div><div className="text-[12.5px] font-medium text-zinc-800 mt-0.5 truncate">{v}</div></div>
              ))}
            </div>

            {detail.commission && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-[12px]">
                <div><div className="text-[9.5px] text-emerald-700/60 uppercase">Disbursed</div><b>{fmtInr(detail.commission.disbursed_amount)}</b></div>
                <div><div className="text-[9.5px] text-emerald-700/60 uppercase">Rate</div><b>{detail.commission.rate}%</b></div>
                <div><div className="text-[9.5px] text-emerald-700/60 uppercase">Gross</div><b>{fmtInr(detail.commission.gross)}</b></div>
                <div><div className="text-[9.5px] text-emerald-700/60 uppercase">GST</div><b>{fmtInr(detail.commission.gst)}</b></div>
                <div><div className="text-[9.5px] text-emerald-700/60 uppercase">TDS</div><b>{fmtInr(detail.commission.tds)}</b></div>
                <div><div className="text-[9.5px] text-emerald-700/60 uppercase">Net</div><b>{fmtInr(detail.commission.net)}</b></div>
              </div>
            )}

            {/* Actions — walk the exact 13-step journey */}
            <div className="flex flex-wrap gap-2 pt-1">
              {app.stage === "application" && ["app_created", "kyc_pending", "kyc_complete", "docs_pending", "docs_complete", "lender_selected", "ready_submission"].includes(app.status) && (
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/advance`, { method: "POST" }))}>Advance Status →</button>
              )}
              {app.stage === "application" && ["docs_complete", "lender_selected", "ready_submission"].includes(app.status) && !app.lender_id && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/status`, { method: "PATCH", body: { status: "lender_selected", note: "Lender selected by team" } }))}>Mark Lender Selected</button>
              )}
              {app.stage === "application" && !["submitted", "uw", "query", "addl_docs", "on_hold", "approved", "rejected", "sanction_generated", "agreement_pending", "esign_pending", "agreement_completed", "disb_pending", "disb_initiated", "disb_partial", "disb_fully", "disb_failed", "disb_confirmed", "crm_updated", "commission_reconciled", "payout_pending", "payout_received", "closed"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/submit`, { method: "POST" }))}>Submit to Lender</button>
              )}
              {["submitted", "uw", "query", "addl_docs"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "underwrite" } }))}>Mock: Underwriting</button>
              )}
              {["uw", "query", "addl_docs"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "approve" } }))}>Mock: Approve</button>
              )}
              {["approved"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "agreement" } }))}>Mock: Agreement / eSign</button>
              )}
              {["agreement_completed", "disb_pending"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "disburse", amount: app.amount } }))}>Mock: Trigger Disbursement</button>
              )}
              {["disb_initiated"].includes(app.status) && (
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "fund", amount: app.disbursed_amount || app.amount } }))}>Mock: Funds → Borrower {fmtInr(app.disbursed_amount || app.amount)}</button>
              )}
              {["disb_fully"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "confirm" } }))}>Mock: Confirm Disbursement</button>
              )}
              {["disb_confirmed"].includes(app.status) && (
                <button className="btn btn-secondary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "crm" } }))}>Mock: CRM Update</button>
              )}
              {["crm_updated"].includes(app.status) && (
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "reconcile" } }))}>Mock: Reconcile Commission</button>
              )}
              <button className="btn btn-danger text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/applications/${app.id}/mock-lender`, { method: "POST", body: { action: "reject", note: "Declined by lender" } }))}>Reject</button>
              {detail.commission && detail.commission.status === "earned" && (
                <button className="btn btn-primary text-[12px]" disabled={busy} onClick={() => act(() => api(`/gn/finance/income/${detail.commission.id}/receive`, { method: "POST", body: { utr: "UTR" + Math.floor(100000000 + Math.random() * 899999999) } }))}>Mark Payout Received</button>
              )}
              <span className="text-[10.5px] text-zinc-400 self-center ml-1">Mock lender mode — final credit decision rests with the lender.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkflowStepper status={app.status} amount={app.disbursed_amount || app.amount} />
              <div>
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Timeline</div>
                <div className="space-y-0 max-h-[520px] overflow-y-auto pr-1">
                  {detail.timeline.map((t: any, i: number) => (
                    <div key={t.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === detail.timeline.length - 1 ? "bg-brand-500" : "bg-zinc-200"}`} />
                        {i < detail.timeline.length - 1 && <div className="w-px flex-1 bg-zinc-100" />}
                      </div>
                      <div className="pb-3.5">
                        <div className="text-[12px] font-semibold text-zinc-800">{t.event}</div>
                        {t.note && <div className="text-[11px] text-zinc-500">{t.note}</div>}
                        <div className="text-[10px] text-zinc-400 mt-0.5">{fmtDate(t.created_at)} · {t.actor_name ?? "system"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function statusesInGroup(group: string): string[] {
  return ["lead_new", "lead_contacted", "lead_qualified", "lead_requirement", "app_created", "kyc_pending", "kyc_complete", "docs_pending", "docs_complete", "lender_selected", "ready_submission", "submitted", "uw", "query", "addl_docs", "on_hold", "approved", "rejected", "sanction_generated", "agreement_pending", "esign_pending", "agreement_completed", "disb_pending", "disb_initiated", "disb_partial", "disb_fully", "disb_failed", "disb_confirmed", "crm_updated", "commission_reconciled", "payout_pending", "payout_received", "closed"].filter((s) => ({ lead: 0, application: 1, lender: 2, agreement: 3, disbursement: 4, completed: 5 })[group] === ({ lead_new: 0, lead_contacted: 0, lead_qualified: 0, lead_requirement: 0, app_created: 1, kyc_pending: 1, kyc_complete: 1, docs_pending: 1, docs_complete: 1, lender_selected: 1, ready_submission: 1, submitted: 2, uw: 2, query: 2, addl_docs: 2, on_hold: 2, approved: 2, rejected: 2, sanction_generated: 3, agreement_pending: 3, esign_pending: 3, agreement_completed: 3, disb_pending: 4, disb_initiated: 4, disb_partial: 4, disb_fully: 4, disb_failed: 4, disb_confirmed: 5, crm_updated: 5, commission_reconciled: 5, payout_pending: 5, payout_received: 5, closed: 5 })[s]);
}

function tatDays(created: string | null | undefined): string {
  if (!created) return "—";
  const d = Math.floor((Date.now() - new Date(created).getTime()) / 86400000);
  return d <= 0 ? "Today" : `${d}d`;
}

function CreateModal({ open, onClose, lenders, products, partners, onCreated }: any) {
  const [f, setF] = useState<any>({ name: "", mobile: "", amount: 500000, tenure: 36, loan_type: "Business Loan", source: "dsa" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/applications", { method: "POST", body: { ...f, amount: Number(f.amount), tenure: Number(f.tenure), product_id: f.product_id ? Number(f.product_id) : null, lender_id: f.lender_id ? Number(f.lender_id) : null, partner_id: f.partner_id ? Number(f.partner_id) : null } });
      onCreated();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Loan Application" wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Borrower name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" /></Field>
        <Field label="Mobile"><input className="input text-[12.5px]" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="10-digit mobile" /></Field>
        <Field label="Loan type"><select className="input text-[12.5px]" value={f.loan_type} onChange={(e) => set("loan_type", e.target.value)}>{["Business Loan", "Home Loan", "Loan Against Property", "Personal Loan", "Commercial Vehicle", "Two Wheeler", "MSME", "Equipment Financing", "Working Capital", "Education Loan", "Gold Loan", "Agriculture", "Balance Transfer"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Amount (₹)"><input className="input text-[12.5px]" type="number" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
        <Field label="Tenure (months)"><input className="input text-[12.5px]" type="number" value={f.tenure} onChange={(e) => set("tenure", e.target.value)} /></Field>
        <Field label="Lender"><select className="input text-[12.5px]" value={f.lender_id ?? ""} onChange={(e) => set("lender_id", e.target.value || null)}><option value="">Select lender</option>{lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        <Field label="Product"><select className="input text-[12.5px]" value={f.product_id ?? ""} onChange={(e) => set("product_id", e.target.value || null)}><option value="">Select product</option>{products.filter((p: any) => !f.lender_id || p.lender_id === Number(f.lender_id)).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Partner / DSA"><select className="input text-[12.5px]" value={f.partner_id ?? ""} onChange={(e) => set("partner_id", e.target.value || null)}><option value="">Select partner</option>{partners.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}</select></Field>
        <Field label="Purpose" className="col-span-2"><input className="input text-[12.5px]" value={f.purpose ?? ""} onChange={(e) => set("purpose", e.target.value)} placeholder="e.g. Business expansion" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Creating…" : "Create Application"}</button>
      </div>
    </Modal>
  );
}
