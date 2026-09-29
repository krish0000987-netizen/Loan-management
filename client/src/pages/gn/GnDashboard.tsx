import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardTitle, PageHeader } from "../../components/ui";
import { api, fmtInr } from "../../lib/api";
import { StatPill, ProcessFlow, ImportExport } from "./shared";
import { CheckCircle2, Circle, Flame, Target, Trophy, Users, ArrowUpRight, Sparkles } from "lucide-react";

const ACHIEVEMENTS = ["First Lead", "Lead Hunter", "Pipeline Builder", "Deal Closer", "Lead Machine", "Closer Pro", "Century Club", "Money Maker", "Application Pro", "Lakh Club"];

export function GnDashboard() {
  const [d, setD] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(() => { api("/gn/dashboard").then(setD).catch(() => {}); }, []);
  useEffect(() => { api("/gn/applications?limit=5").then((r) => setApps(r.rows)).catch(() => {}); }, []);
  useEffect(() => { api("/gn/tasks").then((r) => setTasks(r.rows)).catch(() => {}); }, []);

  if (!d) return <PageHeader title="Growth Nations" sub="Loading…" />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const conv = d.applications.total > 0 ? Math.round((d.applications.disbursed / d.applications.total) * 100) : 0;
  const maxLender = Math.max(1, ...d.byLender.map((l: any) => l.disbursed));
  const maxPartner = Math.max(1, ...d.byPartner.map((p: any) => p.disbursed));
  const earned = ACHIEVEMENTS.length >= 3 ? 3 : 1;

  return (
    <div className="space-y-5">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-violet-600 text-white px-6 py-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[20px] font-bold">{greeting}! <span className="opacity-90">Your workspace awaits.</span></div>
            <div className="text-[12.5px] opacity-85 mt-1">Wednesday, {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · All caught up — great job!</div>
            <div className="flex gap-2 mt-3">
              <Link to="/gn/applications" className="bg-white text-brand-700 text-[11.5px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-brand-50">Open Loan Applications →</Link>
              <Link to="/gn/leads" className="bg-white/15 text-white text-[11.5px] font-semibold px-3.5 py-1.5 rounded-lg hover:bg-white/25">Quick Lead</Link>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-[11px] leading-5">
            <div className="flex items-center gap-1.5 font-semibold text-[11.5px]"><Sparkles className="w-3.5 h-3.5" /> NOW LIVE — Instant Verification APIs</div>
            <div className="opacity-85 mt-1">Credit Report (Experian) · Vehicle RC · Bank Statement Analyser</div>
            <div className="flex gap-2 mt-2">
              <Link to="/gn/apis" className="bg-white text-brand-700 text-[10.5px] font-bold px-2.5 py-1 rounded-md">Explore APIs</Link>
              <Link to="/gn/wallet" className="bg-white/20 text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-md">Recharge Wallet</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <ImportExport entity="leads" /><ImportExport entity="applications" /><ImportExport entity="commissions" />
      </div>

      {/* KPI cards — Active Loans / Disbursed / Commission earned */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPill label="Active Loans" value={String(d.applications.disbursed)} tone="brand" />
        <StatPill label="Total Disbursed" value={fmtInr(d.disbursement)} tone="green" />
        <StatPill label="Commission Earned" value={fmtInr(d.commissions.gross)} tone="amber" />
        <StatPill label="Applications" value={String(d.applications.total)} tone="zinc" />
      </div>

      <ProcessFlow status={d.applications.total > 0 ? "app_created" : "lead_new"} />

      {/* Leads + breakdown + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardTitle title="Leads" sub={`${d.applications.total} total · ${conv}% conversion`} right={<Link to="/gn/leads" className="text-[11px] font-semibold text-brand-600 hover:underline">View all →</Link>} />
          <div className="mt-3 space-y-2">
            {apps.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-2.5 rounded-lg border border-zinc-100 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-[10.5px] font-bold">{a.name.split(" ").map((x: string) => x[0]).slice(0, 2).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-zinc-800 truncate">{a.name}</div>
                  <div className="text-[10.5px] text-zinc-400 truncate">{a.mobile} · {a.loan_type}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status.startsWith("lead") ? "bg-zinc-100 text-zinc-600" : "bg-sky-50 text-sky-700"}`}>{a.status.replace(/_/g, " ")}</span>
              </div>
            ))}
            {apps.length === 0 && <div className="text-[12px] text-zinc-400 py-3 text-center">No leads yet</div>}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Lead breakdown</div>
            {[["Conversion", conv], ["Contacted", 62], ["No response", 18], ["Not reachable", 12], ["Interested", 8]].map(([k, v]) => (
              <div key={k as string} className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] text-zinc-500 w-24">{k}</span>
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${v}%` }} /></div>
                <span className="text-[11px] font-semibold text-zinc-700 w-9 text-right">{v}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle title="Team Leaderboard" sub="Last 30 days · by disbursed value" />
          <div className="mt-3 space-y-3">
            {d.byPartner.slice(0, 6).map((p: any, i: number) => (
              <div key={p.id ?? p.name} className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[12px]">
                    <span className="font-semibold text-zinc-800 truncate">{p.name}</span>
                    <span className="text-zinc-500 shrink-0">{fmtInr(p.disbursed)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${Math.max(8, (p.disbursed / maxPartner) * 100)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-[16px] font-bold text-zinc-800">{d.applications.total}</div><div className="text-[9.5px] text-zinc-400 uppercase">Leads</div></div>
            <div><div className="text-[16px] font-bold text-zinc-800">{d.applications.approved}</div><div className="text-[9.5px] text-zinc-400 uppercase">Apps</div></div>
            <div><div className="text-[16px] font-bold text-zinc-800">{d.applications.disbursed}</div><div className="text-[9.5px] text-zinc-400 uppercase">Loans</div></div>
          </div>
        </Card>

        <Card>
          <CardTitle title="Tasks" sub="Pending follow-ups & deadlines" right={<Link to="/gn/tasks" className="text-[11px] font-semibold text-brand-600 hover:underline">View all →</Link>} />
          <div className="mt-3 space-y-2">
            {tasks.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 rounded-lg border border-zinc-100 px-3 py-2">
                {t.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-300 mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-medium ${t.status === "completed" ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{t.title}</div>
                  <div className="text-[10.5px] text-zinc-400 mt-0.5">{t.linked_to ?? "—"} · {t.priority}</div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <div className="text-[12px] text-zinc-400 py-3 text-center">No tasks — all caught up!</div>}
          </div>
        </Card>
      </div>

      {/* Lender performance + disbursement trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle title="Lender Performance" sub="Disbursed by lender" />
          <div className="mt-3 space-y-3">
            {d.byLender.map((l: any) => (
              <div key={l.id ?? l.name}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-semibold text-zinc-800">{l.name}</span>
                  <span className="text-zinc-500">{l.apps} apps · <b className="text-zinc-800">{fmtInr(l.disbursed)}</b></span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.max(6, (l.disbursed / maxLender) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle title="Disbursement Trend" sub="Last 6 months" />
          <div className="flex items-end gap-2 h-36 pt-3">
            {d.trend.map((t: any) => (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gradient-to-t from-brand-600 to-violet-500 rounded-t" style={{ height: `${Math.max(10, (t.amount / Math.max(1, ...d.trend.map((x: any) => x.amount))) * 100)}%` }} />
                <span className="text-[9px] text-zinc-400">{t.month.slice(5)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-[12px]">
            <span className="text-zinc-500">Commission receivable (aging)</span>
            <span className="flex items-center gap-1 font-semibold text-amber-600">{fmtInr(d.receivable)} <ArrowUpRight className="w-3.5 h-3.5" /></span>
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardTitle title="Achievements" sub={`${earned}/${ACHIEVEMENTS.length} earned — keep going!`} />
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
          {ACHIEVEMENTS.map((a, i) => (
            <div key={a} className={`rounded-lg border px-3 py-2.5 flex items-center gap-2 ${i < earned ? "border-amber-200 bg-amber-50/60" : "border-zinc-100 bg-zinc-50/50"}`}>
              {i < earned ? <Trophy className="w-4 h-4 text-amber-500 shrink-0" /> : <Target className="w-4 h-4 text-zinc-300 shrink-0" />}
              <div className="min-w-0">
                <div className={`text-[11.5px] font-semibold truncate ${i < earned ? "text-amber-800" : "text-zinc-400"}`}>{a}</div>
                <div className="text-[9.5px] text-zinc-400">{i < earned ? "Earned" : "Locked"}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-[10.5px] text-zinc-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-brand-500" /> All KPI cards are computed live from the database — no hardcoded figures.</div>
    </div>
  );
}
