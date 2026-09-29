import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { Play, UserPlus, ArrowRight, CheckCircle2, Loader2, Rocket } from "lucide-react";

const FUNNEL_STEPS = [
  { key: "applicants", label: "Applicants" },
  { key: "kyc_started", label: "KYC Started" },
  { key: "kyc_completed", label: "KYC Completed" },
  { key: "eligible", label: "Eligible / Matched" },
  { key: "applications_created", label: "Applications Created" },
  { key: "applications_submitted", label: "Applications Submitted" },
  { key: "underwriting", label: "Underwriting" },
  { key: "approved", label: "Approved" },
  { key: "agreements", label: "Agreement Completed" },
  { key: "disb_initiated", label: "Disbursement Initiated" },
  { key: "disbursed", label: "Disbursed" },
  { key: "payout_received", label: "Payout Received" }
];

const DEMO_STEPS = [
  "KYC Verified", "Documents Complete", "Credit Profile Fetched", "Lender Matched",
  "Application Submitted", "Approved", "Agreement / eSign Completed", "₹25,00,000 Disbursed", "Payout Calculated", "CRM Updated"
];

export function GnOverview() {
  const [data, setData] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(-1);
  const [result, setResult] = useState<any>(null);

  const load = () => api("/gn/co/overview").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const runDemo = async () => {
    setRunning(true); setResult(null); setDemoStep(0);
    const tick = () => new Promise((r) => setTimeout(r, 320));
    for (let i = 1; i < DEMO_STEPS.length; i++) { await tick(); setDemoStep(i); }
    try {
      const r = await api("/gn/co/demo", { method: "POST", body: {} });
      setResult(r);
    } catch (e: any) { setResult({ error: e.message }); }
    setRunning(false);
    load();
  };

  const kpi = data?.kpi ?? {};
  const payouts = data?.payouts ?? {};
  const funnel = data?.funnel ?? {};

  const kpis = [
    ["Total Applicants", kpi.total ?? 0, ""],
    ["New Today", kpi.new_today ?? 0, ""],
    ["KYC Completed", kpi.kyc_completed ?? 0, ""],
    ["Applications Submitted", kpi.submitted ?? 0, ""],
    ["Approved", kpi.approved ?? 0, ""],
    ["Disbursed", kpi.disbursed ?? 0, ""],
    ["Total Disbursement", fmtInr(payouts.disbursed_amount), "green"],
    ["Expected Payout", fmtInr(payouts.expected_payout), "amber"],
    ["Payout Received", fmtInr(payouts.payout_received), "brand"]
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Growth Nations Command Center"
        sub="Loan origination & distribution — applicants, KYC, credit, lender matching, disbursement & payout in one operations view"
        breadcrumb="Growth Nations / Command Center"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary text-[12px]" onClick={runDemo} disabled={running}>
              <Rocket className="w-3.5 h-3.5 mr-1" /> RUN DEMO
            </button>
            <Link to="/gn/co/new" className="btn btn-primary text-[12px]"><UserPlus className="w-3.5 h-3.5 mr-1" />New Applicant</Link>
          </div>
        }
      />

      {running && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
            <div className="text-[13px] font-semibold text-zinc-800">Running reference demo — Rahul Sharma · ₹25,00,000 Business Loan</div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">DEMO / SANDBOX MODE</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {DEMO_STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-all ${i <= demoStep ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-100 bg-zinc-50 text-zinc-400"}`}>
                {i <= demoStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                {s}
              </div>
            ))}
          </div>
          {result && !result.error && (
            <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-[12px] text-brand-800">
              <span className="font-bold">LOAN DISBURSED ✓</span> — {result.ref} · ₹25,00,000 to borrower's account · CRM updated · payout calculated & tracked
            </div>
          )}
          {result?.error && <div className="mt-3 text-[12px] font-semibold text-rose-600">Demo failed: {result.error}</div>}
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {kpis.map(([label, value, tone]) => (
          <div key={label as string} className={`rounded-xl border px-3.5 py-3 ${tone === "green" ? "border-emerald-100 bg-emerald-50/40" : tone === "amber" ? "border-amber-100 bg-amber-50/40" : tone === "brand" ? "border-brand-100 bg-brand-50/40" : "border-zinc-200 bg-white"}`}>
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-400">{label}</div>
            <div className="text-[17px] font-bold text-zinc-800 mt-0.5 leading-tight">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-zinc-800">Loan Funnel</div>
              <div className="text-[10.5px] text-zinc-400">Every stage database-driven — click a stage to open its queue</div>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">LIVE</span>
          </div>
          <div className="p-4 space-y-1.5">
            {FUNNEL_STEPS.map((s, i) => {
              const n = funnel[s.key] ?? 0;
              const max = funnel.applicants || 1;
              const pct = Math.round((n / max) * 100);
              return (
                <Link key={s.key} to={`/gn/co/applicants?tab=${s.key === "kyc_started" ? "kyc" : s.key === "kyc_completed" ? "kyc" : s.key === "eligible" ? "match" : s.key === "applications_created" ? "docs" : s.key === "applications_submitted" ? "docs" : s.key === "underwriting" ? "uw" : s.key === "approved" ? "sanction" : s.key === "disb_initiated" ? "disbursement" : s.key === "disbursed" ? "payout" : s.key === "payout_received" ? "payout" : "all"}`} className="block group">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 bg-zinc-100 text-zinc-500 group-hover:bg-brand-600 group-hover:text-white">{i + 1}</div>
                    <div className="w-36 shrink-0 text-[11.5px] font-semibold text-zinc-700 group-hover:text-brand-700">{s.label}</div>
                    <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className={`h-full rounded-full ${i === FUNNEL_STEPS.length - 1 ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${Math.max(3, pct)}%` }} />
                    </div>
                    <div className="w-14 text-right text-[12px] font-bold text-zinc-800">{n}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitleCustom title="Disbursement by Lender" />
            {!data?.byLender?.length ? <EmptyState title="No disbursements yet" sub="Disbursed applicants will appear here" /> : (
              <div className="space-y-2 mt-2">
                {data.byLender.map((l: any) => (
                  <div key={l.lender_id} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-zinc-700">{l.lender_name}</span>
                    <span className="flex items-center gap-2"><span className="text-zinc-400">{l.n} loans</span><span className="font-bold text-zinc-800">{fmtInr(l.amount)}</span></span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12.5px] font-bold text-zinc-800">Live Applicant Tracker</div>
              <Link to="/gn/co/applicants" className="text-[10.5px] font-semibold text-brand-600 hover:underline">View all →</Link>
            </div>
            {!data?.recent?.length ? <EmptyState title="No applicants yet" sub="Create your first applicant to get started" /> : (
              <div className="space-y-1.5">
                {data.recent.map((a: any) => (
                  <Link key={a.id} to={`/gn/co/applicants?id=${a.id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 px-2.5 py-2 hover:border-brand-200">
                    <div>
                      <div className="text-[12px] font-semibold text-zinc-800">{a.name}</div>
                      <div className="text-[10px] text-zinc-400">{a.loan_type ?? "—"} · {fmtInr(a.loan_amount)} · {fmtDate(a.created_at)}</div>
                    </div>
                    <span className={`text-[9.5px] font-bold rounded-full px-2 py-0.5 border ${appStatusBadge(a.app_status)}`}>{a.app_status}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function CardTitleCustom({ title }: { title: string }) {
  return <div className="text-[12.5px] font-bold text-zinc-800">{title}</div>;
}

function appStatusBadge(s: string | null | undefined): string {
  const map: Record<string, string> = {
    payout: "border-emerald-200 bg-emerald-50 text-emerald-700", disbursed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    disb_initiated: "border-amber-200 bg-amber-50 text-amber-700", approved: "border-indigo-200 bg-indigo-50 text-indigo-700",
    uw: "border-sky-200 bg-sky-50 text-sky-700", submitted: "border-sky-200 bg-sky-50 text-sky-700",
    created: "border-zinc-200 bg-zinc-50 text-zinc-600", rejected: "border-rose-200 bg-rose-50 text-rose-700"
  };
  return map[s ?? ""] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
}
