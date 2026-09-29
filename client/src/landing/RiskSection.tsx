import React from 'react';
import { ShieldAlert, AlertTriangle, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';

export const RiskSection: React.FC = () => {
  return (
    <section id="risk" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>EARLY WARNING SYSTEM (EWS)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            SEE RISK BEFORE IT BECOMES A PROBLEM.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Real-time portfolio intelligence scanning for early DPD spikes, broken promises to pay, declining bank balances, and leverage concentration.
          </p>
        </div>

        {/* Risk Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span>ALERT SIGNAL #01</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white">DPD Increase & Missed EMI Signal</h3>
            <p className="text-slate-400 font-sans text-xs">
              Detects borrowers who missed an EMI or whose bank average balance dropped by &gt;40% over 60 days.
            </p>
            <div className="text-[11px] text-amber-400">Action: Escalated to Senior Collector</div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>ALERT SIGNAL #02</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-white">High Credit Exposure & Leverage Spike</h3>
            <p className="text-slate-400 font-sans text-xs">
              Triggers when borrower pulls new external credit lines from bureau partners within 30 days of sanction.
            </p>
            <div className="text-[11px] text-rose-400">Action: Subvention & Limit Freeze</div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-sky-400 font-bold">
              <span>ALERT SIGNAL #03</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-bold text-white">GST Turnover Variance & Reconciliation</h3>
            <p className="text-slate-400 font-sans text-xs">
              Monitors GSTR 3B vs 1 return filings to flag sudden commercial revenue contractions for MSME borrowers.
            </p>
            <div className="text-[11px] text-sky-400">Action: Credit Review Queued</div>
          </div>
        </div>

      </div>
    </section>
  );
};
