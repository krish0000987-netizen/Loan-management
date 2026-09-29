import React, { useState } from 'react';
import { Workflow, CheckCircle2, ShieldCheck, ArrowRight, FileCheck, Zap, Sparkles, Building2, UserCheck, AlertTriangle } from 'lucide-react';

export const LosSection: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<'NX-10482' | 'NX-10483' | 'NX-10485'>('NX-10482');

  const apps = {
    'NX-10482': {
      id: 'NX-10482',
      name: 'Rahul Sharma (Ananya Corp)',
      loanType: 'Business Loan',
      amount: '₹25,00,000',
      tenure: '36 Months',
      creditScore: 782,
      foir: '38%',
      dscr: '1.85',
      kyc: 'VERIFIED',
      bre: 'PASSED',
      risk: 'LOW',
      underwriting: 'APPROVED',
      stageIndex: 10 // Sanction & KFS Issued
    },
    'NX-10483': {
      id: 'NX-10483',
      name: 'Ananya Enterprises',
      loanType: 'MSME Working Capital',
      amount: '₹50,00,000',
      tenure: '24 Months',
      creditScore: 745,
      foir: '42%',
      dscr: '1.45',
      kyc: 'VERIFIED',
      bre: 'PASSED',
      risk: 'MEDIUM',
      underwriting: 'IN_REVIEW',
      stageIndex: 7 // Underwriting Queue
    },
    'NX-10485': {
      id: 'NX-10485',
      name: 'Priya Sundaram',
      loanType: 'Loan Against Property',
      amount: '₹1,20,00,000',
      tenure: '120 Months',
      creditScore: 715,
      foir: '49%',
      dscr: '1.22',
      kyc: 'VERIFIED',
      bre: 'REVIEW',
      risk: 'MEDIUM',
      underwriting: 'CONDITIONAL',
      stageIndex: 6 // BRE Review
    }
  };

  const workflowStages = [
    'Lead', 'Application', 'KYC', 'Documents', 'Credit', 'Banking', 'BRE', 'Underwriting', 'Approval', 'KFS', 'Agreement', 'Disbursement'
  ];

  const current = apps[selectedApp];

  return (
    <section id="los" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <Workflow className="w-3.5 h-3.5 text-blue-600" />
            <span>LOAN ORIGINATION SYSTEM (LOS)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            FROM APPLICATION TO APPROVAL — WITHOUT THE FRICTION.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Automate end-to-end origination with sub-second credit decisioning, instant KFS generation, and digital eSign agreements.
          </p>
        </div>

        {/* 12-Stage Visual Stepper */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                12-Stage Connected Origination Lifecycle:
              </span>
            </div>

            {/* Application Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Select Demo Application:</span>
              {(['NX-10482', 'NX-10483', 'NX-10485'] as const).map((appId) => (
                <button
                  key={appId}
                  onClick={() => setSelectedApp(appId)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedApp === appId 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  #{appId}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2 text-center">
            {workflowStages.map((stageName, idx) => {
              const isPassed = idx < current.stageIndex;
              const isCurrent = idx === current.stageIndex;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col items-center justify-between min-h-[72px] ${
                    isCurrent 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md font-bold scale-105' 
                      : isPassed 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' 
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-mono">0{idx + 1}</span>
                  <span className="text-[11px] leading-tight font-medium my-1">{stageName}</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Application Detail Inspector Frame */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-5 space-y-3 border-r border-slate-800 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-blue-900 text-blue-200 px-2 py-0.5 rounded font-bold">
                  {current.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">Business Loan Origination</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">{current.name}</h3>
              <div className="text-2xl font-extrabold text-blue-400 font-mono">{current.amount}</div>
              <div className="text-xs text-slate-400">Tenure: {current.tenure} • Interest Rate: 12.85% p.a.</div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">KYC Status</span>
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{current.kyc}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Credit BRE</span>
                <div className={`font-bold flex items-center gap-1 ${
                  current.bre === 'PASSED' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <Zap className="w-3.5 h-3.5" />
                  <span>{current.bre}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Risk Grade</span>
                <div className={`font-bold flex items-center gap-1 ${
                  current.risk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{current.risk} RISK</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Underwriting</span>
                <div className={`font-bold flex items-center gap-1 ${
                  current.underwriting === 'APPROVED' ? 'text-emerald-400' : 'text-sky-400'
                }`}>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{current.underwriting}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
