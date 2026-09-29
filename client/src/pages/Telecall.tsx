import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneCall, PhoneOff, Clock } from "lucide-react";
import { api, fmtInr, fmtDate, timeAgo } from "../lib/api";
import { PageHeader, Card, Stat, Badge, Modal, Field } from "../components/ui";
import { ImportExport } from "./gn/shared";

export default function Telecall() {
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [active, setActive] = useState<any>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [call, setCall] = useState<any>({ outcome: "contacted", note: "", duration_sec: 120 });
  const [quickStatus, setQuickStatus] = useState("interested");

  const load = () => api("/telecall").then(setData);
  useEffect(() => { load(); }, []);

  if (!data) return null;
  const s = data.stats;

  const statusOrder = (st: string) => ({ new: 0, assigned: 1, contacted: 2, followup: 3, interested: 4, converted: 5 }[st] ?? 9);

  const logCall = async (leadId: number) => {
    await api(`/leads/${leadId}/activity`, { method: "POST", body: { kind: "call", ...call } });
    await api(`/leads/${leadId}`, { method: "PATCH", body: { status: call.outcome === "interested" ? "interested" : call.outcome === "callback" ? "followup" : call.outcome === "not_interested" ? "not_interested" : "contacted" } });
    setCallOpen(false);
    setCall({ outcome: "contacted", note: "", duration_sec: 120 });
    load();
  };

  return (
    <div>
      <PageHeader title="Telecalling workspace" sub="Prioritized lead queue for outbound conversion" breadcrumb="CRM / Telecalling" actions={<div className="flex items-center gap-2"><ImportExport entity="core_leads" /></div>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Stat label="In queue" value={s.total} icon={<Phone size={16} />} />
        <Stat label="Connected" value={s.connected} tone="green" icon={<PhoneCall size={16} />} />
        <Stat label="Interested" value={s.interested} tone="brand" icon={<PhoneCall size={16} />} />
        <Stat label="Applications" value={data.rows.filter((r: any) => r.customer_id).length} tone="amber" />
        <Stat label="Conversions" value={s.converted} tone="green" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-zinc-900">Priority queue</h3>
          <span className="text-[11px] text-zinc-400">Sorted by interest level, follow-up time & score</span>
        </div>
        <div className="divide-y divide-zinc-50">
          {[...data.rows].sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || b.score - a.score).map((l: any) => (
            <div key={l.id} className="flex items-center gap-3 py-3 px-1 hover:bg-zinc-50/70 rounded-md cursor-pointer" onClick={() => nav(`/leads/${l.id}`)}>
              <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-[12px] font-semibold shrink-0">
                {l.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-800 text-[13px]">{l.name}</span>
                  <Badge status={l.status} />
                </div>
                <div className="text-[11px] text-zinc-400">
                  {l.mobile} · {fmtInr(l.requested_amount)} · <span className="capitalize">{l.loan_type}</span> · {l.city || "—"}
                </div>
              </div>
              <div className="hidden md:block w-28">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full ${l.score >= 70 ? "bg-emerald-500" : l.score >= 45 ? "bg-amber-500" : "bg-zinc-300"}`} style={{ width: `${l.score}%` }} />
                  </div>
                  <span className="num text-[11px] font-semibold text-zinc-600">{l.score}</span>
                </div>
                {l.followup_at && <div className="text-[10.5px] text-zinc-400 mt-1 flex items-center gap-1"><Clock size={10} />{fmtDate(l.followup_at)}</div>}
              </div>
              <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-primary btn-sm" onClick={() => { setActive(l); setCallOpen(true); }}><Phone size={12} /> Call</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={callOpen} onClose={() => setCallOpen(false)} title={`Log call — ${active?.name || ""}`}>
        <div className="space-y-3">
          <Field label="Outcome">
            <select className="input" value={call.outcome} onChange={(e) => setCall({ ...call, outcome: e.target.value })}>
              <option value="contacted">Contacted — not yet interested</option>
              <option value="interested">Interested — follow up</option>
              <option value="callback">Requested callback</option>
              <option value="not_interested">Not interested</option>
              <option value="wrong_number">Wrong number</option>
              <option value="dnd">DND</option>
            </select>
          </Field>
          <Field label="Duration (seconds)"><input className="input num" type="number" value={call.duration_sec} onChange={(e) => setCall({ ...call, duration_sec: Number(e.target.value) })} /></Field>
          <Field label="Call notes"><textarea className="input min-h-20" value={call.note} onChange={(e) => setCall({ ...call, note: e.target.value })} placeholder="Customer response, product interest, next steps…" /></Field>
          <div className="flex gap-1.5">
            {["interested", "followup", "not_interested"].map((st) => (
              <button key={st} className={`btn btn-sm ${quickStatus === st ? "btn-primary" : "btn-secondary"}`} onClick={() => setQuickStatus(st)}>{st}</button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setCallOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => logCall(active.id)}>Save call log</button>
        </div>
      </Modal>
    </div>
  );
}
