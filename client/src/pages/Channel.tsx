import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtInr, fmtDate } from "../lib/api";
import { PageHeader, Card, Badge, Stat, Field, Modal } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Channel() {
  const { user } = useAuth();
  const isDsa = user?.role === "dsa";
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", city: "", loan_type: "personal", requested_amount: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api(isDsa ? "/channel/dsa" : "/channel/field").then(setData).catch(() => setData(null));
  }, [isDsa]);

  const submitLead = async () => {
    try {
      const r = await api("/channel/leads", { method: "POST", body: { ...form, requested_amount: Number(form.requested_amount) || undefined } });
      setMsg(`Lead ${r.lead_no} created`);
      setCreateOpen(false);
      setTimeout(() => setMsg(""), 4000);
      api(isDsa ? "/channel/dsa" : "/channel/field").then(setData);
    } catch (e: any) { setMsg(e.message); }
  };

  const stats = data?.stats ?? {};

  return (
    <div>
      <PageHeader
        title={isDsa ? "DSA Partner Portal" : "Field Sales Portal"}
        sub={isDsa ? "Your leads, applications, disbursements and commission" : "Today's leads, follow-ups, visits and conversions"}
        breadcrumb={isDsa ? "Network / DSA Portal" : "CRM / Field Portal"}
        actions={<button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ New lead</button>}
      />
      {msg && <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[12px] text-emerald-800">{msg}</div>}

      {isDsa ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="My leads" value={stats.leads ?? 0} tone="brand" />
            <Stat label="Converted" value={stats.converted ?? 0} sub={`${stats.applications ?? 0} applications`} tone="green" />
            <Stat label="Disbursed volume" value={fmtInr(stats.disbursed_amount)} tone="green" />
            <Stat label="Commission (est.)" value={fmtInr(stats.commission)} sub={`${fmtInr(stats.pending_payout)} pending`} tone="amber" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Recent leads</h3>
              <div className="space-y-1.5">
                {(data?.leads ?? []).slice(0, 8).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 cursor-pointer hover:border-zinc-300" onClick={() => nav(`/leads/${l.id}`)}>
                    <div>
                      <div className="text-[12.5px] font-medium text-zinc-800">{l.name}</div>
                      <div className="text-[11px] text-zinc-500">{l.lead_no} · {l.mobile}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] num font-semibold text-zinc-700">{l.amount ? fmtInr(l.amount) : "—"}</div>
                      <Badge status={l.status} />
                    </div>
                  </div>
                ))}
                {!data?.leads?.length && <div className="py-10 text-center text-[12.5px] text-zinc-400">Create your first lead to get started.</div>}
              </div>
            </Card>
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">My applications</h3>
              <div className="space-y-1.5">
                {(data?.applications ?? []).slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 cursor-pointer hover:border-zinc-300" onClick={() => nav(`/applications/${a.id}`)}>
                    <div>
                      <div className="text-[12.5px] font-medium text-zinc-800">{a.application_no}</div>
                      <div className="text-[11px] text-zinc-500">{a.product} · {fmtInr(a.amount)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={a.stage} />
                      {a.decision === "approve" && <span className="badge-green">Approved</span>}
                    </div>
                  </div>
                ))}
                {!data?.applications?.length && <div className="py-10 text-center text-[12.5px] text-zinc-400">No applications yet.</div>}
              </div>
            </Card>
          </div>
          <div className="mt-4 rounded-md bg-zinc-50 border border-zinc-100 px-3.5 py-2.5 text-[11px] text-zinc-500">
            Commission is estimated at a configurable 0.5% of sanctioned principal (demo). Statements can be exported from the Network module.
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <Stat label="Today's leads" value={stats.today_leads ?? 0} sub={`target ${stats.target ?? 5}`} tone="brand" />
            <Stat label="Achieved" value={`${stats.achieved_pct ?? 0}%`} tone={stats.achieved_pct >= 100 ? "green" : "default"} />
            <Stat label="Follow-ups due" value={stats.followups_due ?? 0} tone="amber" />
            <Stat label="Visits" value={stats.visits ?? 0} />
            <Stat label="Calls" value={stats.calls ?? 0} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Today's leads</h3>
              <div className="space-y-1.5">
                {(data?.today_leads ?? []).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 cursor-pointer hover:border-zinc-300" onClick={() => nav(`/leads/${l.id}`)}>
                    <div>
                      <div className="text-[12.5px] font-medium text-zinc-800">{l.name}</div>
                      <div className="text-[11px] text-zinc-500">{l.city} · {l.source}</div>
                    </div>
                    <Badge status={l.status} />
                  </div>
                ))}
                {!data?.today_leads?.length && <div className="py-8 text-center text-[12px] text-zinc-400">No leads logged today.</div>}
              </div>
            </Card>
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Follow-ups due</h3>
              <div className="space-y-1.5">
                {(data?.followups ?? []).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 cursor-pointer hover:border-zinc-300" onClick={() => nav(`/leads/${l.id}`)}>
                    <div>
                      <div className="text-[12.5px] font-medium text-zinc-800">{l.name}</div>
                      <div className="text-[11px] text-zinc-500">{l.lead_no} · due {fmtDate(l.followup_at)}</div>
                    </div>
                    <Badge status={l.status} />
                  </div>
                ))}
                {!data?.followups?.length && <div className="py-8 text-center text-[12px] text-zinc-400">Nothing due.</div>}
              </div>
            </Card>
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Activity log</h3>
              <div className="space-y-2">
                {(data?.activities ?? []).map((a: any) => (
                  <div key={a.id} className="text-[11.5px]">
                    <span className="badge-indigo">{a.kind}</span>
                    <span className="ml-1.5 text-zinc-700">{a.lead_name}</span>
                    <div className="text-zinc-400 mt-0.5">{a.note || a.outcome || ""} · {fmtDate(a.created_at)}</div>
                  </div>
                ))}
                {!data?.activities?.length && <div className="py-8 text-center text-[12px] text-zinc-400">No activity logged.</div>}
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New lead">
        <div className="space-y-3">
          <Field label="Name"><input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Mobile"><input className="input w-full num" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })} /></Field>
          <Field label="City"><input className="input w-full" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Loan type">
            <select className="input w-full" value={form.loan_type} onChange={(e) => setForm({ ...form, loan_type: e.target.value })}>
              {["personal", "business", "msme", "lap", "home", "vehicle", "working_capital", "gold"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Requested amount"><input className="input w-full num" value={form.requested_amount} onChange={(e) => setForm({ ...form, requested_amount: e.target.value.replace(/[^0-9]/g, "") })} placeholder="e.g. 300000" /></Field>
          <button className="btn btn-primary w-full" disabled={!form.name || form.mobile.length < 10} onClick={submitLead}>Create lead</button>
        </div>
      </Modal>
    </div>
  );
}
