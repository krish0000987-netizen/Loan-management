import { useEffect, useState } from "react";
import { Card, CardTitle, PageHeader, Badge, Stat, Tabs, Field, Modal, EmptyState } from "../../components/ui";
import { ImportExport } from "./shared";
import { api, fmtInr, fmtDate } from "../../lib/api";

export function GnFinance() {
  const [tab, setTab] = useState("income");
  const [income, setIncome] = useState<any>({ rows: [], totals: {} });
  const [receivable, setReceivable] = useState<any>({ rows: [], total: 0, buckets: {} });
  const [payouts, setPayouts] = useState<any>({ rows: [], totals: {} });
  const [fees, setFees] = useState<any>({ rows: [], totals: {} });
  const [expenses, setExpenses] = useState<any>({ rows: [], totals: {} });
  const [acct, setAcct] = useState<any>({});
  const [partners, setPartners] = useState<any[]>([]);
  const [incomeApps, setIncomeApps] = useState<any[]>([]);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const load = () => {
    api("/gn/finance/income").then(setIncome).catch(() => {});
    api("/gn/finance/receivable").then(setReceivable).catch(() => {});
    api("/gn/finance/payouts").then(setPayouts).catch(() => {});
    api("/gn/finance/fees").then(setFees).catch(() => {});
    api("/gn/finance/expenses").then(setExpenses).catch(() => {});
    api("/gn/finance/accounting").then(setAcct).catch(() => {});
    api("/gn/partners").then(setPartners).catch(() => {});
    api("/gn/applications?limit=200").then((r) => setIncomeApps(r.rows.filter((a: any) => a.commission_gross > 0))).catch(() => {});
  };
  useEffect(load, []);

  const PB_BADGE: Record<string, string> = {
    draft: "border-zinc-200 bg-zinc-100 text-zinc-600",
    approved: "border-amber-200 bg-amber-50 text-amber-700",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finance & Payouts"
        sub="Commission income, receivable aging, payout batches and accounting"
        breadcrumb="Growth Nations / Finance"
        actions={
          <div className="flex items-center gap-2">
            <ImportExport entity="commissions" />
            <button className="btn btn-primary text-[12px]" onClick={() => setPayoutOpen(true)}>+ Compute Partner Payout</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Commission Earned" value={fmtInr(acct.income ?? 0)} tone="brand" />
        <Stat label="Received" value={fmtInr(acct.incomeReceived ?? 0)} tone="green" />
        <Stat label="Receivable" value={fmtInr(acct.receivable ?? 0)} tone="amber" />
        <Stat label="Paid Out" value={fmtInr(acct.paidOut ?? 0)} />
        <Stat label="Net Profit" value={fmtInr(acct.netProfit ?? 0)} tone={acct.netProfit >= 0 ? "green" : "red"} />
      </div>

      <Tabs items={[
        { key: "income", label: "Income", count: income.rows.length },
        { key: "received", label: "Payment (Received)", count: income.rows.filter((r: any) => r.status === "received").length },
        { key: "receivable", label: "Receivable", count: receivable.rows.length },
        { key: "parent_dsa", label: "Parent DSA" },
        { key: "fees", label: "Customer Fees", count: fees.rows.length },
        { key: "expenses", label: "Expenses", count: expenses.rows.length },
        { key: "payable", label: "Payment (Payable)", count: payouts.rows.filter((p: any) => p.status !== "paid").length },
        { key: "paid", label: "Payment (Paid)", count: payouts.rows.filter((p: any) => p.status === "paid").length },
        { key: "accounting", label: "Accounting" }
      ]} active={tab} onChange={setTab} />

      {tab === "income" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">Gross <b className="text-zinc-800">{fmtInr(income.totals.gross ?? 0)}</b></span>
            <span className="text-zinc-500">GST <b className="text-zinc-800">{fmtInr(income.totals.gst ?? 0)}</b></span>
            <span className="text-zinc-500">TDS <b className="text-zinc-800">{fmtInr(income.totals.tds ?? 0)}</b></span>
            <span className="text-zinc-500">Net <b className="text-zinc-800">{fmtInr(income.totals.net ?? 0)}</b></span>
            <span className="text-emerald-600 font-semibold ml-auto">Received {fmtInr(income.totals.received ?? 0)}</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Loan / Borrower</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">Rate</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">Net</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Received</th>
            </tr></thead>
            <tbody>
              {income.rows.map((c: any) => (
                <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5"><div className="font-medium text-zinc-800">{c.ref}</div><div className="text-[11px] text-zinc-400">{c.borrower}</div></td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.lender_name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{fmtInr(c.disbursed_amount)}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.rate}%</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(c.gross)}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{fmtInr(c.net)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${c.status === "received" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{c.status}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-500 text-[11.5px]">{c.status === "received" ? `${fmtDate(c.received_at)} · ${c.utr}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {income.rows.length === 0 && <EmptyState title="No commissions" sub="Commissions appear once a loan is disbursed" />}
        </Card>
      )}

      {tab === "receivable" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card>
            <CardTitle title="Aging Buckets" sub={`${receivable.rows.length} commissions outstanding`} />
            <div className="space-y-3 pt-1">
              {[["0-30", "Recent — chase as routine", "bg-emerald-500"], ["31-60", "Follow up actively", "bg-sky-500"], ["61-90", "Escalate to RM", "bg-amber-500"], ["90+", "Stuck — review with bank", "bg-rose-500"]].map(([b, note, color]) => (
                <div key={b} className="rounded-lg border border-zinc-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-zinc-700">{b} days</span>
                    <span className="text-[13px] font-bold text-zinc-900">{fmtInr(receivable.buckets[b as any] ?? 0)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${receivable.total > 0 ? ((receivable.buckets[b as any] ?? 0) / receivable.total) * 100 : 0}%` }} /></div>
                  <div className="text-[10.5px] text-zinc-400 mt-1.5">{note}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="lg:col-span-3" pad={false}>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Loan / Borrower</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">Age</th><th className="px-3 py-2.5 font-semibold">Expected</th>
              </tr></thead>
              <tbody>
                {receivable.rows.map((r: any) => (
                  <tr key={r.id} className="border-b border-zinc-50">
                    <td className="px-3 py-2.5"><div className="font-medium text-zinc-800">{r.ref}</div><div className="text-[11px] text-zinc-400">{r.borrower}</div></td>
                    <td className="px-3 py-2.5 text-zinc-600">{r.lender_name}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{fmtInr(r.disbursed_amount)}</td>
                    <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(r.gross)}</td>
                    <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${r.age_days > 90 ? "border-rose-200 bg-rose-50 text-rose-700" : r.age_days > 60 ? "border-amber-200 bg-amber-50 text-amber-700" : r.age_days > 30 ? "border-sky-200 bg-sky-50 text-sky-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{r.age_days}d</span></Badge></td>
                    <td className="px-3 py-2.5 text-zinc-400 text-[11.5px]">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {receivable.rows.length === 0 && <EmptyState title="All reconciled" sub="Every commission has been received from the bank" />}
          </Card>
        </div>
      )}

      {tab === "payouts" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">Payable <b className="text-amber-600">{fmtInr(payouts.totals.payable ?? 0)}</b></span>
            <span className="text-zinc-500">Paid <b className="text-emerald-600">{fmtInr(payouts.totals.paid ?? 0)}</b></span>
            <span className="text-zinc-500">TDS withheld <b className="text-zinc-800">{fmtInr(payouts.totals.tds_paid ?? 0)}</b></span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Batch</th><th className="px-3 py-2.5 font-semibold">Payee</th><th className="px-3 py-2.5 font-semibold">Loans</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">TDS</th><th className="px-3 py-2.5 font-semibold">Net</th><th className="px-3 py-2.5 font-semibold">Split (60/40)</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">UTR</th>
            </tr></thead>
            <tbody>
              {payouts.rows.map((p: any) => {
                let split: any = {};
                try { split = JSON.parse(p.splits); } catch {}
                return (
                  <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                    <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-zinc-800">{p.batch_ref}</td>
                    <td className="px-3 py-2.5 text-zinc-700">{p.payee_name}<div className="text-[10.5px] text-zinc-400">{p.payee_type}</div></td>
                    <td className="px-3 py-2.5 text-[11px] text-zinc-500">{JSON.parse(p.loans || "[]").join(", ")}</td>
                    <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(p.gross)}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{fmtInr(p.tds)}</td>
                    <td className="px-3 py-2.5 font-medium text-zinc-800">{fmtInr(p.net)}</td>
                    <td className="px-3 py-2.5 text-[10.5px] text-zinc-500">{Object.entries(split).filter(([k]) => k !== "split_pct").map(([k, v]) => `${k}: ${fmtInr(v as number)}`).join(" · ")}</td>
                    <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${PB_BADGE[p.status]}`}>{p.status}</span></Badge></td>
                    <td className="px-3 py-2.5 text-[11px] text-zinc-500">{p.utr ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {payouts.rows.length === 0 && <EmptyState title="No payout batches" sub="Compute a partner payout to create your first batch" />}
        </Card>
      )}

      {tab === "fees" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">Processing <b className="text-zinc-800">{fmtInr(fees.totals.processing ?? 0)}</b></span>
            <span className="text-zinc-500">Insurance <b className="text-zinc-800">{fmtInr(fees.totals.insurance ?? 0)}</b></span>
            <span className="text-zinc-500">RTO <b className="text-zinc-800">{fmtInr(fees.totals.rto ?? 0)}</b></span>
            <span className="text-zinc-500">Other <b className="text-zinc-800">{fmtInr(fees.totals.other ?? 0)}</b></span>
            <span className="text-emerald-600 font-semibold ml-auto">Total {fmtInr(fees.totals.total ?? 0)}</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Customer</th><th className="px-3 py-2.5 font-semibold">Ref</th><th className="px-3 py-2.5 font-semibold">Processing</th><th className="px-3 py-2.5 font-semibold">Insurance</th><th className="px-3 py-2.5 font-semibold">RTO</th><th className="px-3 py-2.5 font-semibold">Other</th><th className="px-3 py-2.5 font-semibold">Total</th><th className="px-3 py-2.5 font-semibold">Disbursed</th>
            </tr></thead>
            <tbody>
              {fees.rows.map((f: any) => (
                <tr key={f.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{f.customer}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">{f.ref}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{fmtInr(f.processing)}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{fmtInr(f.insurance)}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{fmtInr(f.rto)}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{fmtInr(f.other)}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(f.processing + f.insurance + f.rto + f.other)}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(f.disbursed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "received" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">Total received <b className="text-emerald-600">{fmtInr(income.rows.filter((r: any) => r.status === "received").reduce((s: number, r: any) => s + r.net, 0))}</b></span>
            <span className="text-zinc-500">GST received <b className="text-zinc-800">{fmtInr(income.rows.filter((r: any) => r.status === "received").reduce((s: number, r: any) => s + r.gst, 0))}</b></span>
            <span className="text-zinc-400 ml-auto text-[11px]">Bank-received commissions — your inbound ledger</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Date</th><th className="px-3 py-2.5 font-semibold">Loan / Bank</th><th className="px-3 py-2.5 font-semibold">Borrower</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">Received</th><th className="px-3 py-2.5 font-semibold">UTR</th><th className="px-3 py-2.5 font-semibold">Invoice</th>
            </tr></thead>
            <tbody>
              {income.rows.filter((r: any) => r.status === "received").map((c: any) => (
                <tr key={c.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 text-zinc-500">{fmtDate(c.received_at)}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{c.ref}<div className="text-[11px] text-zinc-400">{c.lender_name}</div></td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.borrower}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(c.gross)}</td>
                  <td className="px-3 py-2.5 font-medium text-emerald-600">{fmtInr(c.net)}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">{c.utr ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{c.invoice_no ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {income.rows.filter((r: any) => r.status === "received").length === 0 && <EmptyState title="No bank receipts yet" sub="Once a lender pays a commission on a disbursed loan, the entry shows up here" />}
        </Card>
      )}

      {tab === "parent_dsa" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">Expected from parents <b className="text-zinc-800">{fmtInr(receivable.total ?? 0)}</b></span>
            <span className="text-zinc-500">Received <b className="text-emerald-600">{fmtInr(income.totals.received ?? 0)}</b></span>
            <span className="text-zinc-400 ml-auto text-[11px]">Loans booked under a parent DSA's code — the bank pays the parent, you collect from them</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Loan</th><th className="px-3 py-2.5 font-semibold">Parent DSA</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">Expected</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {receivable.rows.map((r: any) => (
                <tr key={r.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-zinc-800">{r.ref}</td>
                  <td className="px-3 py-2.5 text-zinc-600">Via parent DSA</td>
                  <td className="px-3 py-2.5 text-zinc-600">{r.lender_name}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(r.gross)}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{fmtDate(r.created_at)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-amber-200 bg-amber-50 text-amber-700">Outstanding to collect</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {receivable.rows.length === 0 && <EmptyState title="No loans booked under a parent DSA code yet" sub="When a loan uses a parent DSA's code, it appears here" />}
        </Card>
      )}

      {tab === "payable" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">To be paid <b className="text-amber-600">{fmtInr(payouts.rows.filter((p: any) => p.status !== "paid").reduce((s: number, p: any) => s + p.net, 0))}</b></span>
            <span className="text-zinc-400 ml-auto text-[11px]">Net commitment across draft + approved batches — what you still owe partners</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Batch</th><th className="px-3 py-2.5 font-semibold">Payee</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">TDS</th><th className="px-3 py-2.5 font-semibold">Net</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Created</th>
            </tr></thead>
            <tbody>
              {payouts.rows.filter((p: any) => p.status !== "paid").map((p: any) => (
                <tr key={p.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-zinc-800">{p.batch_ref}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{p.payee_name}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(p.gross)}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{fmtInr(p.tds)}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{fmtInr(p.net)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${PB_BADGE[p.status]}`}>{p.status}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payouts.rows.filter((p: any) => p.status !== "paid").length === 0 && <EmptyState title="Nothing payable" sub="Every batch is either paid in full or hasn't been approved yet" />}
        </Card>
      )}

      {tab === "paid" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center gap-4 text-[12px]">
            <span className="text-zinc-500">Total paid <b className="text-emerald-600">{fmtInr(payouts.rows.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.net, 0))}</b></span>
            <span className="text-zinc-500">TDS withheld <b className="text-zinc-800">{fmtInr(payouts.rows.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.tds, 0))}</b></span>
            <span className="text-zinc-400 ml-auto text-[11px]">Your outbound ledger — batches actually paid to partners</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Date</th><th className="px-3 py-2.5 font-semibold">Batch</th><th className="px-3 py-2.5 font-semibold">Payee</th><th className="px-3 py-2.5 font-semibold">Net</th><th className="px-3 py-2.5 font-semibold">Mode</th><th className="px-3 py-2.5 font-semibold">UTR</th>
            </tr></thead>
            <tbody>
              {payouts.rows.filter((p: any) => p.status === "paid").map((p: any) => (
                <tr key={p.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 text-zinc-500">{fmtDate(p.paid_at)}</td>
                  <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold text-zinc-800">{p.batch_ref}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{p.payee_name}</td>
                  <td className="px-3 py-2.5 font-medium text-emerald-600">{fmtInr(p.net)}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.mode}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500">{p.utr ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payouts.rows.filter((p: any) => p.status === "paid").length === 0 && <EmptyState title="No paid payouts" sub="Mark a batch as paid on the Payouts tab and it lands here" />}
        </Card>
      )}

      {tab === "expenses" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex gap-4 text-[12px]"><span className="text-zinc-500">Total <b className="text-zinc-800">{fmtInr(expenses.totals.amount ?? 0)}</b></span><span className="text-zinc-500">Paid <b className="text-emerald-600">{fmtInr(expenses.totals.paid ?? 0)}</b></span></div>
            <button className="btn btn-secondary text-[12px]" onClick={() => setExpenseOpen(true)}>+ Post Expense</button>
          </div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Expense</th><th className="px-3 py-2.5 font-semibold">Category</th><th className="px-3 py-2.5 font-semibold">Vendor</th><th className="px-3 py-2.5 font-semibold">Amount</th><th className="px-3 py-2.5 font-semibold">Date</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {expenses.rows.map((e: any) => (
                <tr key={e.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{e.title}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{e.category}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{e.vendor ?? "—"}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(e.amount)}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(e.expense_date)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${e.paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-600"}`}>{e.paid ? "Paid" : "Due"}</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "accounting" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardTitle title="Income (Commissions)" /><div className="text-2xl font-bold text-emerald-600 pt-2">{fmtInr(acct.income ?? 0)}</div><div className="text-[11.5px] text-zinc-400 mt-1">Received {fmtInr(acct.incomeReceived ?? 0)} · Receivable {fmtInr(acct.receivable ?? 0)}</div></Card>
          <Card><CardTitle title="Expenses" /><div className="text-2xl font-bold text-rose-600 pt-2">{fmtInr(acct.expenses ?? 0)}</div><div className="text-[11.5px] text-zinc-400 mt-1">Paid {fmtInr(acct.expensesPaid ?? 0)} · Payouts to partners {fmtInr(acct.paidOut ?? 0)}</div></Card>
          <Card><CardTitle title="Net Profit" /><div className={`text-2xl font-bold pt-2 ${acct.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtInr(acct.netProfit ?? 0)}</div><div className="text-[11.5px] text-zinc-400 mt-1">Received − expenses − partner payouts</div></Card>
          {(acct.byCategory ?? []).length > 0 && (
            <Card className="md:col-span-3"><CardTitle title="Expenses by Category" /><div className="flex flex-wrap gap-3 pt-3">{(acct.byCategory ?? []).map((c: any) => (
              <div key={c.category} className="rounded-lg border border-zinc-100 px-3 py-2 text-[12px]"><span className="text-zinc-500">{c.category}</span> <b className="text-zinc-800 ml-1">{fmtInr(c.amount)}</b></div>
            ))}</div></Card>
          )}
        </div>
      )}

      <PayoutModal open={payoutOpen} onClose={() => setPayoutOpen(false)} partners={partners} apps={incomeApps} onDone={() => { setPayoutOpen(false); load(); }} />
      <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} onDone={() => { setExpenseOpen(false); load(); }} />
    </div>
  );
}

function PayoutModal({ open, onClose, partners, apps, onDone }: any) {
  const [payeeId, setPayeeId] = useState("");
  const [appIds, setAppIds] = useState<number[]>([]);
  const [mode, setMode] = useState("NEFT");
  const [busy, setBusy] = useState(false);
  const payee = partners.find((p: any) => p.id === Number(payeeId));
  const selected = apps.filter((a: any) => appIds.includes(a.id));
  const gross = selected.reduce((s: number, a: any) => s + a.commission_gross, 0);
  const tds = Math.round(gross * 0.02);
  const net = gross - tds;
  const share = Math.round(net * 0.6);

  const save = async () => {
    setBusy(true);
    try {
      await api("/gn/finance/payouts", { method: "POST", body: { payee_type: "Partner", payee_id: Number(payeeId), payee_name: payee.name, app_ids: appIds, mode } });
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Compute Partner Payout" wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Partner"><select className="input text-[12.5px]" value={payeeId} onChange={(e) => setPayeeId(e.target.value)}><option value="">Select partner…</option>{partners.map((p: any) => <option key={p.id} value={p.id}>{p.name} · {p.type}</option>)}</select></Field>
        <Field label="Mode"><select className="input text-[12.5px]" value={mode} onChange={(e) => setMode(e.target.value)}>{["NEFT", "IMPS", "UPI", "Cheque"].map((m) => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <Field label={`Select earned commissions (${apps.length} available)`}>
        <div className="border border-zinc-200 rounded-md max-h-44 overflow-y-auto divide-y divide-zinc-50">
          {apps.map((a: any) => (
            <label key={a.id} className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-zinc-50 cursor-pointer">
              <input type="checkbox" checked={appIds.includes(a.id)} onChange={() => setAppIds(appIds.includes(a.id) ? appIds.filter((x) => x !== a.id) : [...appIds, a.id])} />
              <span className="font-medium text-zinc-800">{a.ref}</span>
              <span className="text-zinc-400 flex-1">{a.name}</span>
              <span className="font-semibold text-emerald-600">{fmtInr(a.commission_gross)}</span>
            </label>
          ))}
          {apps.length === 0 && <div className="px-3 py-4 text-[12px] text-zinc-400">No earned commissions to batch.</div>}
        </div>
      </Field>
      <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
        <div><div className="text-[10px] uppercase text-zinc-400 font-semibold">Gross</div><b className="text-zinc-800">{fmtInr(gross)}</b></div>
        <div><div className="text-[10px] uppercase text-zinc-400 font-semibold">TDS (2%)</div><b className="text-zinc-800">{fmtInr(tds)}</b></div>
        <div><div className="text-[10px] uppercase text-zinc-400 font-semibold">Net</div><b className="text-zinc-800">{fmtInr(net)}</b></div>
        <div><div className="text-[10px] uppercase text-emerald-600 font-semibold">Partner share (60%)</div><b className="text-emerald-700">{fmtInr(share)}</b></div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !payeeId || appIds.length === 0} onClick={save}>{busy ? "Creating…" : `Create Payout Batch (${fmtInr(share)})`}</button>
      </div>
    </Modal>
  );
}

function ExpenseModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ title: "", category: "operations", amount: 0 });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/finance/expenses", { method: "POST", body: { ...f, amount: Number(f.amount) } }); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Post Expense">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title"><input className="input text-[12.5px]" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Category"><select className="input text-[12.5px]" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["operations", "rent", "technology", "marketing", "payroll", "utilities", "professional", "travel"].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Amount (₹)"><input className="input text-[12.5px]" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.title || !f.amount} onClick={save}>{busy ? "Posting…" : "Post Expense"}</button>
      </div>
    </Modal>
  );
}
