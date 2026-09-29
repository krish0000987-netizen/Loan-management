import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { api, fmtInr, fmtDate } from "../lib/api";
import { PageHeader, Card, CardTitle, Badge, DataTable, type Column } from "../components/ui";
import { ImportExport } from "./gn/shared";

export default function Reports() {
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => { api("/reports").then(setData); }, []);

  const productCols: Column<any>[] = [
    { key: "product", header: "Product", render: (r) => <span className="font-medium">{r.product}</span> },
    { key: "loans", header: "Loans", align: "right", render: (r) => <span className="num">{r.loans}</span> },
    { key: "principal", header: "Principal", align: "right", render: (r) => <span className="num">{fmtInr(r.principal)}</span> },
    { key: "outstanding", header: "Outstanding", align: "right", render: (r) => <span className="num font-semibold">{fmtInr(r.outstanding)}</span> },
    { key: "rate", header: "Avg rate", align: "right", render: (r) => <span className="num">{Number(r.avg_rate).toFixed(2)}%</span> },
    { key: "overdue", header: "Overdue", align: "right", render: (r) => <span className={`num ${r.overdue > 0 ? "text-rose-600 font-semibold" : ""}`}>{r.overdue}</span> }
  ];

  const approvalCols: Column<any>[] = [
    { key: "product", header: "Product", render: (r) => <span className="font-medium">{r.product}</span> },
    { key: "apps", header: "Applications", align: "right", render: (r) => <span className="num">{r.apps}</span> },
    { key: "approved", header: "Approved", align: "right", render: (r) => <span className="num text-emerald-600">{r.approved}</span> },
    { key: "rejected", header: "Rejected", align: "right", render: (r) => <span className="num text-rose-600">{r.rejected}</span> },
    { key: "in_pipeline", header: "In pipeline", align: "right", render: (r) => <span className="num">{r.in_pipeline}</span> },
    { key: "rate", header: "Approval rate", align: "right", render: (r) => {
      const total = Number(r.approved) + Number(r.rejected);
      return <span className="num font-semibold">{total ? `${Math.round((r.approved / total) * 100)}%` : "—"}</span>;
    }}
  ];

  const branchCols: Column<any>[] = [
    { key: "branch", header: "Branch", render: (r) => (
      <div><div className="font-medium">{r.branch}</div><div className="text-[10.5px] text-zinc-400">{r.city}</div></div>
    )},
    { key: "loans", header: "Loans", align: "right", render: (r) => <span className="num">{r.loans}</span> },
    { key: "outstanding", header: "Outstanding", align: "right", render: (r) => <span className="num">{fmtInr(r.outstanding)}</span> },
    { key: "applications", header: "Applications", align: "right", render: (r) => <span className="num">{r.applications}</span> },
    { key: "approved", header: "Approved", align: "right", render: (r) => <span className="num text-emerald-600">{r.approved}</span> }
  ];

  const dsaCols: Column<any>[] = [
    { key: "dsa", header: "DSA partner", render: (r) => <span className="font-medium">{r.dsa}</span> },
    { key: "leads", header: "Leads", align: "right", render: (r) => <span className="num">{r.leads}</span> },
    { key: "converted", header: "Converted", align: "right", render: (r) => <span className="num">{r.converted}</span> },
    { key: "applications", header: "Applications", align: "right", render: (r) => <span className="num">{r.applications}</span> },
    { key: "approved", header: "Approved", align: "right", render: (r) => <span className="num text-emerald-600">{r.approved}</span> },
    { key: "conv_rate", header: "Conversion", align: "right", render: (r) => {
      const rate = r.leads ? Math.round((r.converted / r.leads) * 100) : 0;
      return <span className="num">{rate}%</span>;
    }}
  ];

  if (!data) return null;

  const monthly = (data.monthlyCollections || []).map((m: any) => ({ ...m, month: m.month.slice(5) }));
  const maxMonth = Math.max(1, ...monthly.map((m: any) => m.amount));

  return (
    <div>
      <PageHeader title="Enterprise reports" sub="Sales · LOS · Credit · LMS · Collections · Finance — every module reportable" breadcrumb="Intelligence / Reports" actions={
        <div className="flex items-center gap-2">
          <ImportExport entity="customers" /><ImportExport entity="loans" /><ImportExport entity="payments" />
        </div>
      } />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <Card>
          <CardTitle title="Monthly collections" sub="Last 6 months" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} axisLine={false} tickLine={false} width={42} />
                <Tooltip formatter={(v: any) => [fmtInr(v), "Collected"]} contentStyle={{ fontSize: 11.5, borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <Bar dataKey="amount" radius={[3, 3, 0, 0]} barSize={18}>
                  {monthly.map((m: any, i: number) => <Cell key={i} fill={m.amount >= maxMonth * 0.6 ? "#059669" : "#10b981"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle title="DPD book" sub="Delinquency distribution" />
          <div className="space-y-2.5">
            {(data.dpdBook || []).map((d: any) => (
              <div key={d.bucket} className="flex items-center gap-3">
                <span className="w-14 text-[11.5px] text-zinc-600">{d.bucket} DPD</span>
                <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full ${d.bucket === "0" ? "bg-emerald-500" : d.bucket === "1-30" ? "bg-amber-400" : d.bucket === "31-60" ? "bg-orange-500" : "bg-rose-500"}`}
                    style={{ width: `${(Number(d.loans) / Math.max(1, ...(data.dpdBook || []).map((x: any) => x.loans))) * 100}%` }} />
                </div>
                <span className="num text-[11.5px] font-semibold w-10 text-right">{d.loans}</span>
                <span className="num text-[11px] text-zinc-400 w-20 text-right">{fmtInr(d.outstanding)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card><CardTitle title="Loan portfolio by product" sub="Book composition, rates, delinquency" /><DataTable columns={productCols} rows={data.loanPortfolio || []} total={data.loanPortfolio?.length} exportName="portfolio" /></Card>
        <Card><CardTitle title="Approval performance by product" /><DataTable columns={approvalCols} rows={data.approvalByProduct || []} total={data.approvalByProduct?.length} exportName="approvals" /></Card>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card><CardTitle title="Branch performance" /><DataTable columns={branchCols} rows={data.branchPerformance || []} total={data.branchPerformance?.length} exportName="branches" /></Card>
          <Card><CardTitle title="DSA partner performance" /><DataTable columns={dsaCols} rows={data.dsaPerformance || []} total={data.dsaPerformance?.length} exportName="dsa" /></Card>
        </div>
      </div>
    </div>
  );
}
