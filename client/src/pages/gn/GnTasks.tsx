import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, EmptyState } from "../../components/ui";
import { api, fmtDate } from "../../lib/api";
import { Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import { ImportExport } from "./shared";

export function GnTasks() {
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => api("/gn/tasks").then((r) => { setRows(r.rows); setSummary(r.summary); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggle = async (t: any) => {
    const next = t.status === "completed" ? "pending" : t.status === "in_progress" ? "completed" : "in_progress";
    await api(`/gn/tasks/${t.id}`, { method: "PATCH", body: { status: next } });
    load();
  };

  const s = (k: string) => summary.find((x: any) => x.status === k)?.n ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Tasks" sub="Track follow-ups, deadlines, and team assignments across leads — never miss a follow-up" breadcrumb="Growth Nations / Utility / Tasks"
        actions={
          <div className="flex items-center gap-2"><ImportExport entity="tasks" /><button className="btn btn-primary text-[12px]" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />Create Task</button></div>
        } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Total Tasks", rows.length], ["Pending", s("pending")], ["In Progress", s("in_progress")], ["Completed", s("completed")]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div><div className="text-[19px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold"></th><th className="px-3 py-2.5 font-semibold">Task</th><th className="px-3 py-2.5 font-semibold">Linked To</th><th className="px-3 py-2.5 font-semibold">Priority</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Due</th><th className="px-3 py-2.5 font-semibold">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50/60 cursor-pointer" onClick={() => toggle(t)}>
                  <td className="px-3 py-2.5">{t.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-zinc-300" />}</td>
                  <td className="px-3 py-2.5"><span className={`font-semibold text-zinc-800 ${t.status === "completed" ? "line-through text-zinc-400" : ""}`}>{t.title}</span></td>
                  <td className="px-3 py-2.5 text-brand-700 font-medium">{t.linked_to ?? "—"}</td>
                  <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${t.priority === "high" ? "bg-rose-50 text-rose-600" : t.priority === "low" ? "bg-zinc-100 text-zinc-500" : "bg-amber-50 text-amber-600"}`}>{t.priority}</span></td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${t.status === "completed" ? "bg-emerald-50 text-emerald-600" : t.status === "in_progress" ? "bg-sky-50 text-sky-700" : "bg-zinc-100 text-zinc-600"}`}>{t.status.replace(/_/g, " ")}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{t.due_at ? fmtDate(t.due_at) : "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{t.assigned_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="No tasks found" sub="Create your first task" />}
        </div>
      </Card>
      <CreateTask open={open} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />
    </div>
  );
}

function CreateTask({ open, onClose, onCreated }: any) {
  const [f, setF] = useState<any>({ title: "", linked_to: "", priority: "medium" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const save = async () => {
    setBusy(true);
    try { await api("/gn/tasks", { method: "POST", body: f }); onCreated(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create Task">
      <div className="space-y-3">
        <Field label="Task title"><input className="input text-[12.5px]" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Follow up KYC documents" /></Field>
        <Field label="Linked to (lead / app ref)"><input className="input text-[12.5px]" value={f.linked_to} onChange={(e) => set("linked_to", e.target.value)} placeholder="e.g. GN-2026-10005" /></Field>
        <Field label="Priority"><select className="input text-[12.5px]" value={f.priority} onChange={(e) => set("priority", e.target.value)}>{["high", "medium", "low"].map((p) => <option key={p}>{p}</option>)}</select></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.title} onClick={save}>{busy ? "Saving…" : "Create Task"}</button>
      </div>
    </Modal>
  );
}
