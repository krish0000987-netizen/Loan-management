import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { gnBadge, gnStatusLabel } from "../../lib/gn";
import { ProcessFlow, ImportExport } from "./shared";
import { Plus } from "lucide-react";

export function GnDirectBooking() {
  const [rows, setRows] = useState<any[]>([]);
  const [lenders, setLenders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api("/gn/applications?source=direct_booking&limit=100").then((r) => setRows(r.rows)).catch(() => {});
  useEffect(() => { load(); api("/gn/lenders").then(setLenders).catch(() => {}); api("/gn/products").then((r) => setProducts(r.rows)).catch(() => {}); api("/gn/partners").then(setPartners).catch(() => {}); }, []);
  const earned = rows.reduce((s, r) => s + (r.commission_gross || 0), 0);
  const paid = rows.reduce((s, r) => s + (r.commission_net || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Direct Booking" sub="Banker submits a disbursed file under your DSA code outside the normal pipeline — the system creates the underlying lead, app, loan and commission automatically" breadcrumb="Growth Nations / CRM / Direct Booking"
        actions={<div className="flex items-center gap-2"><ImportExport entity="applications" /><button className="btn btn-primary text-[12px]" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Booking</button></div>} />
      <ProcessFlow status="disb_confirmed" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Bookings", rows.length], ["Commission Earned", fmtInr(earned)], ["Total Disbursed", fmtInr(rows.reduce((s, r) => s + (r.disbursed_amount || 0), 0))], ["Commission (net)", fmtInr(paid)]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div><div className="text-[17px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">App No</th><th className="px-3 py-2.5 font-semibold">Customer</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold text-right">Loan Disbursed</th><th className="px-3 py-2.5 font-semibold text-right">Commission</th><th className="px-3 py-2.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-brand-700">{r.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{r.lender_name ?? "—"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={gnBadge(r.status)}>{gnStatusLabel(r.status)}</span></Badge></td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800 text-right">{fmtInr(r.disbursed_amount || 0)}</td>
                  <td className="px-3 py-2.5 text-right"><span className="font-semibold text-emerald-600">{r.commission_gross > 0 ? fmtInr(r.commission_gross) : "—"}</span></td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(r.disbursed_at ?? r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="No direct bookings yet" sub="Add a booking to log a disbursed file under a DSA code" />}
        </div>
      </Card>
      <CreateBooking open={open} onClose={() => setOpen(false)} lenders={lenders} products={products} partners={partners} onCreated={() => { setOpen(false); load(); }} />
    </div>
  );
}

function CreateBooking({ open, onClose, lenders, products, partners, onCreated }: any) {
  const [f, setF] = useState<any>({ name: "", mobile: "", amount: 2000000, loan_type: "Business Loan", dsa_code: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/direct-bookings", { method: "POST", body: { ...f, amount: Number(f.amount), tenure: 36, product_id: f.product_id ? Number(f.product_id) : null, lender_id: f.lender_id ? Number(f.lender_id) : null, partner_id: f.partner_id ? Number(f.partner_id) : null, source: "direct_booking" } });
      onCreated();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Direct Booking" wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer name" className="col-span-2"><input className="input text-[12.5px]" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" /></Field>
        <Field label="Mobile"><input className="input text-[12.5px]" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
        <Field label="DSA Code"><input className="input text-[12.5px]" value={f.dsa_code} onChange={(e) => set("dsa_code", e.target.value)} placeholder="e.g. A101" /></Field>
        <Field label="Bank / Lender"><select className="input text-[12.5px]" value={f.lender_id ?? ""} onChange={(e) => set("lender_id", e.target.value || null)}><option value="">Select lender</option>{lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        <Field label="Product"><select className="input text-[12.5px]" value={f.product_id ?? ""} onChange={(e) => set("product_id", e.target.value || null)}><option value="">Select product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Disbursed amount (₹)"><input className="input text-[12.5px]" type="number" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
        <Field label="Partner / DSA"><select className="input text-[12.5px]" value={f.partner_id ?? ""} onChange={(e) => set("partner_id", e.target.value || null)}><option value="">Select partner</option>{partners.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}</select></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name || !f.dsa_code} onClick={save}>{busy ? "Saving…" : "Create Booking + Commission"}</button>
      </div>
    </Modal>
  );
}
