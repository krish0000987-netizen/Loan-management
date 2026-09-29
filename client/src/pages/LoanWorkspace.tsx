import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Wallet, HandCoins, FileText, AlertTriangle, RotateCcw, Landmark,
  Receipt, Undo2, CalendarDays, ShieldCheck, FileSignature, Check
} from "lucide-react";
import { api, fmtInr, fmtDate, timeAgo, badgeFor, statusLabel } from "../lib/api";
import { Card, CardTitle, Badge, KV, Tabs, Modal, Field, PageHeader, Progress } from "../components/ui";

export default function LoanWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("schedule");
  const [toast, setToast] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [ptpOpen, setPtpOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [pay, setPay] = useState<any>({ amount: 0, mode: "upi", reference: "" });
  const [ptp, setPtp] = useState<any>({ amount: 0, due_date: "", note: "" });
  const [charge, setCharge] = useState<any>({ kind: "penal_interest", amount: 500, reason: "" });
  const [restructure, setRestructure] = useState<any>({ new_tenure: 0, reason: "" });
  const [extras, setExtras] = useState<any>({});

  const load = () => api(`/loans/${id}`).then(setData);
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (!id) return;
    if (tab === "topup") api(`/loans/${id}/topup`).then((r: any) => setExtras((e: any) => ({ ...e, topup: r })));
    if (tab === "closure") api(`/loans/${id}/closure`).then((r: any) => setExtras((e: any) => ({ ...e, closure: r })));
    if (tab === "statement") api(`/loans/${id}/statement`).then((r: any) => setExtras((e: any) => ({ ...e, statement: r })));
  }, [tab, id]);
  useEffect(() => { if (data) { setPay((p: any) => ({ ...p, amount: data.loan.emi })); setPtp((p: any) => ({ ...p, amount: data.loan.emi, due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) })); setRestructure((r: any) => ({ ...r, new_tenure: (data.loan.tenure || 0) + 12 })); } }, [data?.loan?.id]);

  if (!data) return null;
  const { loan, installments, payments, ptps, charges, tasks, auditLogs } = data;

  const act = async (fn: () => Promise<any>, msg: string) => {
    try {
      await fn();
      await load();
      setToast(msg);
      setTimeout(() => setToast(""), 3500);
    } catch (e: any) {
      setToast(`Error: ${e.message}`);
      setTimeout(() => setToast(""), 5000);
    }
  };

  const inst: any[] = installments || [];
  const paidTotal = inst.filter((i: any) => i.paid === 1).reduce((s: number, i: any) => s + i.total, 0);
  const overdueCount = inst.filter((i: any) => i.paid === 0 && i.status === "overdue").length;
  const nextDue = inst.find((i: any) => i.paid === 0);

  return (
    <div className="relative">
      <PageHeader
        title={loan.loan_no}
        sub={`${loan.customer_name} · ${loan.product_name} · ${fmtInr(loan.principal)} @ ${loan.rate}% p.a. · ${loan.tenure} months`}
        breadcrumb={`LMS / Loans / ${loan.loan_no}`}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => nav(`/customers/${loan.customer_id}`)}>Customer 360</button>
            <button className="btn btn-primary" onClick={() => { setPay({ ...pay, amount: loan.emi }); setPayOpen(true); }} disabled={["closed", "written_off"].includes(loan.status)}><Wallet size={13} /> Record payment</button>
          </>
        }
      />

      {/* Loan header strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">Outstanding</div>
          <div className="num text-[17px] font-semibold mt-1 text-zinc-900">{fmtInr(loan.outstanding)}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">of {fmtInr(loan.principal)} principal</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">EMI</div>
          <div className="num text-[17px] font-semibold mt-1">{fmtInr(loan.emi)}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 capitalize">{loan.emi_frequency || "monthly"}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">Total paid</div>
          <div className="num text-[17px] font-semibold mt-1 text-emerald-600">{fmtInr(paidTotal)}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{payments?.length} payments</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">DPD</div>
          <div className={`num text-[17px] font-semibold mt-1 ${loan.dpd === 0 ? "text-emerald-600" : loan.dpd === 1 ? "text-amber-500" : loan.dpd <= 3 ? "text-orange-600" : "text-rose-600"}`}>{loan.dpd}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">{loan.npa_class || "performing"}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">Fees due</div>
          <div className="num text-[17px] font-semibold mt-1">{fmtInr(loan.fees_due + loan.penal_due)}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">incl. {fmtInr(loan.penal_due)} penal</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">Risk</div>
          <div className="mt-1"><Badge status={loan.risk_grade} /></div>
          <div className="text-[10px] text-zinc-400 mt-1.5">restructured: {loan.restructured ? "yes" : "no"}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">Status</div>
          <div className="mt-1"><Badge status={loan.status} /></div>
          <div className="text-[10px] text-zinc-400 mt-1.5">{fmtDate(loan.disbursed_at)} disbursed</div>
        </Card>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: "schedule", label: "Schedule" },
          { key: "payments", label: "Payments", count: payments?.length },
          { key: "collections", label: "Collections", count: (ptps?.length || 0) + (tasks?.length || 0) },
          { key: "charges", label: "Charges", count: charges?.length },
          { key: "topup", label: "Top-up" },
          { key: "closure", label: "Closure" },
          { key: "statement", label: "Statement" },
          { key: "audit", label: "Audit", count: auditLogs?.length }
        ]}
      />

      {tab === "schedule" && (
        <Card>
          <CardTitle
            title="Repayment schedule"
            sub={`${installments.length} installments · ${overdueCount} overdue · next due ${nextDue ? fmtDate(nextDue.due_date) : "—"}`}
            right={
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => { setCharge({ ...charge, kind: "late_fee", reason: "Late payment fee" }); setChargeOpen(true); }}><AlertTriangle size={12} /> Apply charge</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setRestructure({ ...restructure, new_tenure: (loan.tenure || 0) + 12, reason: "" }); setTab("collections"); }}>Restructure</button>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 text-left">
                  <th className="th">#</th><th className="th">Due date</th><th className="th text-right">Principal</th>
                  <th className="th text-right">Interest</th><th className="th text-right">Fees</th><th className="th text-right">Total</th>
                  <th className="th text-right">Paid</th><th className="th text-right">Balance</th><th className="th">Status</th><th className="th text-right">Days late</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((i: any) => {
                  const overdue = i.paid === 0 && i.status === "overdue";
                  return (
                    <tr key={i.id} className={`border-b border-zinc-50 ${overdue ? "bg-rose-50/40" : i.paid === 1 ? "bg-emerald-50/30" : ""}`}>
                      <td className="td num text-zinc-400">{i.seq}</td>
                      <td className="td">{fmtDate(i.due_date)}</td>
                      <td className="td text-right num">{fmtInr(i.principal)}</td>
                      <td className="td text-right num">{fmtInr(i.interest)}</td>
                      <td className="td text-right num">{i.fees ? fmtInr(i.fees) : "—"}</td>
                      <td className="td text-right num font-semibold">{fmtInr(i.total)}</td>
                      <td className="td text-right num">{i.paid_amount ? fmtInr(i.paid_amount) : "—"}</td>
                      <td className="td text-right num">{i.total > i.paid_amount ? fmtInr(i.total - i.paid_amount) : <span className="text-emerald-600">0</span>}</td>
                      <td className="td"><Badge status={i.status} /></td>
                      <td className="td text-right num">{i.days_late > 0 ? <span className="text-rose-600 font-semibold">{i.days_late}</span> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10.5px] text-zinc-400 flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Paid</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Overdue</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-300" /> Pending</span>
            <span className="ml-auto">Allocation order (product policy): {loan.allocation_order}</span>
          </div>
        </Card>
      )}

      {tab === "payments" && (
        <Card>
          <CardTitle title="Payments & receipts" sub={`${payments?.length || 0} transactions · allocation engine applies product policy`} right={
            <button className="btn btn-primary btn-sm" onClick={() => { setPay({ ...pay, amount: loan.emi }); setPayOpen(true); }}><Wallet size={12} /> Record payment</button>
          } />
          <div className="divide-y divide-zinc-50">
            {payments?.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Receipt size={14} /></div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-zinc-800">{p.receipt_no}</div>
                  <div className="text-[10.5px] text-zinc-400 capitalize">{p.mode} · {fmtDate(p.received_at)}{p.reference ? ` · ${p.reference}` : ""}</div>
                </div>
                <div className="text-right">
                  <div className="num text-[13px] font-semibold">{fmtInr(p.amount)}</div>
                  <div className="text-[10px] text-zinc-400">{p.reversed ? "reversed" : "allocated"}</div>
                </div>
                <Badge status={p.status} />
                {!p.reversed && (
                  <button className="btn btn-secondary btn-sm" title="Reverse payment (immutable audit trail)" onClick={async () => {
                    const reason = prompt("Reversal reason (audited):");
                    if (reason) act(() => api(`/payments/${p.id}/reverse`, { method: "POST", body: { reason } }), "Payment reversed — original record retained");
                  }}><Undo2 size={11} /></button>
                )}
              </div>
            ))}
            {!payments?.length && <div className="text-[12px] text-zinc-400 py-6 text-center">No payments recorded yet.</div>}
          </div>
        </Card>
      )}

      {tab === "collections" && (
        <div className="space-y-4">
          <Card>
            <CardTitle title="Promise to pay (PTP)" sub="Payment promises with kept/broken tracking" right={
              <button className="btn btn-primary btn-sm" onClick={() => { setPtp({ ...ptp, amount: loan.emi, due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) }); setPtpOpen(true); }}><HandCoins size={12} /> New PTP</button>
            } />
            <div className="divide-y divide-zinc-50">
              {ptps?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-[12.5px] font-medium text-zinc-800">{fmtInr(p.amount)} by {fmtDate(p.due_date)}</div>
                    {p.note && <div className="text-[10.5px] text-zinc-400">{p.note}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={p.status} />
                    {p.status === "promised" && (
                      <div className="flex gap-1">
                        <button className="btn btn-secondary btn-sm" onClick={() => act(() => api(`/ptps/${p.id}`, { method: "PATCH", body: { status: "kept" } }), "PTP marked kept")}>Kept</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => act(() => api(`/ptps/${p.id}`, { method: "PATCH", body: { status: "broken" } }), "PTP marked broken")}>Broken</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!ptps?.length && <div className="text-[12px] text-zinc-400 py-4 text-center">No PTPs recorded.</div>}
            </div>
          </Card>
          <Card>
            <CardTitle title="Collection tasks" />
            <div className="divide-y divide-zinc-50">
              {tasks?.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Badge status={t.priority} />
                    <div>
                      <div className="text-[12.5px] font-medium capitalize text-zinc-800">{t.kind} task</div>
                      {t.note && <div className="text-[10.5px] text-zinc-400">{t.note}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-zinc-400">{t.due_at ? fmtDate(t.due_at) : ""}</span>
                    <Badge status={t.status} />
                    {t.status === "open" && <button className="btn btn-secondary btn-sm" onClick={() => act(() => api(`/collections/tasks/${t.id}`, { method: "PATCH", body: { status: "done" } }), "Task completed")}>Done</button>}
                  </div>
                </div>
              ))}
              {!tasks?.length && <div className="text-[12px] text-zinc-400 py-4 text-center">No open collection tasks.</div>}
            </div>
          </Card>
          <Card>
            <CardTitle title="Restructuring" sub="Tenure extension / EMI change — original transactions are never edited" />
            <div className="flex items-end gap-2">
              <Field label="New tenure (months)" className="flex-1"><input className="input num" type="number" value={restructure.new_tenure} onChange={(e) => setRestructure({ ...restructure, new_tenure: Number(e.target.value) })} /></Field>
              <Field label="Reason" className="flex-1"><input className="input" value={restructure.reason} onChange={(e) => setRestructure({ ...restructure, reason: e.target.value })} placeholder="e.g. temporary cashflow stress" /></Field>
              <button className="btn btn-secondary" disabled={restructure.new_tenure <= loan.tenure || !restructure.reason}
                onClick={() => act(() => api(`/loans/${loan.id}/restructure`, { method: "POST", body: restructure }), "Loan restructured — extension installments appended")}>
                <RotateCcw size={13} /> Restructure
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === "charges" && (
        <Card>
          <CardTitle title="Charge events" sub="Penal interest, late fees, bounce fees — every charge tied to policy" right={
            <button className="btn btn-secondary btn-sm" onClick={() => setChargeOpen(true)}><AlertTriangle size={12} /> Add charge</button>
          } />
          <div className="divide-y divide-zinc-50">
            {charges?.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-[12.5px] font-medium capitalize text-zinc-800">{c.kind.replace(/_/g, " ")}</div>
                  <div className="text-[10.5px] text-zinc-400">{c.reason} · {fmtDate(c.created_at)}</div>
                </div>
                <div className="num text-[13px] font-semibold text-rose-600">{fmtInr(c.amount)}</div>
              </div>
            ))}
            {!charges?.length && <div className="text-[12px] text-zinc-400 py-4 text-center">No charges applied.</div>}
          </div>
        </Card>
      )}

      {tab === "topup" && (
        <Card>
          <CardTitle title="Top-up eligibility" sub="Configurable: repayment history, DPD, bureau, income and outstanding" />
          {extras.topup ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-2">
                {(extras.topup.checks || []).map((c: any) => (
                  <div key={c.key} className={`flex items-center justify-between rounded-md border px-3 py-2.5 ${c.passed ? "border-zinc-100" : "border-rose-200 bg-rose-50/40"}`}>
                    <span className="text-[12px] font-medium text-zinc-700">{c.label}</span>
                    <span className="text-[11.5px]">
                      <span className="num text-zinc-800">{c.value}</span>
                      <span className={`ml-2 text-[10.5px] font-bold uppercase ${c.passed ? "text-emerald-600" : "text-rose-600"}`}>{c.passed ? "Pass" : "Fail"}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div>
                {extras.topup.offer ? (
                  <div className="rounded-lg border border-brand-200 bg-brand-50/40 px-4 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">Top-up offer</div>
                    <div className="mt-1.5 text-[22px] font-semibold num text-zinc-900">{fmtInr(extras.topup.offer.amount)}</div>
                    <div className="text-[12px] text-zinc-600 mt-1">{extras.topup.offer.rate}% p.a. · {extras.topup.offer.tenure} months</div>
                    <div className="text-[12px] text-zinc-600 mt-1">EMI {fmtInr(extras.topup.offer.emi)}</div>
                    <div className="mt-3 text-[10.5px] text-zinc-500">Outstanding {fmtInr(extras.topup.outstanding)} · {extras.topup.months_serviced} months serviced</div>
                  </div>
                ) : (
                  <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2.5 text-[11.5px] text-amber-800">
                    {extras.topup.reasons?.join(" · ") || "Not eligible yet"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[12px] text-zinc-400">Loading top-up analysis…</div>
          )}
        </Card>
      )}

      {tab === "closure" && (
        <Card>
          <CardTitle
            title="Loan closure"
            sub="Closure statement + NOC — dues must be zero before closure is approved"
            right={extras.closure?.closure?.status && <Badge status={extras.closure.closure.status} />}
          />
          {extras.closure ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="rounded-md border border-zinc-100 px-3 py-2.5 flex justify-between text-[12px]">
                  <span className="text-zinc-500">Total dues</span><span className={`num font-semibold ${extras.closure.total_due > 0 ? "text-amber-600" : "text-emerald-600"}`}>{fmtInr(extras.closure.total_due)}</span>
                </div>
                <div className="rounded-md border border-zinc-100 px-3 py-2.5 flex justify-between text-[12px]">
                  <span className="text-zinc-500">Unpaid installments</span><span className="num font-semibold">{extras.closure.unpaid_installments}</span>
                </div>
                <div className="rounded-md border border-zinc-100 px-3 py-2.5 flex justify-between text-[12px]">
                  <span className="text-zinc-500">Outstanding</span><span className="num font-semibold">{fmtInr(extras.closure.loan.outstanding)}</span>
                </div>
                {extras.closure.total_due === 0 && loan.status !== "closed" && !extras.closure.closure && (
                  <button className="btn btn-primary w-full" onClick={() => act(async () => { const r: any = await api(`/loans/${loan.id}/closure`, { method: "POST", body: {} }); setExtras((e: any) => ({ ...e, closure: { ...e.closure, closure: { status: "requested" }, statement: r.statement, noc: r.noc } })); }, "Closure requested")}>
                    <FileSignature size={13} /> Request closure
                  </button>
                )}
                {extras.closure.closure?.status === "requested" && (
                  <button className="btn btn-primary w-full" onClick={() => act(async () => { await api(`/loans/${loan.id}/closure/approve`, { method: "POST", body: {} }); load(); api(`/loans/${loan.id}/closure`).then((r: any) => setExtras((e: any) => ({ ...e, closure: r }))); }, "Loan closed — NOC issued")}>
                    <Check size={13} /> Approve closure
                  </button>
                )}
                {(extras.closure.statement || extras.closure.closure?.status === "closed") && (
                  <div className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[11.5px] text-emerald-800">
                    ✓ Loan closed. NOC and closure statement generated — retained in the loan record.
                  </div>
                )}
              </div>
              <div className="lg:col-span-2">
                {(extras.closure.noc || extras.closure.closure?.noc) && (
                  <pre className="text-[10.5px] font-mono leading-relaxed text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-md p-3.5 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {extras.closure.noc || extras.closure.closure.noc}
                  </pre>
                )}
                {!extras.closure.noc && !extras.closure.closure?.noc && (
                  <div className="py-10 text-center text-[12px] text-zinc-400">Request closure to generate the statement and NOC.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[12px] text-zinc-400">Loading…</div>
          )}
        </Card>
      )}

      {tab === "statement" && (
        <Card>
          <CardTitle title="Loan statement" sub="Complete ledger — payments, charges and financial events, append-only" />
          {extras.statement ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-md border border-zinc-100 px-3 py-2"><div className="text-[10px] uppercase text-zinc-400">Total paid</div><div className="num text-[15px] font-semibold mt-0.5">{fmtInr(extras.statement.summary.total_paid)}</div></div>
              <div className="rounded-md border border-zinc-100 px-3 py-2"><div className="text-[10px] uppercase text-zinc-400">Charges</div><div className="num text-[15px] font-semibold mt-0.5 text-rose-600">{fmtInr(extras.statement.summary.total_charged)}</div></div>
              <div className="rounded-md border border-zinc-100 px-3 py-2"><div className="text-[10px] uppercase text-zinc-400">Outstanding</div><div className="num text-[15px] font-semibold mt-0.5">{fmtInr(extras.statement.summary.outstanding)}</div></div>
              <div className="rounded-md border border-zinc-100 px-3 py-2"><div className="text-[10px] uppercase text-zinc-400">Next due</div><div className="text-[13px] font-semibold mt-0.5">{extras.statement.summary.next_due ? fmtDate(extras.statement.summary.next_due) : "—"}</div></div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-zinc-200">
                <th className="th">Date</th><th className="th">Type</th><th className="th">Reference</th>
                <th className="th text-right">Amount</th><th className="th">Status</th>
              </tr></thead>
              <tbody>
                {(extras.statement?.ledger ?? []).map((l: any, i: number) => (
                  <tr key={i} className="border-b border-zinc-50">
                    <td className="td text-zinc-500">{fmtDate(l.date)}</td>
                    <td className="td font-medium capitalize">{String(l.type).replace(/_/g, " ")}</td>
                    <td className="td text-zinc-500">{l.ref || "—"}</td>
                    <td className={`td text-right num ${l.amount < 0 ? "text-rose-600" : ""}`}>{l.amount ? fmtInr(l.amount) : "—"}</td>
                    <td className="td"><Badge status={l.status} /></td>
                  </tr>
                ))}
                {!extras.statement?.ledger?.length && <tr><td colSpan={5} className="py-10 text-center text-zinc-400">Loading statement…</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "audit" && (
        <Card>
          <CardTitle title="Loan audit trail" sub="Append-only financial record — immutability enforced" />
          <div className="space-y-2.5">
            {auditLogs?.map((a: any) => (
              <div key={a.id} className="flex items-start gap-2.5">
                <ShieldCheck size={13} className="text-zinc-300 mt-1 shrink-0" />
                <div className="flex-1">
                  <div className="text-[12px] text-zinc-700">{a.action.replace(/_/g, " ")} <span className="text-zinc-300">·</span> <span className="text-zinc-400">{a.by_name || "system"}</span></div>
                  <div className="text-[10.5px] text-zinc-400">{timeAgo(a.created_at)} {a.after ? "· " + String(a.after).slice(0, 80) : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={`Record payment — ${loan.loan_no}`}>
        <div className="space-y-3">
          <Field label="Amount"><input className="input num" type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Mode">
            <select className="input" value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}>
              {["upi", "neft", "imps", "rtgs", "nach", "enach", "pg", "cash", "cheque"].map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
          </Field>
          <Field label="Reference"><input className="input" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="UTR / receipt / reference no" /></Field>
          <div className="text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-md px-3 py-2">
            Allocation order <span className="font-mono font-semibold">{loan.allocation_order}</span> — oldest installments settled first. Unallocated amounts carry forward.
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setPayOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={async () => {
            const res = await api(`/loans/${loan.id}/payment`, { method: "POST", body: { ...pay, amount: Number(pay.amount) } });
            setPayOpen(false);
            setToast(`Payment ${res.receiptNo} recorded — ${res.unallocated ? `${fmtInr(res.unallocated)} unallocated` : "fully allocated"}`);
            setTimeout(() => setToast(""), 4000);
            load();
          }}><Wallet size={13} /> Record & allocate</button>
        </div>
      </Modal>

      {/* PTP modal */}
      <Modal open={ptpOpen} onClose={() => setPtpOpen(false)} title="New promise to pay">
        <div className="space-y-3">
          <Field label="Amount"><input className="input num" type="number" value={ptp.amount} onChange={(e) => setPtp({ ...ptp, amount: e.target.value })} /></Field>
          <Field label="Due date"><input className="input" type="date" value={ptp.due_date} onChange={(e) => setPtp({ ...ptp, due_date: e.target.value })} /></Field>
          <Field label="Note"><input className="input" value={ptp.note} onChange={(e) => setPtp({ ...ptp, note: e.target.value })} placeholder="Customer commitment…" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setPtpOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={async () => { await api(`/loans/${loan.id}/ptp`, { method: "POST", body: { ...ptp, amount: Number(ptp.amount) } }); setPtpOpen(false); load(); }}>Record PTP</button>
        </div>
      </Modal>

      {/* Charge modal */}
      <Modal open={chargeOpen} onClose={() => setChargeOpen(false)} title="Apply charge">
        <div className="space-y-3">
          <Field label="Charge type">
            <select className="input" value={charge.kind} onChange={(e) => setCharge({ ...charge, kind: e.target.value })}>
              <option value="penal_interest">Penal interest</option><option value="late_fee">Late fee</option>
              <option value="bounce_fee">Bounce fee</option><option value="collection_fee">Collection fee</option><option value="other">Other</option>
            </select>
          </Field>
          <Field label="Amount"><input className="input num" type="number" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} /></Field>
          <Field label="Reason"><input className="input" value={charge.reason} onChange={(e) => setCharge({ ...charge, reason: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setChargeOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={async () => { await api(`/loans/${loan.id}/charges`, { method: "POST", body: { ...charge, amount: Number(charge.amount) } }); setChargeOpen(false); load(); }}>Apply charge</button>
        </div>
      </Modal>

      {toast && <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white text-[12px] font-medium px-4 py-2.5 rounded-lg shadow-xl">{toast}</div>}
    </div>
  );
}
