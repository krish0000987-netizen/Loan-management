import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Stat, Tabs, EmptyState } from "../../components/ui";
import { api } from "../../lib/api";
import { Send, Plus, Trash2, Play, MessageSquare, Mail, Phone, Smartphone, Pause } from "lucide-react";
import { ImportExport } from "./shared";

const CHANNELS = ["whatsapp", "sms", "email", "call"];

export function GnInbox() {
  const [tab, setTab] = useState("inbox");
  const [data, setData] = useState<any>({ rows: [], summary: [] });
  const [tpls, setTpls] = useState<any>({ rows: [], summary: [] });
  const [drips, setDrips] = useState<any>({ rows: [], summary: [] });
  const [composeOpen, setComposeOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [dripOpen, setDripOpen] = useState(false);
  const [filter, setFilter] = useState<any>({ channel: "", status: "" });

  const loadInbox = () => {
    const p = new URLSearchParams();
    if (filter.channel) p.set("channel", filter.channel);
    if (filter.status) p.set("status", filter.status);
    api(`/gn/inbox${p.toString() ? `?${p}` : ""}`).then(setData).catch(() => {});
  };
  const loadTpls = () => api("/gn/inbox/templates").then(setTpls).catch(() => {});
  const loadDrips = () => api("/gn/inbox/drips").then(setDrips).catch(() => {});
  useEffect(loadInbox, [filter]);
  useEffect(() => { if (tab === "templates") loadTpls(); }, [tab]);
  useEffect(() => { if (tab === "drips") loadDrips(); }, [tab]);

  const unread = data.summary.filter((s: any) => s.direction === "in" && s.status === "unread").reduce((a: number, s: any) => a + s.n, 0);
  const chCount = (ch: string) => data.summary.filter((s: any) => s.channel === ch).reduce((a: number, s: any) => a + s.n, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Inbox" sub="Unified customer communication — WhatsApp, SMS, Email & Call threads" breadcrumb="Growth Nations / Inbox" actions={
        <div className="flex items-center gap-2">
          <ImportExport entity={tab === "inbox" ? "inbox" : tab === "drips" ? "drips" : "templates"} onImported={() => { if (tab === "inbox") loadInbox(); else if (tab === "drips") loadDrips(); else loadTpls(); }} />
          {tab === "inbox" && <button className="btn btn-primary text-[12px]" onClick={() => setComposeOpen(true)}><Send className="w-3.5 h-3.5 mr-1" />Compose</button>}
          {tab === "templates" && <button className="btn btn-primary text-[12px]" onClick={() => setTplOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Template</button>}
          {tab === "drips" && <button className="btn btn-primary text-[12px]" onClick={() => setDripOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Drip</button>}
        </div>
      } />
      <Tabs items={[
        { key: "inbox", label: "Inbox", count: unread },
        { key: "drips", label: "WhatsApp Drips", count: drips.rows.length },
        { key: "templates", label: "Templates", count: tpls.rows.length }
      ]} active={tab} onChange={setTab} />

      {tab === "inbox" && <>
        <div className="grid grid-cols-4 gap-4">
          <Stat label="Total Messages" value={data.rows.length} />
          <Stat label="Unread" value={unread} tone="brand" />
          <Stat label="WhatsApp" value={chCount("whatsapp")} />
          <Stat label="Emails" value={chCount("email")} sub={`${chCount("sms")} SMS · ${chCount("call")} calls`} />
        </div>
        <div className="flex items-center gap-2">
          <select className="input text-[11.5px] w-40" value={filter.channel} onChange={(e) => setFilter({ ...filter, channel: e.target.value })}>
            <option value="">All channels</option>{CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input text-[11.5px] w-40" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All statuses</option>{["unread", "read", "replied", "sent", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {data.rows.length === 0 && <span className="text-[11px] text-zinc-400">No messages match the filters</span>}
        </div>
        <div className="space-y-2">
          {data.rows.map((m: any) => (
            <div key={m.id} className={`rounded-lg border px-3 py-2.5 ${m.status === "unread" && m.direction === "in" ? "border-violet-200 bg-violet-50/40" : "border-zinc-100 bg-white"}`}>
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.channel === "whatsapp" ? "bg-emerald-50 text-emerald-600" : m.channel === "email" ? "bg-amber-50 text-amber-600" : m.channel === "call" ? "bg-sky-50 text-sky-600" : "bg-zinc-100 text-zinc-500"}`}>
                  {m.channel === "whatsapp" ? <MessageSquare className="w-3.5 h-3.5" /> : m.channel === "email" ? <Mail className="w-3.5 h-3.5" /> : m.channel === "call" ? <Phone className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <span className={`font-semibold ${m.direction === "out" ? "text-zinc-400" : "text-zinc-800"}`}>{m.direction === "out" ? `→ ${m.to_contact ?? "—"}` : `← ${m.from_contact ?? "—"}`}</span>
                    {m.subject && <span className="text-zinc-500 truncate">· {m.subject}</span>}
                    <span className="ml-auto flex items-center gap-2">
                      <Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 bg-zinc-50 text-zinc-500 uppercase">{m.channel}</span></Badge>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.status === "unread" ? "border-violet-200 bg-violet-50 text-violet-700" : m.status === "failed" ? "border-red-200 bg-red-50 text-red-600" : m.status === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{m.status}</span>
                      <span className="text-[10.5px] text-zinc-400">{String(m.created_at).slice(0, 16)}</span>
                    </span>
                  </div>
                  <div className="text-[12px] text-zinc-600 mt-0.5 line-clamp-2">{m.body}</div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {m.direction === "in" && m.status !== "replied" && (
                    <button className="text-[10.5px] text-violet-600 font-semibold px-1.5 py-1 hover:bg-violet-50 rounded" onClick={async () => { await api(`/gn/inbox/${m.id}`, { method: "PATCH", body: { status: "replied" } }); loadInbox(); }}>Mark replied</button>
                  )}
                  {m.status === "unread" && (
                    <button className="text-[10.5px] text-zinc-500 font-semibold px-1.5 py-1 hover:bg-zinc-100 rounded" onClick={async () => { await api(`/gn/inbox/${m.id}`, { method: "PATCH", body: { status: "read" } }); loadInbox(); }}>Mark read</button>
                  )}
                  <button title="Move to Recycle Bin" className="text-zinc-300 hover:text-red-500 p-1" onClick={async () => { if (confirm("Move this message to the Recycle Bin?")) { await api(`/gn/inbox/${m.id}`, { method: "DELETE" }); loadInbox(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {data.rows.length === 0 && <EmptyState title="Inbox is empty" sub="Inbound WhatsApp, SMS, email and call threads will appear here." />}
        </div>
      </>}

      {tab === "drips" && <DripsTab drips={drips} load={loadDrips} onNew={() => setDripOpen(true)} />}
      {tab === "templates" && <TemplatesTab tpls={tpls} load={loadTpls} onNew={() => setTplOpen(true)} />}

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} onDone={() => { setComposeOpen(false); loadInbox(); }} />
      <TemplateModal open={tplOpen} onClose={() => setTplOpen(false)} onDone={() => { setTplOpen(false); loadTpls(); }} />
      <DripModal open={dripOpen} onClose={() => setDripOpen(false)} onDone={() => { setDripOpen(false); loadDrips(); }} tpls={tpls.rows} />
    </div>
  );
}

function DripsTab({ drips, load, onNew }: any) {
  const { rows = [], summary = [] } = drips;
  const s = Object.fromEntries(summary.map((x: any) => [x.status, x.n]));
  const triggerLabel: Record<string, string> = { lead_captured: "Lead Captured", post_disbursement: "Post Disbursement", missed_emi: "Missed EMI", inquiry: "Inquiry" };
  const audienceLabel: Record<string, string> = { all_leads: "All leads", no_application: "Leads w/o application", disb_only: "Disbursed only", overdue: "Overdue" };
  const toggle = async (d: any) => {
    await api(`/gn/inbox/drips/${d.id}`, { method: "PATCH", body: { status: d.status === "active" ? "paused" : "active" } });
    load();
  };
  const send = async (d: any) => {
    const r = await api(`/gn/inbox/drips/${d.id}/send`, { method: "POST" });
    alert(`Drip sent — ${r.sent} WhatsApp messages enqueued to the audience.`);
    load();
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Drip Campaigns" value={rows.length} />
        <Stat label="Active" value={s.active ?? 0} tone="green" />
        <Stat label="Paused" value={s.paused ?? 0} tone="amber" />
        <Stat label="Total Sent" value={rows.reduce((a: number, d: any) => a + (d.sent_count ?? 0), 0)} />
      </div>
      <Card pad={false}>
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
            <th className="px-3 py-2.5 font-semibold">Drip</th><th className="px-3 py-2.5 font-semibold">Trigger</th><th className="px-3 py-2.5 font-semibold">Audience</th><th className="px-3 py-2.5 font-semibold">Template</th><th className="px-3 py-2.5 font-semibold">Schedule</th><th className="px-3 py-2.5 font-semibold">Sent / Delivered</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5"></th>
          </tr></thead>
          <tbody>
            {rows.map((d: any) => (
              <tr key={d.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-medium text-zinc-800">{d.name}</td>
                <td className="px-3 py-2.5 text-zinc-600">{triggerLabel[d.trigger] ?? d.trigger}</td>
                <td className="px-3 py-2.5 text-zinc-600">{audienceLabel[d.audience] ?? d.audience}</td>
                <td className="px-3 py-2.5 text-zinc-600">{d.template_name ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-500">{d.schedule}{d.custom_hour != null ? ` @ ${d.custom_hour}:00` : ""}</td>
                <td className="px-3 py-2.5 text-zinc-600">{d.sent_count ?? 0} / {d.delivered_count ?? 0}</td>
                <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${d.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : d.status === "paused" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{d.status}</span></Badge></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button className="btn btn-primary text-[10.5px] !py-1 !px-2" onClick={() => send(d)}><Play className="w-3 h-3 mr-1" />Send</button>
                    <button className="btn btn-secondary text-[10.5px] !py-1 !px-2" onClick={() => toggle(d)}>{d.status === "active" ? <Pause className="w-3 h-3" /> : <><Play className="w-3 h-3 mr-1" />Run</>}</button>
                    <button title="Move to Recycle Bin" className="text-zinc-300 hover:text-red-500 p-1" onClick={async () => { if (confirm(`Move drip “${d.name}” to the Recycle Bin?`)) { await api(`/gn/inbox/drips/${d.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-400 text-[12px]">No drips yet</td></tr>}
          </tbody>
        </table>
      </Card>
      <button className="btn btn-secondary text-[12px]" onClick={onNew}><Plus className="w-3.5 h-3.5 mr-1" />New Drip</button>
    </div>
  );
}

function TemplatesTab({ tpls, load, onNew }: any) {
  const { rows = [], summary = [] } = tpls;
  const catCount = (c: string) => summary.filter((s: any) => s.category === c).reduce((a: number, s: any) => a + s.n, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Templates" value={rows.length} />
        <Stat label="WhatsApp" value={catCount("whatsapp")} tone="green" />
        <Stat label="SMS" value={catCount("sms")} />
        <Stat label="Email" value={catCount("email")} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((t: any) => (
          <Card key={t.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-semibold text-zinc-800">{t.name}</div>
              <Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 bg-zinc-50 text-zinc-500 uppercase">{t.category}</span></Badge>
            </div>
            <div className="mt-1 text-[10.5px] text-zinc-400 uppercase">{t.purpose} · used {t.usage_count ?? 0}×</div>
            <div className="mt-2 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-[12px] text-zinc-700 whitespace-pre-wrap">{t.body}</div>
            {(Array.isArray(t.variables) ? t.variables : (() => { try { return JSON.parse(t.variables || "[]"); } catch { return []; } })()).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(Array.isArray(t.variables) ? t.variables : []).map((v: string, i: number) => <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-50 border border-violet-100 text-[10px] font-mono text-violet-600">{`{{${v}}}`}</span>)}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-end">
              <button className="text-zinc-300 hover:text-red-500 p-1" title="Move to Recycle Bin" onClick={async () => { if (confirm(`Move template “${t.name}” to the Recycle Bin?`)) { await api(`/gn/inbox/templates/${t.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </Card>
        ))}
      </div>
      <button className="btn btn-secondary text-[12px]" onClick={onNew}><Plus className="w-3.5 h-3.5 mr-1" />New Template</button>
    </div>
  );
}

function ComposeModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ channel: "whatsapp", to_contact: "", subject: "", body: "", related_type: "lead" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/inbox", { method: "POST", body: { ...f, direction: "out", status: "sent" } });
      alert("Message sent (demo channel — no real delivery).");
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Compose Message">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Channel"><select className="input text-[12.5px]" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>{CHANNELS.filter((c) => c !== "call").map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="To (mobile / email)"><input className="input text-[12.5px]" value={f.to_contact} onChange={(e) => setF({ ...f, to_contact: e.target.value })} placeholder="9XXXXXXXXX" /></Field>
        <Field label="Subject" span={2}><input className="input text-[12.5px]" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
        <Field label="Message" span={2}><textarea className="input text-[12.5px]" rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Type your message…" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.body || !f.to_contact} onClick={save}>{busy ? "Sending…" : "Send (demo)"}</button>
      </div>
    </Modal>
  );
}

function TemplateModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ name: "", category: "whatsapp", purpose: "promotional", body: "", variables: [] });
  const [varText, setVarText] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/inbox/templates", { method: "POST", body: { ...f, variables: varText.split(",").map((v) => v.trim()).filter(Boolean) } });
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Message Template">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Template name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Category"><select className="input text-[12.5px]" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CHANNELS.filter((c) => c !== "call").map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Purpose"><select className="input text-[12.5px]" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })}>{["promotional", "transactional", "collection", "onboarding"].map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Variables (comma-separated)"><input className="input text-[12.5px]" value={varText} onChange={(e) => setVarText(e.target.value)} placeholder="name, amount, ref" /></Field>
        <Field label="Body" span={2}><textarea className="input text-[12.5px]" rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder={"Hi {{name}}, …"} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name || !f.body} onClick={save}>{busy ? "Saving…" : "Create Template"}</button>
      </div>
    </Modal>
  );
}

function DripModal({ open, onClose, onDone, tpls }: any) {
  const [f, setF] = useState<any>({ name: "", trigger: "lead_captured", audience: "all_leads", template_id: "", schedule: "immediate", custom_hour: "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/inbox/drips", { method: "POST", body: { ...f, template_id: f.template_id ? Number(f.template_id) : null, custom_hour: f.custom_hour ? Number(f.custom_hour) : null } });
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New WhatsApp Drip">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Drip name" span={2}><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Trigger"><select className="input text-[12.5px]" value={f.trigger} onChange={(e) => setF({ ...f, trigger: e.target.value })}>{["lead_captured", "post_disbursement", "missed_emi", "inquiry"].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Audience"><select className="input text-[12.5px]" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>{["all_leads", "no_application", "disb_only", "overdue"].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Template"><select className="input text-[12.5px]" value={f.template_id} onChange={(e) => setF({ ...f, template_id: e.target.value })}><option value="">(none)</option>{(tpls ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Schedule"><select className="input text-[12.5px]" value={f.schedule} onChange={(e) => setF({ ...f, schedule: e.target.value })}>{["immediate", "daily", "custom"].map((x) => <option key={x}>{x}</option>)}</select></Field>
        {f.schedule === "custom" && <Field label="Send hour (0-23)"><input className="input text-[12.5px]" type="number" value={f.custom_hour} onChange={(e) => setF({ ...f, custom_hour: e.target.value })} /></Field>}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Create Drip"}</button>
      </div>
    </Modal>
  );
}
