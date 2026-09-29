import React from 'react';
import { Building2, Users, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';

export const DsaSection: React.FC = () => {
  return (
    <section id="dsa" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>DSA & CHANNEL PARTNER PORTAL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            TURN YOUR PARTNER NETWORK INTO A GROWTH ENGINE.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Dedicated portal for Direct Sales Agents (DSAs), brokers, and fintech affiliates with real-time lead tracking, automated payouts, and tier commission management.
          </p>
        </div>

        {/* DSA Funnel Frame */}
        <div className="bg-slate-900 text-white p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h3 className="text-base font-bold text-white">DSA Partner Performance Dashboard</h3>
              <p className="text-xs text-slate-400">Partner: Apex Capital Associates (Tier-1 Platinum)</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              Pipelined Commission: ₹4.82 Lakhs
            </span>
          </div>

          {/* Funnel Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Referred Leads</span>
              <div className="text-2xl font-extrabold text-white mt-1">420</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Submitted Apps</span>
              <div className="text-2xl font-extrabold text-blue-400 mt-1">310</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Sanctioned</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">218</div>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Disbursed Volume</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">₹8.4 Cr</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
