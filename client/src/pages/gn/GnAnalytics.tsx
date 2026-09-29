import { useEffect, useState } from "react";
import { Card, PageHeader, EmptyState } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";

export function GnAnalytics() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api("/gn/co/analytics").then(setData).catch(() => {}); }, []);

  const funnel = data?.funnel ?? {};
  const revenue = data?.revenue ?? {};
  const maxF = funnel.applicants || 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Command Center Analytics"
        sub="Loan funnel, lender / product / partner analytics and revenue — all computed from live records"
        breadcrumb="Growth Nations / Command Center / Analytics"
      />

      <Card pad={false}>
        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="text-[13px] font-bold text-zinc-800">Loan Funnel</div>
          <div className="text-[10.5px] text-zinc-400">Applicants → KYC → Applications → Sanctions → Disbursements</div>
        </div>
        <div className="p-4 space-y-2">
          {[["Applicants", funnel.applicants ?? 0], ["KYC Completed", funnel.kyc ?? 0], ["Applications", funnel.apps ?? 0], ["Approved / Sanctioned", funnel.sanctions ?? 0], ["Disbursed", funnel.disbursements ?? 0]].map(([l, v]) => (
            <div key={l as string} className="flex items-center gap-3">
              <div className="w-40 text-[11.5px] font-semibold text-zinc-700">{l}</div>
              <div className="flex-1 h-3 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(3, (Number(v) / maxF) * 100)}%` }} /></div>
              <div className="w-12 text-right text-[12.5px] font-bold">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 text-[13px] font-bold text-zinc-800">Disbursement by Lender</div>
          <div className="p-4 space-y-2">
            {data?.byLender?.length ? data.byLender.map((l: any) => (
              <div key={l.lender} className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-zinc-700">{l.lender}</span>
                <span className="flex items-center gap-3"><span className="text-zinc-400">{l.n} loans</span><span className="font-bold">{fmtInr(l.amount)}</span></span>
              </div>
            )) : <EmptyState title="No disbursements" />}
          </div>
        </Card>

        <Card pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 text-[13px] font-bold text-zinc-800">Disbursement by Product</div>
          <div className="p-4 space-y-2">
            {data?.byProduct?.length ? data.byProduct.map((p: any) => (
              <div key={p.product} className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-zinc-700">{p.product ?? "—"}</span>
                <span className="flex items-center gap-3"><span className="text-zinc-400">{p.n} apps</span><span className="font-bold">{fmtInr(p.amount)}</span></span>
              </div>
            )) : <EmptyState title="No applications" />}
          </div>
        </Card>

        <Card pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 text-[13px] font-bold text-zinc-800">Partner Disbursement (Top 8)</div>
          <div className="p-4 space-y-2">
            {data?.byPartner?.length ? data.byPartner.map((p: any) => (
              <div key={p.partner} className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-zinc-700">{p.partner}</span>
                <span className="flex items-center gap-3"><span className="text-zinc-400">{p.n} loans</span><span className="font-bold">{fmtInr(p.amount)}</span></span>
              </div>
            )) : <EmptyState title="No partner disbursements" />}
          </div>
        </Card>

        <Card pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 text-[13px] font-bold text-zinc-800">Revenue & Payouts (demo)</div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[["Disbursements", fmtInr(revenue.disbursed)], ["Gross Payout", fmtInr(revenue.gross)], ["Partner Share", fmtInr(revenue.partner_share)], ["Growth Nations Share", fmtInr(revenue.gn_share)]].map(([l, v]) => (
                <div key={l as string} className="rounded-xl border border-zinc-200 p-3">
                  <div className="text-[9.5px] uppercase text-zinc-400 font-semibold">{l}</div>
                  <div className="text-[16px] font-bold text-zinc-800 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-amber-600 font-semibold mt-2">DEMO COMMERCIAL DATA — illustrative payout economics, not actual lender payouts</div>
          </div>
        </Card>
      </div>

      <Card pad={false}>
        <div className="px-4 py-3 border-b border-zinc-100 text-[13px] font-bold text-zinc-800">Monthly Origination Trend</div>
        <div className="p-4 flex items-end gap-2 h-40">
          {data?.trend?.map((t: any) => {
            const h = Math.max(4, (t.applicants / (Math.max(...data.trend.map((x: any) => x.applicants), 1))) * 100);
            return (
              <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="text-[9.5px] text-zinc-500">{t.submitted}</div>
                <div className="w-full rounded-t bg-brand-500" style={{ height: `${h * 1.1}px` }} />
                <div className="text-[9.5px] text-zinc-400">{t.month}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
