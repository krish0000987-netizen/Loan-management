import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MapPin, HandCoins, ShieldAlert, Plus } from "lucide-react";
import { api, fmtInr, fmtDate } from "../lib/api";
import { PageHeader, Card, CardTitle, Badge, Stat, Tabs, Modal, Field, Progress } from "../components/ui";
import { ImportExport } from "./gn/shared";

export default function Collections() {
  const nav = useNavigate();
  const [queue, setQueue] = useState<any>({ rows: [], stats: {} });
  const [dash, setDash] = useState<any>(null);
  const [tab, setTab] = useState("queue");
  const [bucket, setBucket] = useState("");
  const [taskOpen, setTaskOpen] = useState<any>(null);
  const [task, setTask] = useState<any>({ kind: "call", priority: "high", note: "" });

  const load = () => {
    const params = new URLSearchParams();
    if (bucket) params.set("dpd", bucket);
    api(`/collections/queue?${params}`).then(setQueue);
    api("/collections/dashboard").then(setDash);
  };
  useEffect(load, [bucket]);

  const createTask = async () => {
    await api(`/collections/queue/${taskOpen.loan_id}/task`, { method: "POST", body: task });
    setTaskOpen(null);
    setTask({ kind: "call", priority: "high", note: "" });
    load();
  };

  return (
    <div>
      <PageHeader title="Collections" sub="Prioritized recovery queue · DPD & PTP management" breadcrumb="Collections" actions={
        <div className="flex items-center gap-2"><ImportExport entity="collections" /></div>
      } />

      {dash && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
          <Stat label="Total due" value={fmtInr(dash.totalDue)} tone="red" />
          <Stat label="Collected · 30d" value={fmtInr(dash.collected30d)} tone="green" />
          <Stat label="Overdue" value={fmtInr(dash.overdue?.v ?? 0)} sub={`${dash.overdue?.n ?? 0} accounts`} tone="red" />
          <Stat label="NPA book" value={fmtInr(dash.npa?.v ?? 0)} sub={`${dash.npa?.n ?? 0} accounts`} tone="red" />
          <Stat label="Efficiency" value={`${dash.collectionEfficiency}%`} tone="green" />
          <Stat label="PTPs · 30d" value={dash.ptp?.total ?? 0} sub={`${dash.ptp?.kept ?? 0} kept / ${dash.ptp?.broken ?? 0} broken`} />
          <Stat label="Portfolio" value={fmtInr(dash.portfolio)} />
          <Stat label="Agents active" value={dash.agentPerformance?.length ?? 0} />
        </div>
      )}

      <Tabs active={tab} onChange={setTab} items={[{ key: "queue", label: "Recovery queue", count: queue.rows?.length }, { key: "dpd", label: "DPD book" }, { key: "agents", label: "Agent performance" }, { key: "recovery", label: "Recovery actions" }]} />

      {tab === "queue" && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button className={`btn ${bucket === "" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}`} onClick={() => setBucket("")}>All buckets</button>
            {[["1-30", "1–30 days"], ["31-60", "31–60"], ["61-90", "61–90"], ["90+", "90+ (NPA)"]].map(([v, label]) => (
              <button key={v} className={`btn ${bucket === v ? "btn-primary btn-sm" : "btn-secondary btn-sm"}`} onClick={() => setBucket(v)}>{label}</button>
            ))}
          </div>
          <Card pad={false}>
            <div className="divide-y divide-zinc-50">
              {queue.rows?.map((r: any) => (
                <div key={r.loan_id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/70 cursor-pointer" onClick={() => nav(`/loans/${r.loan_id}`)}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${r.dpd >= 4 ? "bg-rose-50 text-rose-600" : r.dpd >= 2 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                    <ShieldAlert size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-800 text-[13px]">{r.customer_name}</span>
                      <Badge status={r.risk_grade} />
                      {r.last_ptp_status === "broken" && <Badge status="broken">PTP broken</Badge>}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {r.loan_no} · {r.product_name} · {r.city || "—"} · due {fmtDate(r.next_due)}
                    </div>
                  </div>
                  <div className="hidden md:block text-center w-20">
                    <div className="text-[10px] text-zinc-400 uppercase">DPD</div>
                    <div className={`num font-bold ${r.dpd >= 4 ? "text-rose-600" : r.dpd >= 2 ? "text-amber-600" : "text-emerald-600"}`}>{r.dpd}</div>
                  </div>
                  <div className="hidden md:block text-center w-28">
                    <div className="text-[10px] text-zinc-400 uppercase">Amount due</div>
                    <div className="num font-semibold text-[12.5px]">{fmtInr(r.amount_due)}</div>
                  </div>
                  <div className="text-right w-32">
                    <div className="num font-semibold text-[13px]">{fmtInr(r.outstanding)}</div>
                    <div className="text-[10px] text-zinc-400">outstanding</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setTaskOpen(r); setTask({ kind: "call", priority: r.dpd >= 4 ? "critical" : "high", note: "" }); }}><Plus size={12} /> Task</button>
                    <button className="btn btn-primary btn-sm" onClick={() => nav(`/loans/${r.loan_id}`)}><Phone size={12} /> Manage</button>
                  </div>
                </div>
              ))}
              {!queue.rows?.length && <div className="py-12 text-center text-[12px] text-zinc-400">No overdue accounts in this bucket.</div>}
            </div>
          </Card>
        </>
      )}

      {tab === "dpd" && dash && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {["0", "1-30", "31-60", "61-90", "90+"].map((b) => {
            const row = dash.bucketDist?.find((x: any) => x.bucket === b);
            const max = Math.max(1, ...(dash.bucketDist || []).map((x: any) => x.loans));
            return (
              <Card key={b}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-zinc-700">{b} DPD</span>
                  <Badge status={b === "0" ? "verified" : b === "1-30" ? "sandbox" : b === "31-60" ? "medium" : b === "61-90" ? "high" : "critical"} />
                </div>
                <div className="num text-[22px] font-semibold">{row?.loans ?? 0}</div>
                <div className="text-[11px] text-zinc-400 mt-1">{fmtInr(row?.outstanding ?? 0)} outstanding</div>
                <Progress value={((row?.loans ?? 0) / max) * 100} tone={b === "0" ? "green" : b === "1-30" ? "brand" : b === "31-60" ? "amber" : b === "61-90" ? "amber" : "red"} />
              </Card>
            );
          })}
        </div>
      )}

      {tab === "agents" && dash && (
        <Card>
          <CardTitle title="Agent performance" sub="Tasks completed, payments collected" />
          <div className="divide-y divide-zinc-50">
            {dash.agentPerformance?.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span className="num w-6 text-zinc-300 text-[12px]">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[11px] font-semibold">
                  {(a.name || "—").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-zinc-800">{a.name || "Unassigned"}</div>
                  <div className="text-[10.5px] text-zinc-400">{a.tasks} tasks · {a.done} done · {a.payments} payments</div>
                </div>
                <div className="num font-semibold text-[13px]">{fmtInr(a.collected_amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "recovery" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card>
            <CardTitle title="Recovery toolkit" sub="Controlled workflows, always audited" />
            <div className="space-y-2 text-[12px] text-zinc-600">
              <p className="flex gap-2"><HandCoins size={14} className="text-brand-500 shrink-0 mt-0.5" /> Settlements: request → assessment → approval → offer → payment → closure. Requires recovery authorization.</p>
              <p className="flex gap-2"><ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" /> Write-offs: request → approval → accounting event. Original loan history is never deleted.</p>
              <p className="flex gap-2"><Phone size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Recovery conduct: fair-practice disclosures, consent-respecting communication.</p>
              <p className="flex gap-2"><MapPin size={14} className="text-zinc-400 shrink-0 mt-0.5" /> Field visits capture location only where policy & consent permit.</p>
            </div>
          </Card>
          <Card className="xl:col-span-2">
            <CardTitle title="Open settlement & write-off requests" />
            <div className="text-[12px] text-zinc-400 py-6 text-center">Open a loan workspace → Collections tab to request a settlement or write-off on an account.</div>
          </Card>
        </div>
      )}

      <Modal open={!!taskOpen} onClose={() => setTaskOpen(null)} title={`New task — ${taskOpen?.loan_no || ""}`}>
        <div className="space-y-3">
          <Field label="Kind">
            <select className="input" value={task.kind} onChange={(e) => setTask({ ...task, kind: e.target.value })}>
              <option value="call">Call</option><option value="visit">Field visit</option><option value="reminder">Reminder</option><option value="legal">Legal escalation</option>
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={task.priority} onChange={(e) => setTask({ ...task, priority: e.target.value })}>
              <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </Field>
          <Field label="Note"><textarea className="input min-h-16" value={task.note} onChange={(e) => setTask({ ...task, note: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setTaskOpen(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={createTask}>Create task</button>
        </div>
      </Modal>
    </div>
  );
}
