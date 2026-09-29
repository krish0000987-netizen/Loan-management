import { useEffect, useState } from "react";
import { Card, PageHeader, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { ProcessFlow, ImportExport } from "./shared";
import { Link } from "react-router-dom";

export function GnCrossSelling() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/gn/cross-selling").then(setD).catch(() => {}); }, []);
  const rows = d?.rows ?? [];
  const total = rows.reduce((s: number, r: any) => s + r.disbursed_amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Cross Selling" sub="Loans aged past their cooldown — eligible for top-up, balance transfer or a new-product pitch" breadcrumb="Growth Nations / CRM / Cross Selling" actions={<div className="flex items-center gap-2"><ImportExport entity="applications" /></div>} />
      <ProcessFlow status="disb_confirmed" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Cases in Cross-Sell Pool", d?.poolSize ?? 0], ["Total Disbursed (pool)", fmtInr(total)], ["Cohort Tenure", `${d?.months ?? 12}+ months`], ["Banks Represented", new Set(rows.map((r: any) => r.lender_name)).size]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div><div className="text-[17px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Borrower</th><th className="px-3 py-2.5 font-semibold">Bank · Product</th><th className="px-3 py-2.5 font-semibold">App Ref</th>
                <th className="px-3 py-2.5 font-semibold text-right">Disbursed</th><th className="px-3 py-2.5 font-semibold">First Disb.</th><th className="px-3 py-2.5 font-semibold">Aged</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.lender_name}</td>
                  <td className="px-3 py-2.5 font-semibold text-brand-700">{r.ref}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800 text-right">{fmtInr(r.disbursed_amount)}</td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(r.disbursed_at)}</td>
                  <td className="px-3 py-2.5"><span className="font-bold text-violet-600">{r.aged_months}+ mo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="No loans in this cohort yet" sub="Loans that cross the age threshold appear here automatically" />}
        </div>
      </Card>
      <div className="text-[11px] text-zinc-400">Run the pitch from the <Link to="/gn/applications" className="text-brand-600 font-semibold">Loan Applications</Link> workspace — the pool is derived live from disbursed loans.</div>
    </div>
  );
}
