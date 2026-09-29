import { useEffect, useMemo, useState } from "react";
import { Card, CardTitle, PageHeader, Badge, Tabs, Field, Modal } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";
import { ImportExport } from "./shared";

const TYPE_COLOR: Record<string, string> = {
  "Master DSA": "border-indigo-200 bg-indigo-50 text-indigo-700",
  "Main DSA": "border-violet-200 bg-violet-50 text-violet-700",
  DSA: "border-sky-200 bg-sky-50 text-sky-700",
  "Sub-DSA": "border-cyan-200 bg-cyan-50 text-cyan-700",
  "Sales Agent": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Connector: "border-amber-200 bg-amber-50 text-amber-700",
  Dealer: "border-rose-200 bg-rose-50 text-rose-700",
  Builder: "border-zinc-200 bg-zinc-100 text-zinc-700"
};

export function GnPartners() {
  const [tab, setTab] = useState("partners");
  const [partners, setPartners] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => { api("/gn/partners").then(setPartners).catch(() => {}); api("/gn/team").then(setTeam).catch(() => {}); };
  useEffect(load, []);

  const roots = useMemo(() => partners.filter((p) => !p.parent_id), [partners]);
  const childrenOf = (id: number | null) => partners.filter((p) => p.parent_id === id);

  return (
    <div className="space-y-5">
      <PageHeader title="Partner & DSA Network" sub="Manage DSAs, connectors and sales agents — hierarchy, commission share and payouts" breadcrumb="Growth Nations / Team" actions={
        <div className="flex items-center gap-2"><ImportExport entity="partners" onImported={load} /><button className="btn btn-primary text-[12px]" onClick={() => setAddOpen(true)}>+ Add Partner</button></div>
      } />
      <Tabs items={[{ key: "partners", label: "Partners", count: partners.length }, { key: "tree", label: "Team Tree", count: roots.length }, { key: "employees", label: "Employees", count: team.length }]} active={tab} onChange={setTab} />

      {tab === "partners" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Name</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">Phone</th><th className="px-3 py-2.5 font-semibold">Commission</th><th className="px-3 py-2.5 font-semibold">Parent</th><th className="px-3 py-2.5 font-semibold">Apps</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{p.name}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${TYPE_COLOR[p.type] ?? TYPE_COLOR.DSA}`}>{p.type}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-500">{p.phone ?? "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-600">{p.commission_pct}%</td>
                  <td className="px-3 py-2.5 text-zinc-500">{p.parent_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.applications}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{fmtInr(p.disbursed)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">Active</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "tree" && (
        <Card>
          <CardTitle title="Team Structure" sub="Partners nested under their parent — hover-free expandable tree" />
          <div className="space-y-1 pt-2">
            {roots.map((r) => <TreeNode key={r.id} p={r} childrenOf={childrenOf} depth={0} />)}
          </div>
        </Card>
      )}

      {tab === "employees" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Employee</th><th className="px-3 py-2.5 font-semibold">Role</th><th className="px-3 py-2.5 font-semibold">Phone</th><th className="px-3 py-2.5 font-semibold">Applications</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {team.map((u) => (
                <tr key={u.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{u.name}<div className="text-[10.5px] text-zinc-400">{u.email}</div></td>
                  <td className="px-3 py-2.5 text-zinc-600">{u.role}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{u.phone ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{u.applications}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{fmtInr(u.disbursed)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">{u.active ? "Active" : "Inactive"}</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AddPartnerModal open={addOpen} onClose={() => setAddOpen(false)} partners={partners} onAdded={() => { setAddOpen(false); load(); }} />
    </div>
  );
}

function TreeNode({ p, childrenOf, depth }: { p: any; childrenOf: (id: number | null) => any[]; depth: number }) {
  const kids = childrenOf(p.id);
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 rounded-md hover:bg-zinc-50 px-1" style={{ marginLeft: depth * 22 }}>
        <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${TYPE_COLOR[p.type]}`}>{p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}</span>
        <span className="text-[13px] font-semibold text-zinc-800">{p.name}</span>
        <Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLOR[p.type]}`}>{p.type}</span></Badge>
        <span className="text-[11px] text-zinc-400">{p.commission_pct}% · {p.phone}</span>
      </div>
      {kids.map((k) => <TreeNode key={k.id} p={k} childrenOf={childrenOf} depth={depth + 1} />)}
    </div>
  );
}

function AddPartnerModal({ open, onClose, partners, onAdded }: any) {
  const [f, setF] = useState<any>({ name: "", type: "DSA", phone: "", commission_pct: 30, parent_id: null });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/partners", { method: "POST", body: { ...f, commission_pct: Number(f.commission_pct), parent_id: f.parent_id ? Number(f.parent_id) : null } }); onAdded(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Partner">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Type"><select className="input text-[12.5px]" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{Object.keys(TYPE_COLOR).map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Phone"><input className="input text-[12.5px]" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Commission %"><input className="input text-[12.5px]" type="number" value={f.commission_pct} onChange={(e) => setF({ ...f, commission_pct: e.target.value })} /></Field>
        <Field label="Parent (reports to)"><select className="input text-[12.5px]" value={f.parent_id ?? ""} onChange={(e) => setF({ ...f, parent_id: e.target.value || null })}><option value="">None — top level</option>{partners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Add Partner"}</button>
      </div>
    </Modal>
  );
}
