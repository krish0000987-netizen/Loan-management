import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck, Check, X, RotateCcw, ChevronRight } from "lucide-react";
import { api, fmtInr, fmtDate, badgeFor, statusLabel } from "../lib/api";
import { PageHeader, Card, Badge, Modal, Field, DataTable, type Column } from "../components/ui";
import { ImportExport } from "./gn/shared";

export default function Underwriting() {
  const nav = useNavigate();
  const [data, setData] = useState<any>({ rows: [], total: 0 });
  const [decision, setDecision] = useState<any>(null);
  const [form, setForm] = useState<any>({ decision: "approve", note: "", approved_amount: 0 });

  const load = () => api("/applications?stage=&limit=100").then(setData);
  useEffect(() => {
    api("/applications?limit=100").then(setData);
  }, []);

  const reviewApps = (data.rows || []).filter((r: any) => ["bre", "underwriting", "approval"].includes(r.stage) && r.decision === "pending" && r.status !== "rejected");

  const submit = async () => {
    await api(`/applications/${decision.id}/decide`, { method: "POST", body: { ...form, approved_amount: Number(form.approved_amount) } });
    setDecision(null);
    load();
  };

  const columns: Column<any>[] = [
    { key: "app", header: "Application", render: (r) => <span className="font-medium">{r.application_no}</span> },
    { key: "customer", header: "Customer", sortValue: (r) => r.customer_name, render: (r) => (
      <div>
        <div className="font-medium text-zinc-800">{r.customer_name}</div>
        <div className="text-[10.5px] text-zinc-400">{r.mobile}</div>
      </div>
    )},
    { key: "product", header: "Product", render: (r) => <span className="text-zinc-600">{r.product_name}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.requested_amount, render: (r) => <span className="num">{fmtInr(r.requested_amount)}</span> },
    { key: "stage", header: "Stage", render: (r) => <Badge status={r.stage} /> },
    { key: "bre", header: "BRE", render: (r) => r.bre_result === "pending" ? <span className="text-zinc-300">—</span> : <Badge status={r.bre_result} /> },
    { key: "risk", header: "Risk", render: (r) => r.risk_grade ? <Badge status={r.risk_grade} /> : <span className="text-zinc-300">—</span> },
    { key: "officer", header: "Credit officer", render: (r) => r.credit_officer_name || <span className="text-zinc-300">Unassigned</span> },
    { key: "created", header: "Created", render: (r) => fmtDate(r.created_at) },
    { key: "act", header: "", render: (r) => (
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-primary btn-sm" onClick={() => { setDecision(r); setForm({ decision: "approve", note: "", approved_amount: r.requested_amount }); }}><UserCheck size={12} /> Decide</button>
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Underwriting workbench" sub={`${reviewApps.length} applications awaiting credit decisions`} breadcrumb="LOS / Underwriting" actions={
        <div className="flex items-center gap-2"><ImportExport entity="los_apps" /><button className="btn btn-secondary" onClick={load}><RotateCcw size={13} /> Refresh</button></div>
      } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-3"><div className="text-[10.5px] uppercase text-zinc-400 font-medium">Awaiting decision</div><div className="text-[20px] font-semibold num mt-1">{reviewApps.length}</div></Card>
        <Card className="p-3"><div className="text-[10.5px] uppercase text-zinc-400 font-medium">At BRE stage</div><div className="text-[20px] font-semibold num mt-1">{reviewApps.filter((r: any) => r.stage === "bre").length}</div></Card>
        <Card className="p-3"><div className="text-[10.5px] uppercase text-zinc-400 font-medium">At approval</div><div className="text-[20px] font-semibold num mt-1">{reviewApps.filter((r: any) => r.stage === "approval").length}</div></Card>
        <Card className="p-3"><div className="text-[10.5px] uppercase text-zinc-400 font-medium">Pipeline value</div><div className="text-[20px] font-semibold num mt-1">{fmtInr(reviewApps.reduce((s: number, r: any) => s + r.requested_amount, 0))}</div></Card>
      </div>

      <Card>
        <DataTable columns={columns} rows={reviewApps} total={reviewApps.length} searchable searchPlaceholder="Search applications…" onRowClick={(r) => nav(`/applications/${r.id}`)} />
      </Card>

      <Modal open={!!decision} onClose={() => setDecision(null)} title={`Decision — ${decision?.application_no || ""}`} wide>
        {decision && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3">
              <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-2">Snapshot</div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-zinc-500">Customer</span><span className="font-medium">{decision.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Requested</span><span className="font-medium num">{fmtInr(decision.requested_amount)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Product</span><span className="font-medium">{decision.product_name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Stage</span><Badge status={decision.stage} /></div>
                <div className="flex justify-between"><span className="text-zinc-500">BRE</span><Badge status={decision.bre_result} /></div>
                <div className="flex justify-between"><span className="text-zinc-500">Risk</span><Badge status={decision.risk_grade} /></div>
              </div>
            </div>
            <div className="space-y-3">
              <Field label="Decision">
                <select className="input" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })}>
                  <option value="approve">Approve</option>
                  <option value="approve_with_conditions">Approve with conditions</option>
                  <option value="send_back">Send back</option>
                  <option value="reject">Reject</option>
                </select>
              </Field>
              {(form.decision === "approve" || form.decision === "approve_with_conditions") && (
                <Field label="Approved amount"><input className="input num" type="number" value={form.approved_amount} onChange={(e) => setForm({ ...form, approved_amount: e.target.value })} /></Field>
              )}
              <Field label="Credit memo / note"><textarea className="input min-h-16" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-secondary" onClick={() => setDecision(null)}>Cancel</button>
                <button className={`btn ${form.decision === "reject" ? "btn-danger" : "btn-primary"}`} onClick={submit}>Record decision <ChevronRight size={13} /></button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
