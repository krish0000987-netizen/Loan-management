import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, MessageSquare, StickyNote, UserPlus, ChevronRight } from "lucide-react";
import { api, fmtDate, fmtInr, timeAgo } from "../lib/api";
import { Card, CardTitle, Badge, KV, Modal, Field, PageHeader } from "../components/ui";

const STATUSES = ["new", "assigned", "contacted", "interested", "followup", "converted", "dnd", "wrong_number", "lost", "not_interested"];

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [convertOpen, setConvertOpen] = useState(false);
  const [activity, setActivity] = useState("");
  const [note, setNote] = useState("");
  const [convert, setConvert] = useState<any>({ product_id: null, requested_amount: 0, tenure: 36 });

  const load = () => api(`/leads/${id}`).then(setData);
  useEffect(() => { load(); api("/products").then(setProducts); }, [id]);

  if (!data) return null;
  const l = data.lead;

  const setStatus = async (s: string) => {
    await api(`/leads/${l.id}`, { method: "PATCH", body: { status: s } });
    load();
  };

  const logActivity = async (kind: string) => {
    await api(`/leads/${l.id}/activity`, { method: "POST", body: { kind, note } });
    setNote("");
    load();
  };

  const doConvert = async () => {
    const res = await api(`/leads/${l.id}/convert`, { method: "POST", body: { ...convert, requested_amount: Number(convert.requested_amount) } });
    setConvertOpen(false);
    nav(`/applications/${res.applicationId}`);
  };

  return (
    <div>
      <PageHeader
        title={l.name}
        sub={`${l.lead_no} · ${l.mobile || ""} · ${l.city || ""}${l.city ? ", " : ""}${l.state || ""}`}
        breadcrumb={`CRM / Leads / ${l.lead_no}`}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => nav("/leads")}><ArrowLeft size={13} /> Back</button>
            {l.status !== "converted" && <button className="btn btn-primary" onClick={() => { setConvert({ ...convert, product_id: products[0]?.id, requested_amount: l.requested_amount || 0 }); setConvertOpen(true); }}><UserPlus size={14} /> Convert to application</button>}
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="space-y-4">
          <Card>
            <CardTitle title="Lead details" right={<Badge status={l.status} />} />
            <KV k="Lead ID" v={l.lead_no} />
            <KV k="Loan type" v={<span className="capitalize">{l.loan_type}</span>} />
            <KV k="Requested amount" v={fmtInr(l.requested_amount)} mono />
            <KV k="Monthly income" v={l.monthly_income ? fmtInr(l.monthly_income) : "—"} mono />
            <KV k="Business turnover" v={l.business_turnover ? fmtInr(l.business_turnover) : "—"} mono />
            <KV k="Source" v={<span className="capitalize">{l.source}</span>} />
            <KV k="Campaign" v={l.campaign || "—"} />
            <KV k="Owner" v={l.owner_name || "Unassigned"} />
            <KV k="Next action" v={l.next_action || "—"} />
            <KV k="Follow-up" v={fmtDate(l.followup_at)} />
            <KV k="Created" v={fmtDate(l.created_at)} />
          </Card>
          <Card>
            <CardTitle title="Lead score" sub="Predictive priority" />
            <div className="text-center py-2">
              <div className="text-[38px] font-bold num tracking-tight text-zinc-900">{l.score}</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wide">of 100</div>
              <div className="mt-3 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div className={`h-full ${l.score >= 70 ? "bg-emerald-500" : l.score >= 45 ? "bg-amber-500" : "bg-zinc-400"}`} style={{ width: `${l.score}%` }} />
              </div>
              <div className="mt-2 text-[11.5px] text-zinc-500">{l.probability}% conversion probability</div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-100">
              {STATUSES.filter((s) => s !== "converted").map((s) => (
                <button key={s} className={`btn btn-sm ${l.status === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatus(s)}>{s.replace(/_/g, " ")}</button>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardTitle title="Communication & activity" sub="Calls, WhatsApp, notes — full engagement history" />
            <div className="flex gap-2 mb-4">
              <button className="btn btn-primary btn-sm" onClick={() => logActivity("call")}><Phone size={12} /> Log call</button>
              <button className="btn btn-secondary btn-sm" onClick={() => logActivity("whatsapp")}><MessageSquare size={12} /> WhatsApp</button>
              <button className="btn btn-secondary btn-sm" onClick={() => logActivity("note")}><StickyNote size={12} /> Add note</button>
            </div>
            <div className="relative pl-4 border-l border-zinc-200 space-y-4">
              {(data.activities || []).map((a: any) => (
                <div key={a.id} className="relative">
                  <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${a.kind === "call" ? "bg-brand-500" : a.kind === "whatsapp" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  <div className="text-[12px]">
                    <span className="font-semibold text-zinc-800 capitalize">{a.kind === "status_change" ? "Status change" : a.kind}</span>
                    {a.outcome && <span className="text-zinc-500"> → {a.outcome}</span>}
                    <span className="text-zinc-300 mx-1.5">·</span>
                    <span className="text-zinc-400 text-[11px]">{timeAgo(a.created_at)}</span>
                  </div>
                  {a.note && <div className="text-[11.5px] text-zinc-600 mt-1">{a.note}</div>}
                </div>
              ))}
              {!data.activities?.length && <div className="text-[12px] text-zinc-400 py-4">No activity yet — log the first interaction.</div>}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={convertOpen} onClose={() => setConvertOpen(false)} title={`Convert ${l.name} to application`}>
        <div className="space-y-3">
          <Field label="Loan product">
            <select className="input" value={convert.product_id} onChange={(e) => setConvert({ ...convert, product_id: Number(e.target.value) })}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Requested amount"><input className="input num" type="number" value={convert.requested_amount} onChange={(e) => setConvert({ ...convert, requested_amount: e.target.value })} /></Field>
          <Field label="Tenure (months)"><input className="input num" type="number" value={convert.tenure} onChange={(e) => setConvert({ ...convert, tenure: Number(e.target.value) })} /></Field>
          <div className="bg-zinc-50 border border-zinc-100 rounded-md px-3 py-2.5 text-[11.5px] text-zinc-600">
            This creates a customer profile and originates a loan application that flows through KYC → Credit → BRE → Underwriting → Disbursement.
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setConvertOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={doConvert} disabled={!convert.product_id || !convert.requested_amount}>Create application <ChevronRight size={13} /></button>
        </div>
      </Modal>
    </div>
  );
}
