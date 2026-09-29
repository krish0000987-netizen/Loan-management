import { useEffect, useState } from "react";
import { Card, PageHeader } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";
import { Link } from "react-router-dom";
import { FileBarChart, Download } from "lucide-react";
import { ImportExport } from "./shared";

export function GnReports() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/gn/dashboard").then(setD).catch(() => {}); }, []);

  const reports = [
    { name: "Disbursement Report", desc: "Loan-wise disbursement by lender, product & date", metric: d ? `${d.applications.disbursed} loans · ${fmtInr(d.disbursement)}` : "—" },
    { name: "Commission Statement", desc: "Commission earned, TDS & GST per loan / invoice", metric: d ? `${fmtInr(d.commissions.gross)} gross · ${fmtInr(d.commissions.net)} net` : "—" },
    { name: "Receivable Aging", desc: "Commission receivable from banks by age bucket", metric: d ? `${fmtInr(d.receivable)} outstanding` : "—" },
    { name: "Payout Ledger", desc: "Payout batches paid & payable to partners", metric: "4 batches" },
    { name: "Partner Performance", desc: "Partner-wise applications, disbursement & conversion", metric: `${d?.byPartner.length ?? 0} partners` },
    { name: "Lender Performance", desc: "Bank-wise volume, disbursement & commission", metric: `${d?.byLender.length ?? 0} banks` },
    { name: "Campaign ROI", desc: "Marketing spend → leads → applications → disbursement", metric: `${d?.campaigns.length ?? 0} campaigns` },
    { name: "Customer Fees", desc: "Processing, insurance & RTO collected on disbursed cases", metric: "12 cases" }
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" sub="Downloadable statements — every number is computed live from the database" breadcrumb="Growth Nations / Reports" actions={
        <div className="flex items-center gap-2"><ImportExport entity="applications" /><ImportExport entity="commissions" /><ImportExport entity="expenses" /></div>
      } />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((r) => (
          <Card key={r.name}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0"><FileBarChart className="w-4.5 h-4.5 text-brand-600" /></div>
                <div>
                  <div className="text-[13px] font-semibold text-zinc-800">{r.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{r.desc}</div>
                  <div className="text-[11px] font-semibold text-brand-700 mt-1.5">{r.metric}</div>
                </div>
              </div>
              <button className="btn btn-secondary text-[11px] shrink-0"><Download className="w-3.5 h-3.5 mr-1" />Export</button>
            </div>
          </Card>
        ))}
      </div>
      <div className="text-[10.5px] text-zinc-400">Exports generate CSV of the live filtered dataset. Deep-dive into each area from <Link to="/gn/dashboard" className="text-brand-600 font-semibold">GN Dashboard</Link>, <Link to="/gn/applications" className="text-brand-600 font-semibold">Pipeline</Link> or <Link to="/gn/finance" className="text-brand-600 font-semibold">Finance</Link>.</div>
    </div>
  );
}
