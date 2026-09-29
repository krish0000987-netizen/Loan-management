import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Tabs, Field, Modal } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";
import { ImportExport } from "./shared";

export function GnLenders() {
  const [tab, setTab] = useState("lenders");
  const [lenders, setLenders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [bankers, setBankers] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => {
    api("/gn/lenders").then(setLenders).catch(() => {});
    api("/gn/products").then((r) => setProducts(r.rows)).catch(() => {});
    api("/gn/schemes").then(setSchemes).catch(() => {});
    api("/gn/dsa-codes").then(setCodes).catch(() => {});
    api("/gn/bankers").then(setBankers).catch(() => {});
  };
  useEffect(load, []);



  return (
    <div className="space-y-5">
      <PageHeader title="Lenders, Products & Schemes" sub="Lender network, commission schemes, DSA codes and bank RM directory" breadcrumb="Growth Nations / Masters" actions={
        <div className="flex items-center gap-2"><ImportExport entity="lenders" /><ImportExport entity="schemes" /><button className="btn btn-primary text-[12px]" onClick={() => setAddOpen(true)}>+ Add Lender</button></div>
      } />
      <Tabs items={[
        { key: "lenders", label: "Lenders", count: lenders.length },
        { key: "products", label: "Products", count: products.length },
        { key: "schemes", label: "Schemes", count: schemes.length },
        { key: "codes", label: "DSA Codes", count: codes.length },
        { key: "bankers", label: "Bankers", count: bankers.length }
      ]} active={tab} onChange={setTab} />

      {tab === "lenders" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Lender</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">DSA Code</th><th className="px-3 py-2.5 font-semibold">API</th><th className="px-3 py-2.5 font-semibold">Products</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {lenders.map((l) => (
                <tr key={l.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{l.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{l.type}</td>
                  <td className="px-3 py-2.5 font-mono text-[11.5px] text-zinc-500">{l.dsa_code ?? "—"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-amber-200 bg-amber-50 text-amber-700">MOCK</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-600">{l.products}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{fmtInr(l.disbursed)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">Active</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "products" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Product</th><th className="px-3 py-2.5 font-semibold">Category</th><th className="px-3 py-2.5 font-semibold">Lender</th><th className="px-3 py-2.5 font-semibold">Amount Range</th><th className="px-3 py-2.5 font-semibold">Tenure</th><th className="px-3 py-2.5 font-semibold">ROI</th><th className="px-3 py-2.5 font-semibold">Payout</th><th className="px-3 py-2.5 font-semibold">Docs</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{p.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.category}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.lender_name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{fmtInr(p.min_amount)} – {fmtInr(p.max_amount)}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.min_tenure}–{p.max_tenure} mo</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.roi_min != null ? `${p.roi_min}–${p.roi_max}%` : "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-600">{p.payout_pct}%</td>
                  <td className="px-3 py-2.5 text-[11px] text-zinc-400">{p.required_documents?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "schemes" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Scheme</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Product</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">Rate</th><th className="px-3 py-2.5 font-semibold">Effective</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {schemes.map((s) => (
                <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{s.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{s.lender_name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{s.product_name ?? "All products"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 uppercase">{s.payout_type}</span></Badge></td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{s.payout_type === "percent" ? `${s.rate}%` : s.payout_type === "flat" ? fmtInr(s.flat_amount) : `${JSON.parse(s.slabs || "[]").length} slabs`}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{s.effective_from ?? "—"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">{s.status}</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "codes" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Code</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Label</th><th className="px-3 py-2.5 font-semibold">Via</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-zinc-800">{c.code}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.lender_name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.label ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.via_parent ? `Parent DSA · ${c.parent_dsa_name ?? ""}` : "Direct"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">Active</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "bankers" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Banker</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Branch</th><th className="px-3 py-2.5 font-semibold">Role</th><th className="px-3 py-2.5 font-semibold">Contact</th>
            </tr></thead>
            <tbody>
              {bankers.map((b) => (
                <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{b.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{b.bank}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{b.branch} · {b.city}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-violet-200 bg-violet-50 text-violet-700">{b.role}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-500 text-[11.5px]">{b.phone}{b.email ? ` · ${b.email}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AddLenderModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => { setAddOpen(false); load(); }} />
    </div>
  );
}

function AddLenderModal({ open, onClose, onAdded }: any) {
  const [f, setF] = useState<any>({ name: "", type: "Bank", dsa_code: "", contact_person: "", contact_phone: "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/lenders", { method: "POST", body: f }); onAdded(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Lender">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lender name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Type"><select className="input text-[12.5px]" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{["Bank", "NBFC", "HFC", "Fintech"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="DSA code"><input className="input text-[12.5px]" value={f.dsa_code} onChange={(e) => setF({ ...f, dsa_code: e.target.value })} /></Field>
        <Field label="Contact person"><input className="input text-[12.5px]" value={f.contact_person} onChange={(e) => setF({ ...f, contact_person: e.target.value })} /></Field>
        <Field label="Contact phone"><input className="input text-[12.5px]" value={f.contact_phone} onChange={(e) => setF({ ...f, contact_phone: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Add Lender"}</button>
      </div>
    </Modal>
  );
}
