import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { gnBadge, gnStatusLabel } from "../../lib/gn";
import { ProcessFlow, ImportExport } from "./shared";
import { Plus } from "lucide-react";

export function GnLeads() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api("/gn/applications?stage=lead&limit=100").then((r) => setRows(r.rows)).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="Leads" sub="Every lead captured from DSA, telecalling, web and WhatsApp — scored and assigned to your team" breadcrumb="Growth Nations / CRM / Leads"
        actions={<div className="flex items-center gap-2"><ImportExport entity="leads" onImported={load} /><button className="btn btn-primary text-[12px]" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />Quick Lead</button></div>} />
      <ProcessFlow status="lead_new" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["New", rows.filter((r) => r.status === "lead_new").length], ["Contacted", rows.filter((r) => r.status === "lead_contacted").length], ["Qualified", rows.filter((r) => r.status === "lead_qualified").length], ["Requirement", rows.filter((r) => r.status === "lead_requirement").length]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div><div className="text-[19px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Lead</th><th className="px-3 py-2.5 font-semibold">Mobile</th><th className="px-3 py-2.5 font-semibold">Product</th>
                <th className="px-3 py-2.5 font-semibold text-right">Requested</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Source</th><th className="px-3 py-2.5 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5"><div className="font-semibold text-zinc-800">{r.name}</div><div className="text-[11px] text-zinc-400">{r.ref}</div></td>
                  <td className="px-3 py-2.5 text-zinc-600">{r.mobile}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.loan_type}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800 text-right">{fmtInr(r.amount)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={gnBadge(r.status)}>{gnStatusLabel(r.status)}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.source}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="No leads yet" sub="Capture your first lead with Quick Lead" />}
        </div>
      </Card>
      <QuickLead open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />
    </div>
  );
}

export function QuickLead({ open, onClose, onCreated }: any) {
  const [f, setF] = useState<any>({ name: "", mobile: "", amount: 500000, loan_type: "Business Loan", source: "telecalling" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/applications", { method: "POST", body: { ...f, amount: Number(f.amount), tenure: 36, status: "lead_new" } });
      onCreated();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Quick Lead">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lead name" className="col-span-2"><input className="input text-[12.5px]" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" /></Field>
        <Field label="Mobile"><input className="input text-[12.5px]" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="10-digit mobile" /></Field>
        <Field label="Source"><select className="input text-[12.5px]" value={f.source} onChange={(e) => set("source", e.target.value)}>{["telecalling", "dsa", "web", "whatsapp", "walk-in", "referral"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Product interest"><select className="input text-[12.5px]" value={f.loan_type} onChange={(e) => set("loan_type", e.target.value)}>{["Business Loan", "Home Loan", "Loan Against Property", "Personal Loan", "Commercial Vehicle", "MSME", "Gold Loan"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Requested amount (₹)"><input className="input text-[12.5px]" type="number" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Save Lead"}</button>
      </div>
    </Modal>
  );
}
