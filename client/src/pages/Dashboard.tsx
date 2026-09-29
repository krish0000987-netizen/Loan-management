import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Landmark, Wallet, FileText, TrendingUp, ShieldCheck, ArrowRight, AlertTriangle } from "lucide-react";
import { api, fmtInr, timeAgo, badgeFor, statusLabel } from "../lib/api";
import { Card, CardTitle, Stat, EmptyState } from "../components/ui";
import { ImportExport } from "./gn/shared";

const CITIES: Record<string, [number, number]> = {
  "Maharashtra": [72.87, 19.08], "Delhi": [77.1, 28.7], "Karnataka": [77.59, 12.97], "Tamil Nadu": [80.27, 13.08],
  "Telangana": [78.49, 17.38], "West Bengal": [88.36, 22.57], "Gujarat": [72.57, 23.03], "Rajasthan": [75.79, 26.91],
  "Uttar Pradesh": [80.95, 26.85], "Kerala": [76.27, 10.0], "Assam": [91.74, 26.14], "Punjab": [75.86, 30.9],
  "Bihar": [85.14, 25.61], "Madhya Pradesh": [75.86, 22.72], "Andhra Pradesh": [80.65, 16.51], "Haryana": [76.85, 29.06],
  "Odisha": [85.82, 20.3], "Jharkhand": [85.31, 23.36]
};

const INDIA_POLY: [number, number][] = [
  [68.2, 23.8], [68.5, 23.0], [69.4, 22.2], [70.5, 21.0], [72.5, 20.0], [72.8, 19.0], [73.9, 17.6], [74.0, 15.5],
  [74.8, 13.5], [75.9, 11.8], [77.2, 10.2], [78.2, 8.8], [77.55, 8.08], [79.8, 10.3], [80.2, 13.1], [80.3, 16.2],
  [81.9, 17.6], [82.3, 18.3], [83.3, 21.5], [85.8, 21.6], [87.0, 21.6], [88.3, 22.5], [88.9, 23.4], [89.6, 25.0],
  [91.8, 26.1], [92.6, 26.7], [93.9, 27.2], [95.0, 27.9], [96.5, 28.7], [97.4, 28.6], [95.5, 29.8], [93.8, 30.2],
  [91.0, 29.8], [89.0, 30.0], [88.1, 27.9], [86.3, 27.5], [84.5, 28.4], [82.4, 30.1], [80.2, 30.5], [78.6, 30.9],
  [77.5, 31.8], [76.0, 32.6], [75.5, 33.9], [74.3, 35.4], [74.0, 36.8], [73.5, 35.5], [72.8, 34.0], [71.8, 32.7],
  [71.5, 31.5], [70.8, 29.3], [70.2, 27.0], [68.8, 25.7], [68.2, 24.3]
];

function project(lon: number, lat: number): [number, number] {
  const x = (lon - 67.5) * 11.2;
  const y = (37.5 - lat) * 10.6;
  return [x, y];
}

