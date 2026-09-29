import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { PageHeader, Card, Badge, Stat, KV, Modal, Progress } from "../../components/ui";

export default function PortalLoans() {
  const nav = useNavigate();
  const { id } = useParams();
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (id) api(`/portal/loans/${id}`).then(setDetail).catch(() => setDetail(null));
    else api("/portal/loans").then((r) => setList(r.rows));
  }, [id]);

  if (id) return <LoanDetail data={detail} back={() => nav("/portal/loans")} />;

  return (
    <div>
      <PageHeader title="My loans" sub="Your active and past loans at a glance" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((l) => (
          <button key={l.id} className="text-left card card-pad hover:border-zinc-300 cursor-pointer" onClick={() => nav(`/portal/loans/${l.id}`)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-zinc-900">{l.loan_no}</span>
              <Badge status={l.status} />
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-[11.5px] text-zinc-500">
              <span>{l.product_name}</span>
              <span className="text-right">EMI {fmtInr(l.emi)}</span>
              <span>Outstanding <b className="num text-zinc-800">{fmtInr(l.outstanding)}</b></span>
              <span className="text-right">Next due {l.next_due ? fmtDate(l.next_due) : "—"}</span>
            </div>
          </button>
        ))}
        {!list.length && <div className="col-span-2 py-14 text-center text-[12.5px] text-zinc-400">No loans yet.</div>}
      </div>
    </div>
  );
}

function LoanDetail({ data, back }: { data: any; back: () => void }) {
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<any>(null);

  if (!data) return <div className="py-16 text-center text-zinc-400 text-[13px]">Loading…</div>;
  const { loan, installments, payments, charges, closure } = data;
  const paid = installments.filter((i: any) => i.paid === 1).length;
  const next = installments.find((i: any) => !i.paid);

  const doPay = async () => {
    try {
      const r = await api(`/portal/loans/${loan.id}/pay`, { method: "POST", body: { amount: Number(amount), mode: "upi" } });
      setDone(r);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <PageHeader
        title={loan.loan_no}
        sub={`${data.loan.product_name} · ${fmtInr(loan.principal)} principal · ${loan.rate}% p.a.`}
        actions={
          <>
            <button className="btn btn-secondary" onClick={back}>← Back</button>
            {loan.status !== "closed" && loan.status !== "written_off" && <button className="btn btn-primary" onClick={() => setPayOpen(true)}>Pay now</button>}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Outstanding" value={fmtInr(loan.outstanding)} tone="brand" />
        <Stat label="EMI" value={fmtInr(loan.emi)} />
        <Stat label="Next EMI due" value={next ? fmtInr(next.total - next.paid_amount) : "—"} sub={next ? fmtDate(next.due_date) : ""} tone="amber" />
        <Stat label="Repaid" value={`${paid}/${installments.length}`} sub={`${Math.round((paid / Math.max(1, installments.length)) * 100)}% of tenure`} tone="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-zinc-900">Repayment schedule</h3>
            <span className="text-[11px] text-zinc-400">{paid} paid · {installments.length - paid} remaining</span>
          </div>
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-white"><tr className="border-b border-zinc-200">
                <th className="th">#</th><th className="th">Due</th><th className="th text-right">Principal</th><th className="th text-right">Interest</th>
                <th className="th text-right">Total</th><th className="th text-right">Paid</th><th className="th">Status</th>
              </tr></thead>
              <tbody>
                {installments.map((i: any) => (
                  <tr key={i.id} className={`border-b border-zinc-50 ${i.paid ? "text-zinc-400" : ""}`}>
                    <td className="td">{i.seq}</td>
                    <td className="td">{fmtDate(i.due_date)}</td>
                    <td className="td text-right num">{fmtInr(i.principal)}</td>
                    <td className="td text-right num">{fmtInr(i.interest)}</td>
                    <td className="td text-right num font-medium">{fmtInr(i.total)}</td>
                    <td className="td text-right num">{i.paid ? fmtInr(i.paid_amount) : "—"}</td>
                    <td className="td"><Badge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">Loan summary</h3>
            <KV k="Loan amount" v={fmtInr(loan.principal)} mono />
            <KV k="Rate" v={`${loan.rate}% p.a.`} />
            <KV k="Tenure" v={`${loan.tenure} months`} />
            <KV k="Disbursed" v={fmtDate(loan.disbursed_at)} />
            <KV k="Status" v={<Badge status={loan.status} />} />
            {loan.dpd > 0 && <KV k="DPD" v={<span className="text-rose-600 font-semibold">{loan.dpd} installment(s)</span>} />}
          </Card>
          <Card>
            <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">Recent payments</h3>
            <div className="space-y-1.5">
              {payments.slice(0, 6).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-zinc-600">{p.receipt_no} <span className="text-zinc-400">· {fmtDate(p.received_at)}</span></span>
                  <span className={`num font-medium ${p.reversed ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{fmtInr(p.amount)}</span>
                </div>
              ))}
              {!payments.length && <div className="text-[12px] text-zinc-400 py-3 text-center">No payments yet.</div>}
            </div>
          </Card>
          {closure && (
            <Card>
              <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">Closure</h3>
              <div className="text-[11.5px] text-zinc-600 whitespace-pre-wrap font-mono text-[10.5px] leading-relaxed max-h-44 overflow-y-auto">{closure.noc}</div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pay now — sandbox only">
        <div className="space-y-3">
          {next && <div className="rounded-md bg-zinc-50 border border-zinc-100 px-3 py-2 text-[11.5px] text-zinc-600">Next due {fmtInr(next.total - next.paid_amount)} on {fmtDate(next.due_date)}. You can pay any amount.</div>}
          <input className="input w-full num" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
          {msg && <div className="text-[11.5px] text-rose-600">{msg}</div>}
          {done && (
            <div className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2.5">
              <div className="text-[12.5px] font-semibold text-emerald-800">Payment recorded (sandbox)</div>
              <div className="text-[11.5px] text-emerald-700 mt-0.5">Receipt {done.receipt_no} · {done.allocations?.length ?? 0} allocation(s) · {fmtInr(done.unallocated ?? 0)} unallocated</div>
            </div>
          )}
          <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-[10.5px] text-amber-800">DEMO ONLY — this simulates a UPI payment. No real charge is made.</div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" disabled={!Number(amount) || !!done} onClick={doPay}>Pay {amount ? fmtInr(Number(amount)) : ""}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
