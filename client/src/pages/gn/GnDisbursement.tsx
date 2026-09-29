import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader, Badge, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { gnBadge, gnStatusLabel } from "../../lib/gn";
import { ProcessFlow, ImportExport } from "./shared";
import { Landmark, ArrowDown, Wallet } from "lucide-react";

const DISB_STATUSES = ["disb_pending", "disb_initiated", "disb_partial", "disb_fully", "disb_confirmed", "crm_updated", "commission_reconciled", "disb_failed"];

export function GnDisbursement() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    Promise.all(DISB_STATUSES.map((s) => api(`/gn/applications?status=${s}&limit=50`).then((r) => r.rows))).then((groups) => {
      const all: any[] = []; for (const g of groups) all.push(...g);
      setRows(all.sort((a, b) => (b.disbursed_at ?? b.created_at).localeCompare(a.disbursed_at ?? a.created_at)));
    }).catch(() => {});
  }, []);
  const total = rows.reduce((s, r) => s + (r.disbursed_amount || 0), 0);
  const confirmed = rows.filter((r) => ["disb_confirmed", "crm_updated", "commission_reconciled"].includes(r.status)).length;
  const failed = rows.filter((r) => r.status === "disb_failed").length;

  return (
    <div className="space-y-5">
      <PageHeader title="Disbursement" sub="Lender-triggered disbursements — funds go directly from the lender to the borrower's bank account" breadcrumb="Growth Nations / CRM / Disbursement" actions={<div className="flex items-center gap-2"><ImportExport entity="applications" /></div>} />
      <ProcessFlow status="disb_fully" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Total Disbursed", fmtInr(total)], ["Confirmed", confirmed], ["Triggered / Pending", rows.length - confirmed - failed], ["Failed", failed]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div><div className="text-[17px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
        ))}
      </div>

      {/* Funds flow visual */}
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2"><Landmark className="w-5 h-5 text-indigo-500" /><div><div className="text-[11px] font-bold text-zinc-700">Lender</div><div className="text-[10px] text-zinc-400">Disbursement triggered</div></div></div>
        <ArrowDown className="w-4 h-4 text-zinc-300" />
        <div className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-emerald-500" /><div><div className="text-[13px] font-bold text-emerald-700">{fmtInr(total)}</div><div className="text-[10px] text-zinc-400">Transferred by lender</div></div></div>
        <ArrowDown className="w-4 h-4 text-zinc-300" />
        <div className="flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-600" /><div><div className="text-[11px] font-bold text-zinc-700">Borrower's Bank Account</div><div className="text-[10px] text-zinc-400">Growth Nations never holds loan funds</div></div></div>
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Ref</th><th className="px-3 py-2.5 font-semibold">Borrower</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Product</th>
                <th className="px-3 py-2.5 font-semibold text-right">Disbursed</th><th className="px-3 py-2.5 font-semibold text-right">Commission</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Disbursed On</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-brand-700">{r.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{r.lender_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.product_name ?? "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800 text-right">{fmtInr(r.disbursed_amount || 0)}</td>
                  <td className="px-3 py-2.5 text-right">{r.commission_gross > 0 ? <span className="font-semibold text-emerald-600">{fmtInr(r.commission_gross)}</span> : <span className="text-zinc-300">—</span>}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={gnBadge(r.status)}>{gnStatusLabel(r.status)}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(r.disbursed_at ?? r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="No disbursements" sub="Walk a file through the pipeline in the Loan Applications workspace" />}
        </div>
      </Card>
      <div className="text-[11px] text-zinc-400">Manage each file in the <Link to="/gn/applications" className="text-brand-600 font-semibold">Loan Applications</Link> workspace — trigger disbursement, confirm funds and reconcile commission step by step.</div>
    </div>
  );
}
