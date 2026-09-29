import { useEffect, useState } from "react";
import { Card, CardTitle, PageHeader, Badge, Field, Modal, Stat, Tabs, EmptyState } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";
import { Phone, Workflow, Play, Trash2, Plus, Pause, Rocket } from "lucide-react";
import { ImportExport } from "./shared";

const CHANNELS = ["meta", "google", "whatsapp", "instagram", "walkin", "referral"];
const TRIGGERS = ["lead_captured", "app_created", "milestone_reached", "manual"];
const ROUTES = ["score_round_robin", "round_robin", "manual", "specific_pool"];
const ACT_TYPES = ["whatsapp", "email", "task"];
const IVR_ROUTES = ["Telecalling", "Sales", "Collections", "Support", "Finance", "Partnership", "Masters"];

export function GnMarketing() {
  const [tab, setTab] = useState("campaigns");
  const [data, setData] = useState<any>({ rows: [], totals: {} });
  const [wfs, setWfs] = useState<any>({ rows: [], summary: [] });
  const [menus, setMenus] = useState<any[]>([]);
  const [calls, setCalls] = useState<any>({ rows: [], summary: [] });
  const [addOpen, setAddOpen] = useState(false);
  const [wfOpen, setWfOpen] = useState(false);
  const [ivrOpen, setIvrOpen] = useState(false);
  const [simOpen, setSimOpen] = useState<any>(null);

  const load = () => { api("/gn/campaigns").then(setData).catch(() => {}); };
  const loadWf = () => { api("/gn/workflows").then(setWfs).catch(() => {}); };
  const loadIvr = () => {
    api("/gn/ivr/menus").then(setMenus).catch(() => {});
    api("/gn/ivr/calls").then(setCalls).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === "workflow") loadWf(); }, [tab]);
  useEffect(() => { if (tab === "ivr") loadIvr(); }, [tab]);

  const t = data.totals || {};
  const conv = t.leads > 0 ? Math.round((t.applications / t.leads) * 1000) / 10 : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Marketing" sub="Campaigns → Workflow Builder → IVR → Leads → Applications → Disbursement → Revenue attribution" breadcrumb="Growth Nations / Marketing" actions={
        <div className="flex items-center gap-2">
          <ImportExport entity={tab === "campaigns" ? "campaigns" : tab === "workflow" ? "workflows" : "ivr_menus"} onImported={() => { if (tab === "campaigns") load(); else if (tab === "workflow") loadWf(); else loadIvr(); }} />
          {tab === "campaigns" && <button className="btn btn-primary text-[12px]" onClick={() => setAddOpen(true)}>+ New Campaign</button>}
          {tab === "workflow" && <button className="btn btn-primary text-[12px]" onClick={() => setWfOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Workflow</button>}
          {tab === "ivr" && <button className="btn btn-primary text-[12px]" onClick={() => setIvrOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New IVR Menu</button>}
        </div>
      } />
      <Tabs items={[
        { key: "campaigns", label: "Campaigns", count: data.rows.length },
        { key: "workflow", label: "Workflow Builder", count: wfs.rows.length },
        { key: "ivr", label: "IVR & Calls", count: menus.length }
      ]} active={tab} onChange={setTab} />

      {tab === "campaigns" && <>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Total Spend" value={fmtInr(t.spend ?? 0)} />
          <Stat label="Leads" value={t.leads ?? 0} />
          <Stat label="Applications" value={t.applications ?? 0} sub={`${conv}% lead→app`} />
          <Stat label="Disbursed" value={fmtInr(t.disbursed ?? 0)} tone="green" />
          <Stat label="ROI (disb/spend)" value={`${t.roi ?? 0}×`} tone="brand" sub={`CPL ${fmtInr(t.cpl ?? 0)}`} />
        </div>
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Campaign</th><th className="px-3 py-2.5 font-semibold">Channel</th><th className="px-3 py-2.5 font-semibold">Spend</th><th className="px-3 py-2.5 font-semibold">Leads</th><th className="px-3 py-2.5 font-semibold">Apps</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">CPL</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5"></th>
            </tr></thead>
            <tbody>
              {data.rows.map((c: any) => (
                <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{c.name}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-sky-200 bg-sky-50 text-sky-700 uppercase">{c.channel}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-700">{fmtInr(c.spend)}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.leads}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.applications}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-600">{fmtInr(c.disbursed_amount)}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{c.leads > 0 ? fmtInr(Math.round(c.spend / c.leads)) : "—"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${c.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{c.status}</span></Badge></td>
                  <td className="px-3 py-2.5"><button title="Move to Recycle Bin" className="text-zinc-300 hover:text-red-500" onClick={async () => { if (confirm(`Move campaign “${c.name}” to the Recycle Bin?`)) { await api(`/gn/campaigns/${c.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </>}

      {tab === "workflow" && <WorkflowTab wfs={wfs} load={loadWf} onNew={() => setWfOpen(true)} />}

      {tab === "ivr" && <IvrTab menus={menus} calls={calls} load={loadIvr} onNew={() => setIvrOpen(true)} onSim={(m: any) => setSimOpen(m)} />}

      <AddCampaignModal open={addOpen} onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); load(); }} />
      <WorkflowModal open={wfOpen} onClose={() => setWfOpen(false)} onDone={() => { setWfOpen(false); loadWf(); }} templates={[]} />
      <IvrModal open={ivrOpen} onClose={() => setIvrOpen(false)} onDone={() => { setIvrOpen(false); loadIvr(); }} />
      <SimCallModal menu={simOpen} onClose={() => setSimOpen(null)} onDone={() => { setSimOpen(null); loadIvr(); }} />
    </div>
  );
}

/* ============ Workflow Builder (functional) ============ */

function WorkflowTab({ wfs, load, onNew }: any) {
  const { rows = [], summary = [] } = wfs;
  const s = Object.fromEntries(summary.map((x: any) => [x.status, x.n]));
  const triggerLabel: Record<string, string> = { lead_captured: "Lead Captured", app_created: "Application Created", milestone_reached: "Milestone Reached", manual: "Manual Run" };
  const routeLabel: Record<string, string> = { score_round_robin: "Score + Round-robin", round_robin: "Round-robin", manual: "Manual pick", specific_pool: "Specific pool" };
  const toggle = async (w: any) => {
    await api(`/gn/workflows/${w.id}`, { method: "PATCH", body: { status: w.status === "active" ? "paused" : "active" } });
    load();
  };
  const run = async (w: any) => {
    const r = await api(`/gn/workflows/${w.id}/run`, { method: "POST" });
    alert(`Workflow executed — ${r.enqueued} actions enqueued for ${r.leads} leads.`);
    load();
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Workflows" value={rows.length} />
        <Stat label="Active" value={s.active ?? 0} tone="green" />
        <Stat label="Paused" value={s.paused ?? 0} tone="amber" />
        <Stat label="Draft" value={s.draft ?? 0} />
      </div>
      {rows.length === 0 && <EmptyState title="No workflows yet" sub="Create a lead automation workflow to route, nurture and convert leads automatically." />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((w: any) => {
          const actions = Array.isArray(w.actions) ? w.actions : (() => { try { return JSON.parse(w.actions || "[]"); } catch { return []; } })();
          return (
            <Card key={w.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"><Workflow className="w-4 h-4 text-violet-600" /></div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-zinc-800">{w.name}</div>
                    <div className="text-[11px] text-zinc-400">by {w.created_name ?? "—"} · ran {w.run_count ?? 0}×{w.last_run_at ? ` · last ${String(w.last_run_at).slice(0, 16)}` : ""}</div>
                  </div>
                </div>
                <Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${w.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : w.status === "paused" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{w.status}</span></Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="rounded-lg border border-zinc-100 px-2.5 py-2"><div className="text-[10px] uppercase text-zinc-400 font-semibold">Trigger</div><div className="font-medium text-zinc-700 mt-0.5">{triggerLabel[w.trigger] ?? w.trigger}</div></div>
                <div className="rounded-lg border border-zinc-100 px-2.5 py-2"><div className="text-[10px] uppercase text-zinc-400 font-semibold">Route</div><div className="font-medium text-zinc-700 mt-0.5">{routeLabel[w.route] ?? w.route}</div></div>
              </div>
              {w.trigger_detail && <div className="mt-2 text-[11px] text-zinc-500 italic">“{w.trigger_detail}”</div>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {actions.map((a: any, i: number) => (
                  <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${a.type === "task" ? "bg-sky-50 text-sky-700 border border-sky-200" : a.type === "email" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>{a.type === "task" ? "📋" : a.type === "email" ? "✉️" : "💬"} {a.title ?? a.type}</span>
                ))}
                {actions.length === 0 && <span className="text-[10.5px] text-zinc-400">No actions configured</span>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="btn btn-primary text-[11.5px] !py-1.5" onClick={() => run(w)}><Play className="w-3 h-3 mr-1" />Run now</button>
                <button className="btn btn-secondary text-[11.5px] !py-1.5" onClick={() => toggle(w)}>{w.status === "active" ? <><Pause className="w-3 h-3 mr-1" />Pause</> : <><Rocket className="w-3 h-3 mr-1" />Activate</>}</button>
                <button className="text-zinc-300 hover:text-red-500 ml-auto" title="Move to Recycle Bin" onClick={async () => { if (confirm(`Move workflow “${w.name}” to the Recycle Bin?`)) { await api(`/gn/workflows/${w.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          );
        })}
      </div>
      <button className="btn btn-secondary text-[12px]" onClick={onNew}><Plus className="w-3.5 h-3.5 mr-1" />New Workflow</button>
    </div>
  );
}

function WorkflowModal({ open, onClose, onDone, templates }: any) {
  const [f, setF] = useState<any>({ name: "", trigger: "lead_captured", trigger_detail: "", route: "score_round_robin", status: "draft", actions: [{ type: "whatsapp", title: "Welcome message" }] });
  const [busy, setBusy] = useState(false);
  const setAction = (i: number, k: string, v: any) => setF({ ...f, actions: f.actions.map((a: any, idx: number) => (idx === i ? { ...a, [k]: v } : a)) });
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/workflows", { method: "POST", body: f });
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Automation Workflow">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Workflow name" span={2}><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Lead Nurture — Instant Response" /></Field>
        <Field label="Trigger"><select className="input text-[12.5px]" value={f.trigger} onChange={(e) => setF({ ...f, trigger: e.target.value })}>{TRIGGERS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Route"><select className="input text-[12.5px]" value={f.route} onChange={(e) => setF({ ...f, route: e.target.value })}>{ROUTES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Trigger detail" span={2}><input className="input text-[12.5px]" value={f.trigger_detail} onChange={(e) => setF({ ...f, trigger_detail: e.target.value })} placeholder="When does this fire? e.g. new lead from any channel" /></Field>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase text-zinc-400">Actions</div>
          <button className="text-[11px] text-violet-600 font-semibold" onClick={() => setF({ ...f, actions: [...f.actions, { type: "task", title: "Follow-up task" }] })}>+ Add action</button>
        </div>
        <div className="mt-2 space-y-2">
          {f.actions.map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-100 px-2.5 py-2">
              <select className="input text-[11.5px] w-28" value={a.type} onChange={(e) => setAction(i, "type", e.target.value)}>{ACT_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
              <input className="input text-[11.5px] flex-1" value={a.title} onChange={(e) => setAction(i, "title", e.target.value)} placeholder={a.type === "task" ? "Task title" : "Message title"} />
              <button className="text-zinc-300 hover:text-red-500" onClick={() => setF({ ...f, actions: f.actions.filter((_: any, idx: number) => idx !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Create Workflow"}</button>
      </div>
    </Modal>
  );
}

/* ============ IVR & Call Routing (functional) ============ */

function IvrTab({ menus, calls, load, onNew, onSim }: any) {
  const { rows = [], summary = [] } = calls;
  const s = Object.fromEntries(summary.map((x: any) => [x.outcome, x.n]));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        <Stat label="IVR Menus" value={menus.length} />
        <Stat label="Calls" value={rows.length} />
        <Stat label="Connected" value={s.connected ?? 0} tone="green" />
        <Stat label="No Answer" value={s.no_answer ?? 0} tone="amber" />
        <Stat label="Callbacks" value={s.callback ?? 0} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {menus.map((m: any) => {
          const options = (() => { try { return JSON.parse(m.menu_options || "[]"); } catch { return []; } })();
          return (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center"><Phone className="w-4 h-4 text-sky-600" /></div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-zinc-800">{m.name}</div>
                    <div className="text-[11px] text-zinc-400">{m.calls ?? 0} calls received</div>
                  </div>
                </div>
                <Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{m.status}</span></Badge>
              </div>
              <div className="mt-2.5 text-[11px] text-zinc-600">“{m.greeting}”</div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                {options.map((o: any) => (
                  <div key={o.key} className="flex items-center gap-1.5 rounded-md border border-zinc-100 px-2 py-1.5 text-[11px]">
                    <span className="font-bold text-sky-600">{o.key}</span><span className="text-zinc-700">{o.label}</span><span className="ml-auto text-[10px] text-zinc-400">→ {o.route}</span>
                  </div>
                ))}
                {options.length === 0 && <div className="text-[10.5px] text-zinc-400 col-span-2">No menu options</div>}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="btn btn-primary text-[11.5px] !py-1.5" onClick={() => onSim(m)}><Phone className="w-3 h-3 mr-1" />Simulate call</button>
                <button className="text-zinc-300 hover:text-red-500 ml-auto" title="Move to Recycle Bin" onClick={async () => { if (confirm(`Move IVR menu “${m.name}” to the Recycle Bin?`)) { await api(`/gn/ivr/menus/${m.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card pad={false}>
        <div className="px-3 py-2.5 border-b border-zinc-100 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-zinc-700">Call Logs</div>
          <ImportExport entity="call_logs" />
        </div>
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
            <th className="px-3 py-2 font-semibold">Call ID</th><th className="px-3 py-2 font-semibold">Caller</th><th className="px-3 py-2 font-semibold">IVR Menu</th><th className="px-3 py-2 font-semibold">Route</th><th className="px-3 py-2 font-semibold">Outcome</th><th className="px-3 py-2 font-semibold">Duration</th><th className="px-3 py-2 font-semibold">Time</th>
          </tr></thead>
          <tbody>
            {rows.map((c: any) => (
              <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2 font-medium text-zinc-700">{c.call_id}</td>
                <td className="px-3 py-2 text-zinc-600">{c.caller}</td>
                <td className="px-3 py-2 text-zinc-600">{c.ivr_name ?? "—"}</td>
                <td className="px-3 py-2"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-sky-200 bg-sky-50 text-sky-700">{c.route}</span></Badge></td>
                <td className="px-3 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.outcome === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : c.outcome === "callback" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{c.outcome}</span></td>
                <td className="px-3 py-2 text-zinc-500">{c.duration_sec}s</td>
                <td className="px-3 py-2 text-zinc-400">{String(c.created_at).slice(0, 16)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-zinc-400 text-[12px]">No calls logged yet</td></tr>}
          </tbody>
        </table>
      </Card>
      <button className="btn btn-secondary text-[12px]" onClick={onNew}><Plus className="w-3.5 h-3.5 mr-1" />New IVR Menu</button>
    </div>
  );
}

function IvrModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ name: "", greeting: "", fallback: "Telecalling", menu_options: [{ key: "1", label: "New Loan Enquiry", route: "Telecalling" }] });
  const [busy, setBusy] = useState(false);
  const setOpt = (i: number, k: string, v: any) => setF({ ...f, menu_options: f.menu_options.map((o: any, idx: number) => (idx === i ? { ...o, [k]: v } : o)) });
  const save = async () => {
    setBusy(true);
    try { await api("/gn/ivr/menus", { method: "POST", body: f }); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New IVR Menu">
      <Field label="Menu name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Main Line — Sales & Support" /></Field>
      <div className="mt-3"><Field label="Greeting"><textarea className="input text-[12.5px]" rows={2} value={f.greeting} onChange={(e) => setF({ ...f, greeting: e.target.value })} placeholder="Welcome to Growth Nations. Press 1 for…" /></Field></div>
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase text-zinc-400">Menu options</div>
          <button className="text-[11px] text-sky-600 font-semibold" onClick={() => setF({ ...f, menu_options: [...f.menu_options, { key: String(f.menu_options.length + 1), label: "", route: "Telecalling" }] })}>+ Add option</button>
        </div>
        <div className="mt-2 space-y-2">
          {f.menu_options.map((o: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-100 px-2.5 py-2">
              <input className="input text-[11.5px] w-10" value={o.key} onChange={(e) => setOpt(i, "key", e.target.value)} />
              <input className="input text-[11.5px] flex-1" value={o.label} onChange={(e) => setOpt(i, "label", e.target.value)} placeholder="Option label" />
              <select className="input text-[11.5px] w-36" value={o.route} onChange={(e) => setOpt(i, "route", e.target.value)}>{IVR_ROUTES.map((r) => <option key={r}>{r}</option>)}</select>
              <button className="text-zinc-300 hover:text-red-500" onClick={() => setF({ ...f, menu_options: f.menu_options.filter((_: any, idx: number) => idx !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3"><Field label="Fallback route"><select className="input text-[12.5px]" value={f.fallback} onChange={(e) => setF({ ...f, fallback: e.target.value })}>{IVR_ROUTES.map((r) => <option key={r}>{r}</option>)}</select></Field></div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Create IVR Menu"}</button>
      </div>
    </Modal>
  );
}

function SimCallModal({ menu, onClose, onDone }: any) {
  const [option, setOption] = useState("1");
  const [outcome, setOutcome] = useState("connected");
  const [caller, setCaller] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (menu) { setOption("1"); setOutcome("connected"); setCaller(""); } }, [menu]);
  if (!menu) return null;
  const options = (() => { try { return JSON.parse(menu.menu_options || "[]"); } catch { return []; } })();
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("/gn/ivr/calls", { method: "POST", body: { caller: caller || undefined, ivr_menu_id: menu.id, option, outcome } });
      alert(`Call ${r.call_id} logged — caller routed to ${r.route}.`);
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Simulate Call — ${menu.name}`}>
      <div className="space-y-3">
        <Field label="Caller (masked demo)"><input className="input text-[12.5px]" value={caller} onChange={(e) => setCaller(e.target.value)} placeholder="auto-generated" /></Field>
        <Field label="Option pressed">
          <select className="input text-[12.5px]" value={option} onChange={(e) => setOption(e.target.value)}>
            {options.map((o: any) => <option key={o.key} value={o.key}>{o.key} — {o.label} → {o.route}</option>)}
            {options.length === 0 && <option value="?">(no options)</option>}
          </select>
        </Field>
        <Field label="Outcome"><select className="input text-[12.5px]" value={outcome} onChange={(e) => setOutcome(e.target.value)}>{["connected", "no_answer", "busy", "callback", "invalid_option"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy} onClick={save}>{busy ? "Logging…" : "Log Call"}</button>
      </div>
    </Modal>
  );
}

function AddCampaignModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ name: "", channel: "meta", spend: 0, leads: 0, applications: 0, disbursed_amount: 0 });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/campaigns", { method: "POST", body: { ...f, spend: Number(f.spend), leads: Number(f.leads), applications: Number(f.applications), disbursed_amount: Number(f.disbursed_amount) } });
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Campaign">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Campaign name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Channel"><select className="input text-[12.5px]" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Spend (₹)"><input className="input text-[12.5px]" type="number" value={f.spend} onChange={(e) => setF({ ...f, spend: e.target.value })} /></Field>
        <Field label="Leads"><input className="input text-[12.5px]" type="number" value={f.leads} onChange={(e) => setF({ ...f, leads: e.target.value })} /></Field>
        <Field label="Applications"><input className="input text-[12.5px]" type="number" value={f.applications} onChange={(e) => setF({ ...f, applications: e.target.value })} /></Field>
        <Field label="Disbursed (₹)"><input className="input text-[12.5px]" type="number" value={f.disbursed_amount} onChange={(e) => setF({ ...f, disbursed_amount: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Create Campaign"}</button>
      </div>
    </Modal>
  );
}
