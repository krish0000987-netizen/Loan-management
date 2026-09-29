import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Store, Users, BadgeCheck, ListTodo, FolderOpen, Upload, Settings2, SlidersHorizontal,
  BarChart3, UserCog, Calculator, Landmark, Plug, LayoutDashboard, FileText, Wallet as WalletIcon,
  GitPullRequest, BadgeDollarSign, RefreshCw, Zap, ShieldCheck, Clock, CheckCircle2, XCircle, Plus
} from "lucide-react";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { Card, CardTitle, PageHeader, Badge, Field, Modal, EmptyState } from "../../components/ui";
import { ImportExport } from "./shared";

const LEAD_STATUSES = ["new", "assigned", "contacted", "interested", "not_interested", "followup", "converted", "dnd", "wrong_number", "lost"];

type Tile = {
  key: string;
  name: string;
  desc: string;
  icon: any;
  to?: string;
  panel?: "approvals" | "documents" | "bulk-import" | "bulk-assign" | "crm";
  count?: number;
};

export function GnUtility() {
  const [ov, setOv] = useState<any>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const load = () => api("/gn/utility/overview").then(setOv).catch(() => {});
  useEffect(() => { load(); }, []);

  const tiles: Tile[] = [
    { key: "masters", name: "Masters", desc: "Banks, products, schemes & payout structure", icon: Store, to: "/gn/masters", count: 0 },
    { key: "team", name: "Team", desc: "Partners, DSAs, employees & hierarchy", icon: Users, to: "/gn/partners", count: ov?.team },
    { key: "approvals", name: "Approvals", desc: "Sign off leave, expense & conveyance claims", icon: BadgeCheck, panel: "approvals", count: (ov?.leavePending ?? 0) + (ov?.claimsPending ?? 0) },
    { key: "tasks", name: "Tasks", desc: "Your to-dos, reminders & follow-ups", icon: ListTodo, to: "/gn/tasks", count: ov?.tasksOpen },
    { key: "documents", name: "Documents", desc: "Shared files, templates & attachments", icon: FolderOpen, panel: "documents", count: ov?.docsPending },
    { key: "bulk-import", name: "Bulk Lead Import", desc: "Import leads from Excel/CSV + view import history", icon: Upload, panel: "bulk-import", count: ov?.imports?.length },
    { key: "configuration", name: "Configuration", desc: "Assignment rules, workflows & platform config", icon: Settings2, to: "/gn/configuration" },
    { key: "settings", name: "Settings", desc: "Company, branding, banks & general settings", icon: SlidersHorizontal, to: "/gn/settings" },
    { key: "reports", name: "Reports", desc: "Export, MIS & performance reports", icon: BarChart3, to: "/gn/reports" },
    { key: "bulk-assign", name: "Bulk Lead Assign", desc: "Reassign all leads matching a condition to a team member", icon: UserCog, panel: "bulk-assign" },
    { key: "tools", name: "Tools", desc: "EMI, eligibility & ROI calculators", icon: Calculator, to: "/gn/tools" },
    { key: "wallet", name: "Wallet", desc: "Payouts, receivables & partner wallet", icon: Landmark, to: "/gn/wallet" },
    { key: "api", name: "API", desc: "Verification APIs & integrations", icon: Plug, to: "/gn/apis" },
    { key: "crm", name: "CRM", desc: "Leads, applications, sanction & disbursement", icon: LayoutDashboard, panel: "crm" }
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Utility" sub="Cross-cutting workspace tools. Pick one to open it." breadcrumb="Growth Nations / Utility" />

      {/* Live KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          { l: "Approvals pending", v: (ov?.leavePending ?? 0) + (ov?.claimsPending ?? 0), s: "leave + claims" },
          { l: "Claim value", v: fmtInr(ov?.claimsValue), s: "pending payout" },
          { l: "Open tasks", v: ov?.tasksOpen ?? 0, s: "to-dos & follow-ups" },
          { l: "Documents", v: ov?.documents ?? 0, s: `${ov?.docsPending ?? 0} pending review` },
          { l: "Open leads", v: ov?.leadsOpen ?? 0, s: `of ${ov?.leads ?? 0} total` },
          { l: "Team size", v: ov?.team ?? 0, s: "users on platform" },
          { l: "Lead imports", v: ov?.imports?.length ?? 0, s: "recent batches" }
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{k.l}</div>
            <div className="text-[20px] font-bold text-zinc-900 mt-0.5 leading-tight">{k.v}</div>
            <div className="text-[10.5px] text-zinc-400">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Tool tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {tiles.map((t) => (
          t.to ? (
            <Link key={t.key} to={t.to} className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:bg-brand-600 group-hover:border-brand-600 transition-colors">
                  <t.icon className="w-4 h-4 text-brand-600 group-hover:text-white" />
                </div>
                {!!t.count && t.count > 0 && <Badge status=""><span className="text-[10.5px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{t.count}</span></Badge>}
              </div>
              <div className="text-[13px] font-bold text-zinc-800 mt-2.5">{t.name}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{t.desc}</div>
            </Link>
          ) : (
            <button key={t.key} onClick={() => setPanel(panel === t.panel ? null : t.panel!)} className={`group rounded-xl border p-4 text-left transition-all ${panel === t.panel ? "border-brand-400 bg-brand-50/40 ring-2 ring-brand-100" : "border-zinc-200 bg-white hover:border-brand-300 hover:shadow-sm"}`}>
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:bg-brand-600 group-hover:border-brand-600 transition-colors">
                  <t.icon className="w-4 h-4 text-brand-600 group-hover:text-white" />
                </div>
                {!!t.count && t.count > 0 && <Badge status=""><span className="text-[10.5px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{t.count}</span></Badge>}
              </div>
              <div className="text-[13px] font-bold text-zinc-800 mt-2.5">{t.name}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{t.desc}</div>
            </button>
          )
        ))}
      </div>

      {panel === "approvals" && <ApprovalsPanel onDone={load} />}
      {panel === "documents" && <DocumentsPanel onDone={load} />}
      {panel === "bulk-import" && <BulkImportPanel onDone={load} />}
      {panel === "bulk-assign" && <BulkAssignPanel onDone={load} />}
      {panel === "crm" && <CrmPanel />}
    </div>
  );
}

/* ================= Approvals — leave + expense/conveyance claims ================= */

function ApprovalsPanel({ onDone }: { onDone: () => void }) {
  const [leave, setLeave] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const load = () => {
    api<any[]>("/gn/hr/leave").then(setLeave).catch(() => {});
    api<any>("/gn/finance/expenses").then((r) => setClaims(r.rows ?? [])).catch(() => {});
    api<any[]>("/gn/team").then(setTeam).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const act = async (url: string, body: any, okText: string) => {
    try { await api(url, { method: "PATCH", body }); setMsg({ ok: true, text: okText }); load(); onDone(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  };
  const pendingLeave = leave.filter((l) => l.status === "pending");
  const pendingClaims = claims.filter((c) => c.status === "pending");

  return (
    <Card>
      <CardTitle title="Approvals" sub="Sign off leave, expense & conveyance claims — every decision is audited" right={<button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Claim</button>} />
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <div className="text-[11px] font-bold text-zinc-600 mb-2">Leave requests — {pendingLeave.length} pending</div>
          {pendingLeave.length === 0 && <EmptyState title="No pending leave" sub="All leave requests resolved" />}
          <div className="space-y-2">
            {pendingLeave.slice(0, 8).map((l: any) => (
              <div key={l.id} className="rounded-lg border border-zinc-100 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold text-zinc-800">{l.user_name} <span className="text-zinc-400 font-normal">· {l.leave_type} · {l.days}d</span></div>
                  <div className="text-[10.5px] text-zinc-400">{fmtDate(l.from_date)} → {fmtDate(l.to_date)} · {l.reason ?? "—"}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => act(`/gn/hr/leave/${l.id}`, { status: "approved" }, "Leave approved")} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><CheckCircle2 className="w-4 h-4" /></button>
                  <button onClick={() => act(`/gn/hr/leave/${l.id}`, { status: "rejected" }, "Leave rejected")} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><XCircle className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-zinc-600 mb-2">Expense & conveyance claims — {pendingClaims.length} pending · {fmtInr(pendingClaims.reduce((s, c) => s + (c.amount ?? 0), 0))}</div>
          {pendingClaims.length === 0 && <EmptyState title="No pending claims" sub="All claims resolved" />}
          <div className="space-y-2">
            {pendingClaims.slice(0, 8).map((c: any) => (
              <div key={c.id} className="rounded-lg border border-zinc-100 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold text-zinc-800">{c.title} <span className="text-zinc-400 font-normal">· {c.claim_type}</span></div>
                  <div className="text-[10.5px] text-zinc-400">{fmtInr(c.amount)} · {c.vendor ?? "—"} · {fmtDate(c.expense_date)}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => act(`/gn/finance/expenses/${c.id}`, { status: "approved" }, "Claim approved")} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><CheckCircle2 className="w-4 h-4" /></button>
                  <button onClick={() => act(`/gn/finance/expenses/${c.id}`, { status: "paid" }, "Claim marked paid")} className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"><WalletIcon className="w-4 h-4" /></button>
                  <button onClick={() => act(`/gn/finance/expenses/${c.id}`, { status: "rejected" }, "Claim rejected")} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><XCircle className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {msg && <div className={`mt-3 text-[11.5px] font-semibold px-3 py-2 rounded-lg border ${msg.ok ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-rose-700 border-rose-200 bg-rose-50"}`}>{msg.text}</div>}
      <ClaimModal open={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); onDone(); }} team={team} />
    </Card>
  );
}

function ClaimModal({ open, onClose, onDone, team }: { open: boolean; onClose: () => void; onDone: () => void; team: any[] }) {
  const [f, setF] = useState<any>({ title: "", claim_type: "expense", vendor: "", amount: "", claimant: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!f.title || !f.amount) { setErr("Title and amount are required"); return; }
    setBusy(true); setErr(null);
    try {
      await api("/gn/finance/expenses", { method: "POST", body: { title: f.title, claim_type: f.claim_type, vendor: f.vendor || null, amount: Number(f.amount), paid: false } });
      onDone();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New expense / conveyance claim">
      <div className="space-y-3">
        <Field label="Claim type"><select className="input text-[12.5px]" value={f.claim_type} onChange={(e) => setF({ ...f, claim_type: e.target.value })}><option value="expense">Expense</option><option value="conveyance">Conveyance</option></select></Field>
        <Field label="Title"><input className="input text-[12.5px]" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Client visit — Pune office" /></Field>
        <Field label="Vendor / detail"><input className="input text-[12.5px]" value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} placeholder="e.g. Cab + tolls" /></Field>
        <Field label="Amount (₹)"><input className="input text-[12.5px]" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        {team.length > 0 && (
          <Field label="Claimant"><select className="input text-[12.5px]" value={f.claimant} onChange={(e) => setF({ ...f, claimant: e.target.value })}><option value="">—</option>{team.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        )}
        {err && <div className="text-[11.5px] font-semibold text-rose-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit for approval"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= Documents ================= */

const DOC_TYPES = ["pan", "aadhaar", "address_proof", "bank_statement", "gst", "itr", "salary_slip", "business_reg", "property", "vehicle", "agreement", "kfs", "sanction", "noc", "other"];
const DOC_STATUSES = ["pending", "uploaded", "under_review", "verified", "rejected", "replacement", "expired"];

function DocumentsPanel({ onDone }: { onDone: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => {
    api<any>("/gn/documents").then((r) => { setRows(r.rows ?? []); setSummary(r.summary ?? []); }).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const setStatus = async (id: number, status: string) => {
    try { await api(`/gn/documents/${id}`, { method: "PATCH", body: { status } }); setMsg({ ok: true, text: `Document ${status}` }); load(); onDone(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  };
  const shown = filter ? rows.filter((d) => d.status === filter) : rows;
  return (
    <Card>
      <CardTitle title="Documents" sub="Shared files, templates & attachments — upload, verify and track expiry" right={<button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />Add Document</button>} />
      <div className="flex flex-wrap gap-1.5 mt-3">
        <button onClick={() => setFilter("")} className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${!filter ? "bg-zinc-800 text-white border-zinc-800" : "bg-white text-zinc-500 border-zinc-200"}`}>All · {rows.length}</button>
        {DOC_STATUSES.map((s) => {
          const n = summary.find((x: any) => x.status === s)?.n ?? 0;
          return <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${filter === s ? "bg-zinc-800 text-white border-zinc-800" : "bg-white text-zinc-500 border-zinc-200"}`}>{s} · {n}</button>;
        })}
      </div>
      {shown.length === 0 && <EmptyState title="No documents" sub="Upload documents or import them from applications" />}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Document</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">Linked to</th><th className="px-3 py-2.5 font-semibold">Uploaded by</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold text-right">Actions</th></tr></thead>
          <tbody>
            {shown.slice(0, 25).map((d: any) => (
              <tr key={d.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{d.name ?? d.doc_type}</td>
                <td className="px-3 py-2.5 text-zinc-500 uppercase text-[10.5px]">{d.doc_type}</td>
                <td className="px-3 py-2.5 text-zinc-500">{d.entity_type} #{d.entity_id}</td>
                <td className="px-3 py-2.5 text-zinc-500">{d.uploaded_by_name ?? "—"}</td>
                <td className="px-3 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === "verified" ? "bg-emerald-50 text-emerald-600" : d.status === "rejected" ? "bg-rose-50 text-rose-600" : d.status === "expired" ? "bg-zinc-100 text-zinc-500" : "bg-amber-50 text-amber-600"}`}>{d.status}</span></td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  {d.status !== "verified" && <button onClick={() => setStatus(d.id, "verified")} className="px-2 py-1 rounded-lg text-[10.5px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 mr-1">Verify</button>}
                  {d.status !== "rejected" && <button onClick={() => setStatus(d.id, "rejected")} className="px-2 py-1 rounded-lg text-[10.5px] font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100">Reject</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg && <div className={`mt-3 text-[11.5px] font-semibold px-3 py-2 rounded-lg border ${msg.ok ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-rose-700 border-rose-200 bg-rose-50"}`}>{msg.text}</div>}
      <DocModal open={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); onDone(); }} />
    </Card>
  );
}

function DocModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState<any>({ entity_type: "application", entity_id: "", doc_type: "pan", name: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!f.entity_id) { setErr("Linked entity ID is required"); return; }
    setBusy(true); setErr(null);
    try {
      await api("/gn/documents", { method: "POST", body: { ...f, entity_id: Number(f.entity_id), status: "uploaded" } });
      onDone();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add document">
      <div className="space-y-3">
        <Field label="Linked to"><select className="input text-[12.5px]" value={f.entity_type} onChange={(e) => setF({ ...f, entity_type: e.target.value })}><option value="customer">Customer</option><option value="application">Application</option><option value="partner">Partner / DSA</option><option value="payout">Payout</option></select></Field>
        <Field label="Entity ID"><input className="input text-[12.5px]" type="number" value={f.entity_id} onChange={(e) => setF({ ...f, entity_id: e.target.value })} /></Field>
        <Field label="Document type"><select className="input text-[12.5px]" value={f.doc_type} onChange={(e) => setF({ ...f, doc_type: e.target.value })}>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. PAN card scan" /></Field>
        {err && <div className="text-[11.5px] font-semibold text-rose-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save document"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= Bulk Lead Import ================= */

function BulkImportPanel({ onDone }: { onDone: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const load = () => api("/gn/utility/overview").then((r) => setHistory(r.imports ?? [])).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <Card>
      <CardTitle title="Bulk Lead Import" sub="Import leads from Excel/CSV — the template follows the CRM lead columns. Duplicate mobile / email rows are reported, never silently dropped." right={
        <ImportExport entity="leads" onImported={onDone} />
      } />
      <div className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-5 text-center">
        <Upload className="w-6 h-6 text-zinc-300 mx-auto" />
        <div className="text-[12.5px] font-semibold text-zinc-700 mt-2">Upload a CSV of leads</div>
        <div className="text-[11px] text-zinc-400 mt-0.5">Columns: name, mobile (required), email, city, state, loan_type, requested_amount, monthly_income, source, dsa_code</div>
      </div>
      <div className="text-[11px] font-bold text-zinc-600 mt-4 mb-2">Import history — {history.length} recent</div>
      {history.length === 0 && <EmptyState title="No imports yet" sub="Imports you run appear here with row counts" />}
      <div className="space-y-1.5">
        {history.map((h: any) => {
          let detail = "";
          try { const a = JSON.parse(h.after ?? "{}"); detail = a.inserted != null ? `${a.inserted} rows` : (a.count != null ? `${a.count} leads` : ""); } catch { /* ignore */ }
          return (
            <div key={h.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
              <div className="text-[12px] font-semibold text-zinc-700">{h.action}</div>
              <div className="text-[11px] text-zinc-400">{detail} · {fmtDate(h.created_at)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Link to="/gn/co/bulk" className="text-[11.5px] font-semibold text-brand-600 hover:text-brand-700">Open Bulk Applications command center →</Link>
      </div>
    </Card>
  );
}

/* ================= Bulk Lead Assign ================= */

function BulkAssignPanel({ onDone }: { onDone: () => void }) {
  const [team, setTeam] = useState<any[]>([]);
  const [f, setF] = useState<any>({ status: "", city: "", state: "", loan_type: "", assigned_to: "", search: "", target_user_id: "" });
  const [preview, setPreview] = useState<any>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<any[]>("/gn/team").then(setTeam).catch(() => {}); }, []);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const body = () => ({
    status: f.status || undefined, city: f.city || undefined, state: f.state || undefined,
    loan_type: f.loan_type || undefined, assigned_to: f.assigned_to ? Number(f.assigned_to) : null,
    search: f.search || undefined, target_user_id: Number(f.target_user_id)
  });
  const previewRun = async () => {
    if (!f.target_user_id) return;
    setBusy(true);
    try {
      const r = await api("/gn/utility/leads/assign", { method: "POST", body: { ...body(), dry_run: true } });
      setPreview(r); setDone(null);
    } catch (e: any) { setPreview({ error: e.message }); }
    finally { setBusy(false); }
  };
  const confirmRun = async () => {
    setBusy(true);
    try {
      const r = await api("/gn/utility/leads/assign", { method: "POST", body: body() });
      setDone(`✓ Reassigned ${r.assigned} leads to ${r.target}`); setPreview(null); onDone();
    } catch (e: any) { setPreview({ error: e.message }); }
    finally { setBusy(false); }
  };
  const inp = "input text-[12.5px]";
  return (
    <Card>
      <CardTitle title="Bulk Lead Assign" sub="Reassign all leads matching a condition to a team member — preview the count first, then confirm" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <Field label="Lead status"><select className={inp} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="">Any status</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="City"><input className={inp} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Mumbai" /></Field>
        <Field label="State"><input className={inp} value={f.state} onChange={(e) => set("state", e.target.value)} placeholder="e.g. Maharashtra" /></Field>
        <Field label="Loan type"><input className={inp} value={f.loan_type} onChange={(e) => set("loan_type", e.target.value)} placeholder="e.g. Home Loan" /></Field>
        <Field label="Currently assigned to"><select className={inp} value={f.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}><option value="">Anyone</option>{team.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Search name / mobile"><input className={inp} value={f.search} onChange={(e) => set("search", e.target.value)} placeholder="Contains…" /></Field>
        <Field label="Assign to *"><select className={inp} value={f.target_user_id} onChange={(e) => set("target_user_id", e.target.value)}><option value="">Select team member…</option>{team.map((u: any) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}</select></Field>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button className="btn btn-secondary text-[12px]" disabled={busy || !f.target_user_id} onClick={previewRun}><Clock className="w-3.5 h-3.5 mr-1" />{busy ? "Checking…" : "Preview affected leads"}</button>
        {preview && !preview.error && (
          <button className="btn btn-primary text-[12px]" disabled={busy} onClick={confirmRun}><ShieldCheck className="w-3.5 h-3.5 mr-1" />Confirm reassign {preview.count} leads</button>
        )}
      </div>
      {preview && !preview.error && (
        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/40 px-4 py-3">
          <div className="text-[12px] font-semibold text-zinc-800">{preview.count} leads match your condition{preview.amount ? ` · total requested ${fmtInr(preview.amount)}` : ""}</div>
          <div className="text-[11px] text-zinc-500">Will be reassigned to <b>{preview.target}</b> — confirm to apply.</div>
        </div>
      )}
      {preview?.error && <div className="mt-3 text-[11.5px] font-semibold text-rose-600">{preview.error}</div>}
      {done && <div className="mt-3 text-[11.5px] font-semibold text-emerald-700">{done}</div>}
    </Card>
  );
}

/* ================= CRM quick links ================= */

function CrmPanel() {
  const links = [
    { to: "/gn", label: "All / Dashboard", icon: LayoutDashboard },
    { to: "/gn/leads", label: "Leads", icon: FileText },
    { to: "/gn/applications", label: "Loan Applications", icon: GitPullRequest },
    { to: "/gn/sanction", label: "Sanction Loan", icon: BadgeDollarSign },
    { to: "/gn/disbursement", label: "Disbursement", icon: WalletIcon },
    { to: "/gn/cross-selling", label: "Cross Selling", icon: RefreshCw },
    { to: "/gn/direct-booking", label: "Direct Booking", icon: Zap }
  ];
  return (
    <Card>
      <CardTitle title="CRM" sub="Every pipeline workspace in one place — open the module you need" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all">
            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
              <l.icon className="w-4 h-4 text-brand-600 group-hover:text-white" />
            </div>
            <div className="text-[13px] font-bold text-zinc-800 mt-2.5">{l.label}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Open {l.label} workspace</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
