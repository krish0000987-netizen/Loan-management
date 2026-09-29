import React, { useState } from 'react';
import { Cpu, Zap, CheckCircle2, AlertTriangle, Sliders, ShieldCheck, FileCheck } from 'lucide-react';

export const CreditBreSection: React.FC = () => {
  const [creditScore, setCreditScore] = useState(760);
  const [foir, setFoir] = useState(38);
  const [monthlyIncome, setMonthlyIncome] = useState(120000);

  // Dynamic Rule Evaluation
  const isEligible = creditScore >= 750 && foir <= 45 && monthlyIncome >= 50000;
  const maxEligibleAmount = isEligible ? Math.min(monthlyIncome * 20, 2500000) : 0;

  return (
    <section id="bre" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            <span>BUSINESS RULE ENGINE (BRE)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            DECISIONS POWERED BY RULES, DATA AND INTELLIGENCE.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Configure sub-second credit decisioning with dual bureau scoring, Account Aggregator cashflows, GST analytics, and customizable policy matrices.
          </p>
        </div>

        {/* Visual Rule Builder Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Test Sliders */}
          <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Test Rule Simulator</h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                SUB-SECOND EXECUTION
              </span>
            </div>

            {/* Slider 1: Credit Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>CIBIL / Experian Score</span>
                <span className="text-blue-600 font-mono text-sm">{creditScore}</span>
              </div>
              <input 
                type="range" 
                min="600" 
                max="850" 
                value={creditScore}
                onChange={(e) => setCreditScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>600 (High Risk)</span>
                <span>750 (Threshold)</span>
                <span>850 (Prime)</span>
              </div>
            </div>

            {/* Slider 2: FOIR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Fixed Obligation to Income Ratio (FOIR)</span>
                <span className="text-blue-600 font-mono text-sm">{foir}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="75" 
                value={foir}
                onChange={(e) => setFoir(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>10% (Low Obligation)</span>
                <span>45% (Max Rule Cap)</span>
                <span>75% (Excessive)</span>
              </div>
            </div>

            {/* Slider 3: Monthly Net Income */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Monthly Net Income</span>
                <span className="text-blue-600 font-mono text-sm">₹{monthlyIncome.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range" 
                min="20000" 
                max="300000" 
                step="5000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Simulated Result Box */}
            <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 transition-all ${
              isEligible 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>BRE EVALUATION RESULT:</span>
                <span className="text-sm">
                  {isEligible ? 'PASSED (LOW RISK)' : 'REJECTED / POLICY EXCEPTION'}
                </span>
              </div>
              {isEligible ? (
                <p>Auto-Approved Max Sanction: <strong className="text-emerald-700">₹{(maxEligibleAmount / 100000).toFixed(2)} Lakhs</strong></p>
              ) : (
                <p>Reason: {creditScore < 750 ? 'Credit Score below 750 cap' : foir > 45 ? 'FOIR exceeds 45% ceiling' : 'Income below ₹50,000 threshold'}</p>
              )}
            </div>
          </div>

          {/* Right: Visual Rule Builder Representation */}
          <div className="lg:col-span-7 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                Visual Policy Rule Builder #RULE-01
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                ACTIVE IN PRODUCTION
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-purple-400 font-bold">IF</span> (
                Credit Score <span className="text-emerald-400">≥ 750</span> <span className="text-purple-400 font-bold">AND</span> 
                FOIR <span className="text-emerald-400">≤ 45%</span> <span className="text-purple-400 font-bold">AND</span> 
                No DPD &gt; 30 in 12 months
                )
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-purple-400 font-bold">THEN</span> Eligibility = <span className="text-emerald-400 font-bold">PASSED</span>, 
                Risk Tier = <span className="text-blue-400 font-bold">LOW</span>, 
                Action = <span className="text-emerald-400">Auto-Generate KFS</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-purple-400 font-bold">IF NOT</span> (
                Credit Score <span className="text-amber-400">700 – 749</span> <span className="text-purple-400 font-bold">AND</span> 
                DSCR <span className="text-emerald-400">≥ 1.35</span>
                )
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <span className="text-purple-400 font-bold">THEN</span> Route to = <span className="text-amber-400 font-bold">Senior Underwriter Queue</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                <span>Bureau:</span> <strong className="text-white">CIBIL + Experian</strong>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                <span>Banking AA:</span> <strong className="text-white">Perfios / Setu</strong>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                <span>GST Check:</span> <strong className="text-white">GSTR-3B Sync</strong>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
                <span>Fraud Signals:</span> <strong className="text-white">PAN / Face Liveness</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