const PALETTE = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [attention, setAttention] = useState<any>(null);
  const nav = useNavigate();

  useEffect(() => {
    api("/dashboard").then(setD).catch(() => setD({}));
  }, []);

  useEffect(() => {
    Promise.all([api("/applications/sla").catch(() => null), api("/recon/stats").catch(() => null)])
      .then(([sla, recon]) => setAttention({ sla: sla?.summary, recon: recon?.stats }));
  }, []);

  if (!d) return <EmptyState title="Loading dashboard…" />;
  const k = d.kpis || {};
  const totalState = d.byState?.reduce((s: number, r: any) => s + r.value, 0) || 1;
  const mapMax = Math.max(1, ...(d.byState || []).map((r: any) => r.value));

  return (
    <div>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[19px] font-semibold tracking-tight text-zinc-900">Executive Dashboard</h1>
          <p className="text-[12.5px] text-zinc-500 mt-1">Live portfolio health across all lending operations</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExport entity="customers" /><ImportExport entity="loans" /><ImportExport entity="payments" />
          <button className="btn btn-secondary" onClick={() => nav("/reports")}>Full reports <ArrowRight size={13} /></button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
        <Stat label="Portfolio" value={fmtInr(k.portfolio)} sub={`${k.activeLoans} active loans`} tone="brand" icon={<Landmark size={17} />} />
        <Stat label="Disbursement · 30d" value={fmtInr(k.disbursement30d)} sub="newly funded" icon={<Wallet size={17} />} />
        <Stat label="Applications" value={k.applications?.toLocaleString("en-IN")} sub={`${k.leadsToday} leads today`} icon={<FileText size={17} />} />
        <Stat label="Approval Rate" value={`${k.approvalRate}%`} sub={`${k.loansApproved} approved`} tone="green" icon={<TrendingUp size={17} />} />
        <Stat label="Collection Eff." value={`${k.collectionEfficiency}%`} sub="30-day efficiency" tone="green" />
        <Stat label="Overdue" value={fmtInr(k.overdue)} sub="in arrears" tone="red" />
        <Stat label="NPA" value={fmtInr(k.npa)} sub={`${k.npaPct}% of book`} tone="red" />
        <Stat label="Pipeline ₹" value={fmtInr((d.pipeline || []).reduce((s: number, p: any) => s + (p.amount || 0), 0))} sub="requested in active stages" />
      </div>

      {/* Needs attention strip */}
      {attention && (
        <div className="mb-5 rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100">
            <AlertTriangle size={13} className="text-amber-600" />
            <span className="text-[12px] font-semibold text-zinc-800">Needs attention</span>
            <span className="text-[10.5px] text-zinc-400">· auto-generated from live queues</span>
          </div>
          <div className="flex flex-wrap gap-3 px-4 py-3">
            <button className="attention-chip" onClick={() => nav("/applications")}>
              <span className="text-[11px] text-zinc-500">Applications at SLA risk</span>
              <b className={`num text-[15px] ${attention.sla?.at_risk > 0 ? "text-amber-600" : "text-emerald-600"}`}>{attention.sla?.at_risk ?? 0}</b>
            </button>
            <button className="attention-chip" onClick={() => nav("/applications")}>
              <span className="text-[11px] text-zinc-500">SLA breached</span>
              <b className={`num text-[15px] ${attention.sla?.breached > 0 ? "text-rose-600" : "text-emerald-600"}`}>{attention.sla?.breached ?? 0}</b>
            </button>
            <button className="attention-chip" onClick={() => nav("/payments")}>
              <span className="text-[11px] text-zinc-500">Unmatched payments</span>
              <b className="num text-[15px] text-amber-600">{attention.recon?.unmatched?.count ?? 0}</b>
            </button>
            <button className="attention-chip" onClick={() => nav("/payments")}>
              <span className="text-[11px] text-zinc-500">Recon exceptions</span>
              <b className="num text-[15px] text-rose-600">{(attention.recon?.duplicate?.count ?? 0) + (attention.recon?.failed?.count ?? 0)}</b>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        {/* Disbursement trend */}
        <Card className="xl:col-span-2">
          <CardTitle title="Disbursement trend" sub="Principal disbursed per month (last 6 months)" right={
            <div className="flex items-center gap-3 text-[10.5px] text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-600" />Disbursed</span>
            </div>
          } />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.disbursementTrend || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} tickFormatter={(v) => (v >= 10000000 ? `${(v / 10000000).toFixed(1)} Cr` : `${(v / 100000).toFixed(0)} L`)} axisLine={false} tickLine={false} width={46} />
                <Tooltip formatter={(v: any) => [fmtInr(v), "Disbursed"]} contentStyle={{ fontSize: 11.5, borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* India map */}
        <Card>
          <CardTitle title="Portfolio by state" sub="Outstanding exposure across India (demo data)" />
          <svg viewBox="0 0 360 330" className="w-full">
            <polygon
              points={INDIA_POLY.map(([lon, lat]) => project(lon, lat).map((v) => v.toFixed(1)).join(",")).join(" ")}
              fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.2" strokeLinejoin="round"
            />
            {(d.byState || []).map((r: any, i: number) => {
              const c = CITIES[r.state];
              if (!c) return null;
              const [px, py] = project(c[0], c[1]);
              const r2 = 3 + (r.value / mapMax) * 11;
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r={r2} fill="#4f46e5" opacity={0.22} />
                  <circle cx={px} cy={py} r={Math.max(2, r2 * 0.55)} fill="#4f46e5" />
                  <title>{`${r.state}: ${fmtInr(r.value)} (${r.loans} loans)`}</title>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 space-y-1.5">
            {(d.byState || []).slice(0, 5).map((r: any) => (
              <div key={r.state} className="flex items-center gap-2 text-[11px]">
                <span className="w-20 text-zinc-500 truncate">{r.state}</span>
                <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full" style={{ width: `${(r.value / totalState) * 100}%` }} />
                </div>
                <span className="num font-medium text-zinc-700 w-16 text-right">{fmtInr(r.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Product mix */}
        <Card>
          <CardTitle title="Product mix" sub="Outstanding by product" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.productMix || []} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10.5, fill: "#71717a" }} axisLine={false} tickLine={false} width={86} />
                <Tooltip formatter={(v: any) => [fmtInr(v), "Outstanding"]} contentStyle={{ fontSize: 11.5, borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={11}>
                  {(d.productMix || []).map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardTitle title="Origination pipeline" sub="Applications by workflow stage" />
          <div className="space-y-2.5">
            {(d.pipeline || []).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-28 text-[11px] text-zinc-600 capitalize truncate">{p.stage}</span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${(p.count / Math.max(1, ...(d.pipeline || []).map((x: any) => x.count))) * 100}%` }} />
                </div>
                <span className="num text-[11.5px] font-semibold text-zinc-700 w-8 text-right">{p.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100">
            <div className="text-[11px] text-zinc-500 mb-2 font-medium">Stage distribution</div>
            <div className="flex gap-1">
              {(d.stageDistribution || []).slice(0, 8).map((s: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-16 flex items-end rounded bg-zinc-50 overflow-hidden">
                    <div className="w-full bg-brand-500 rounded-t" style={{ height: `${(s.n / Math.max(1, ...(d.stageDistribution || []).map((x: any) => x.n))) * 100}%` }} />
                  </div>
                  <span className="text-[8.5px] text-zinc-400 truncate w-full text-center">{s.stage.slice(0, 6)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardTitle title="Recent activity" sub="Live audit trail" />
          <div className="space-y-3">
            {(d.recent || []).slice(0, 9).map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-zinc-700 truncate">
                    <span className="font-medium">{r.by_name || "System"}</span> <span className="text-zinc-400">·</span> <span className="text-zinc-600">{r.action.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-[10.5px] text-zinc-400">{r.entity_type ? `${r.entity_type} #${r.entity_id} · ` : ""}{timeAgo(r.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
            {(d.alerts || []).slice(0, 3).map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <ShieldCheck size={13} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-[11.5px] text-zinc-600">
                  <span className="font-medium text-zinc-800">{a.title}:</span> {a.body}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
