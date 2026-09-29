import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Stat, EmptyState } from "../../components/ui";
import { api } from "../../lib/api";
import { Trash2, RotateCcw, Search, AlertTriangle, Trash } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  campaign: "Campaign", task: "Task", document: "Document", scheme: "Scheme", doc: "Article",
  template: "Message Template", workflow: "Workflow", ivr_menu: "IVR Menu", drip: "WhatsApp Drip",
  faq: "FAQ", changelog: "Release Note", message: "Message"
};

export function GnRecycleBin() {
  const [data, setData] = useState<any>({ rows: [], summary: [] });
  const [filter, setFilter] = useState<any>({ entity_type: "", search: "" });
  const [confirm, setConfirm] = useState<any>(null);

  const load = () => {
    const p = new URLSearchParams();
    if (filter.entity_type) p.set("entity_type", filter.entity_type);
    if (filter.search) p.set("q", filter.search);
    api(`/gn/trash${p.toString() ? `?${p}` : ""}`).then(setData).catch(() => {});
  };
  useEffect(load, [filter]);

  const total = data.summary.reduce((a: number, s: any) => a + s.n, 0);

  const restore = async (row: any) => {
    const r = await api(`/gn/trash/${row.id}/restore`, { method: "POST" });
    alert(`Restored ${TYPE_LABEL[row.entity_type] ?? row.entity_type} (id ${r.restoredId}).`);
    load();
  };
  const purge = async (row: any) => {
    if (!confirm(`Permanently delete this ${TYPE_LABEL[row.entity_type] ?? row.entity_type}? This cannot be undone.`)) return;
    await api(`/gn/trash/${row.id}`, { method: "DELETE" });
    load();
  };
  const empty = async (scope: string) => {
    if (!confirm(`Permanently delete ${scope === "all" ? "ALL" : "filtered"} trash items? This cannot be undone.`)) return;
    const p = scope === "all" ? "" : `?entity_type=${filter.entity_type}`;
    const r = await api(`/gn/trash${p}`, { method: "DELETE" });
    alert(`Purged ${r.purged} item(s).`);
    load();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Recycle Bin" sub="Soft-deleted records — restore anything you removed by accident" breadcrumb="Growth Nations / Recycle Bin" actions={
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary text-[12px]" onClick={() => empty("filtered")} disabled={!filter.entity_type}><Trash className="w-3.5 h-3.5 mr-1" />Empty {filter.entity_type ? TYPE_LABEL[filter.entity_type]?.toLowerCase() ?? filter.entity_type : ""} trash</button>
          <button className="btn btn-secondary text-[12px] text-red-600" onClick={() => empty("all")}><AlertTriangle className="w-3.5 h-3.5 mr-1" />Empty All</button>
        </div>
      } />
      <div className="grid grid-cols-5 gap-4">
        <Stat label="In Trash" value={total} tone="amber" />
        <Stat label="Workflows" value={data.summary.find((s: any) => s.entity_type === "workflow")?.n ?? 0} />
        <Stat label="Templates" value={data.summary.find((s: any) => s.entity_type === "template")?.n ?? 0} />
        <Stat label="Campaigns" value={data.summary.find((s: any) => s.entity_type === "campaign")?.n ?? 0} />
        <Stat label="Documents" value={data.summary.find((s: any) => s.entity_type === "document")?.n ?? 0} />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input text-[12px] pl-8" placeholder="Search trash…" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
        </div>
        <select className="input text-[12px] w-52" value={filter.entity_type} onChange={(e) => setFilter({ ...filter, entity_type: e.target.value })}>
          <option value="">All entity types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <Card pad={false}>
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
            <th className="px-3 py-2.5 font-semibold">Item</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">Deleted By</th><th className="px-3 py-2.5 font-semibold">Deleted At</th><th className="px-3 py-2.5"></th>
          </tr></thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-zinc-800">{r.name}</div>
                  <div className="text-[10.5px] text-zinc-400">id #{r.entity_id}</div>
                </td>
                <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 bg-zinc-50 text-zinc-500">{TYPE_LABEL[r.entity_type] ?? r.entity_type}</span></Badge></td>
                <td className="px-3 py-2.5 text-zinc-600">{r.deleted_name ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-400">{String(r.deleted_at).slice(0, 16)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button className="btn btn-primary text-[11px] !py-1 !px-2.5" onClick={() => restore(r)}><RotateCcw className="w-3 h-3 mr-1" />Restore</button>
                    <button className="btn btn-secondary text-[11px] !py-1 !px-2.5 text-red-600" onClick={() => purge(r)}><Trash2 className="w-3 h-3 mr-1" />Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && <tr><td colSpan={5}><div className="py-8"><EmptyState title="Recycle Bin is empty" sub="Records you delete from any module land here and can be restored anytime." /></div></td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
