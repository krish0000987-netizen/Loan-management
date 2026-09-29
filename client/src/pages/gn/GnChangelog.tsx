import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Stat } from "../../components/ui";
import { api } from "../../lib/api";
import { Plus, Trash2, GitCommit } from "lucide-react";
import { ImportExport } from "./shared";

const CAT_STYLE: Record<string, string> = {
  feature: "border-emerald-200 bg-emerald-50 text-emerald-700",
  fix: "border-red-200 bg-red-50 text-red-600",
  improvement: "border-sky-200 bg-sky-50 text-sky-700",
  security: "border-amber-200 bg-amber-50 text-amber-700"
};

export function GnChangelog() {
  const [data, setData] = useState<any>({ rows: [], summary: [] });
  const [open, setOpen] = useState(false);
  const load = () => { api("/gn/changelog").then(setData).catch(() => {}); };
  useEffect(load, []);
  const catCount = (c: string) => data.summary.filter((s: any) => s.category === c).reduce((a: number, s: any) => a + s.n, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Change Log" sub="Release notes — what's new, fixed and hardened across the platform" breadcrumb="Growth Nations / Change Log" actions={
        <div className="flex items-center gap-2">
          <ImportExport entity="changelog" onImported={load} />
          <button className="btn btn-primary text-[12px]" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Release Note</button>
        </div>
      } />
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Releases" value={data.rows.length} />
        <Stat label="Features" value={catCount("feature")} tone="green" />
        <Stat label="Fixes" value={catCount("fix")} tone="red" />
        <Stat label="Security" value={catCount("security")} tone="amber" />
      </div>
      <div className="relative pl-6 space-y-5">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-zinc-200" />
        {data.rows.map((r: any) => (
          <div key={r.id} className="relative">
            <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow ring-1 ring-zinc-200 bg-white" />
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center"><GitCommit className="w-4 h-4" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-zinc-800">v{r.version}</span>
                    <Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CAT_STYLE[r.category] ?? "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{r.category}</span></Badge>
                  </div>
                  <div className="text-[12.5px] font-semibold text-zinc-700 mt-0.5">{r.title}</div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400">{String(r.released_at).slice(0, 10)}</span>
                  <button title="Move to Recycle Bin" className="text-zinc-300 hover:text-red-500 p-1" onClick={async () => { if (confirm(`Move “v${r.version}” to the Recycle Bin?`)) { await api(`/gn/changelog/${r.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="mt-2.5 text-[12.5px] text-zinc-600 leading-relaxed">{r.content}</p>
            </Card>
          </div>
        ))}
      </div>
      <ChangelogModal open={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />
    </div>
  );
}

function ChangelogModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ version: "", title: "", content: "", category: "feature" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/changelog", { method: "POST", body: f }); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Release Note">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Version"><input className="input text-[12.5px]" value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} placeholder="2.5.0" /></Field>
        <Field label="Category"><select className="input text-[12.5px]" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["feature", "fix", "improvement", "security"].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Title" span={2}><input className="input text-[12.5px]" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Details" span={2}><textarea className="input text-[12.5px]" rows={4} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.version || !f.title} onClick={save}>{busy ? "Saving…" : "Publish Note"}</button>
      </div>
    </Modal>
  );
}
