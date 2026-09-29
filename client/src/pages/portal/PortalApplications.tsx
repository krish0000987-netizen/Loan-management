import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fmtInr, fmtDate, STAGE_LABELS } from "../../lib/api";
import { PageHeader, Card, Badge, KV, Progress } from "../../components/ui";

export default function PortalApplications() {
  const nav = useNavigate();
  const { id } = useParams();
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (id) api(`/portal/applications/${id}`).then(setDetail).catch(() => setDetail(null));
    else api("/portal/applications").then((r) => setList(r.rows));
  }, [id]);

  if (id) return <Detail data={detail} back={() => nav("/portal/applications")} />;

  return (
    <div>
      <PageHeader title="My applications" sub="Track the status of every application you've submitted" />
      <Card>
        <div className="space-y-2">
          {list.map((a) => (
            <button key={a.id} className="w-full text-left rounded-md border border-zinc-100 hover:border-zinc-300 px-3.5 py-3 cursor-pointer" onClick={() => nav(`/portal/applications/${a.id}`)}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-zinc-800">{a.application_no} · {a.product_name}</span>
                <Badge status={a.status === "in_progress" ? a.stage : a.status} />
              </div>
              <div className="flex items-center justify-between mt-1 text-[11.5px] text-zinc-500">
                <span>{STAGE_LABELS[a.stage] ?? a.stage} · submitted {fmtDate(a.created_at)}</span>
                <span className="num font-medium text-zinc-700">{fmtInr(a.requested_amount)}</span>
              </div>
            </button>
          ))}
          {!list.length && <div className="py-12 text-center text-[12.5px] text-zinc-400">No applications yet.</div>}
        </div>
      </Card>
    </div>
  );
}

function Detail({ data, back }: { data: any; back: () => void }) {
  const [ack, setAck] = useState(false);
  useEffect(() => { setAck(false); }, [data?.application?.id]);
  if (!data) return <div className="py-16 text-center text-zinc-400 text-[13px]">Loading…</div>;
  const { application, stages, documents, kfs, sanction, sla } = data;

  const activeIdx = stages.findIndex((s: any) => s.status === "in_progress");
  const stageOrder = ["application", "kyc", "documents", "credit", "banking", "gst", "bre", "underwriting", "approval", "sanction", "kfs", "agreement", "esign", "disbursement"];

  return (
    <div>
      <PageHeader title={application.application_no} sub={`${application.product_name} · ${fmtInr(application.requested_amount)} requested`} actions={<button className="btn btn-secondary" onClick={back}>← Back</button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Application journey</h3>
          <div className="space-y-2">
            {stageOrder.filter((s) => stageOrder.indexOf(s) <= activeIdx + 1).map((code) => {
              const row = stages.find((s: any) => s.stage === code);
              const done = row?.status === "completed";
              const current = row?.status === "in_progress";
              return (
                <div key={code} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : current ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                    {done ? "✓" : current ? "" : ""}
                  </div>
                  <div className="flex-1 text-[12.5px]">
                    <span className={done ? "text-zinc-500 line-through" : current ? "text-zinc-900 font-semibold" : "text-zinc-400"}>{STAGE_LABELS[code] ?? code}</span>
                    {current && <span className="ml-2 text-[10.5px] text-brand-600 font-medium">IN PROGRESS</span>}
                    {row?.entered_at && <span className="ml-2 text-[10.5px] text-zinc-400">{fmtDate(row.entered_at)}</span>}
                  </div>
                  <Badge status={row?.status ?? "pending"} />
                </div>
              );
            })}
          </div>

          {kfs && (
            <div className="mt-5 rounded-md border border-zinc-200">
              <div className="px-3.5 py-2.5 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-zinc-800">Key Fact Statement · v{kfs.version}</span>
                <Badge status={kfs.status} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-0.5 p-3.5">
                <KV k="Loan amount" v={fmtInr(kfs.content.loan_amount)} mono />
                <KV k="Tenure" v={`${kfs.content.tenure_months} months`} />
                <KV k="Interest rate" v={`${kfs.content.annual_interest_rate}% p.a.`} />
                <KV k="EMI" v={fmtInr(kfs.content.emi)} mono />
                <KV k="Total fees" v={fmtInr(kfs.content.total_fees)} mono />
                <KV k="APR (incl. fees)" v={`${kfs.content.apr}%`} mono />
              </div>
              {!kfs.acknowledged_at && !ack && (
                <div className="px-3.5 py-3 border-t border-zinc-100">
                  <button className="btn btn-primary" onClick={async () => { await api(`/portal/kfs/${application.id}/acknowledge`, { method: "POST", body: {} }); setAck(true); }}>
                    Acknowledge KFS
                  </button>
                </div>
              )}
              {(kfs.acknowledged_at || ack) && <div className="px-3.5 py-2.5 border-t border-zinc-100 text-[11.5px] text-emerald-700">✓ Acknowledged {kfs.acknowledged_at ? fmtDate(kfs.acknowledged_at) : "just now"}</div>}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">Documents</h3>
            <div className="space-y-1.5">
              {documents.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-zinc-700 capitalize">{d.name || d.category}</span>
                  <Badge status={d.status} />
                </div>
              ))}
              {!documents.length && <div className="text-[12px] text-zinc-400 py-3 text-center">No documents uploaded.</div>}
            </div>
          </Card>
          {sanction && (
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">Sanction</h3>
              <KV k="Sanctioned amount" v={fmtInr(sanction.amount)} mono />
              <KV k="Rate" v={`${sanction.rate}%`} />
              <KV k="EMI" v={fmtInr(sanction.emi)} mono />
              <KV k="Status" v={<Badge status={sanction.status} />} />
            </Card>
          )}
          <Card>
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">SLA on current stage</h3>
            {sla && (
              <>
                <div className="flex items-center justify-between text-[11.5px] text-zinc-500 mb-1.5">
                  <span>{sla.stage_name}</span>
                  <span>{sla.elapsed_hours}h / {sla.sla_hours}h</span>
                </div>
                <Progress value={sla.pct} tone={sla.status === "breached" ? "red" : sla.status === "at_risk" ? "amber" : "brand"} />
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
