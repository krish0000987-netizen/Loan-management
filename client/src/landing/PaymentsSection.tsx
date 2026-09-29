import React from 'react';
import { CreditCard, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw, Landmark, Zap } from 'lucide-react';

export const PaymentsSection: React.FC = () => {
  return (
    <section id="payments" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAYMENTS & DISBURSEMENT CONTROL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            EVERY PAYMENT. EVERY TRANSACTION. ONE CONTROL CENTER.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Real-time disbursement APIs, eNACH recurring auto-debit processing, UPI gateway links, and zero-drift ledger settlement.
          </p>
        </div>

        {/* Payment Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Collections</span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">₹2.84 Cr</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>98.7% Direct Match</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Matched</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">98.7%</div>
            <div className="text-xs text-slate-500 mt-1">1,840 Transactions</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unmatched Items</span>
            <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1">12</div>
            <div className="text-xs text-amber-700 font-medium mt-1">Requires Review</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Debits</span>
            <div className="text-2xl font-extrabold text-rose-600 font-mono mt-1">4</div>
            <div className="text-xs text-rose-600 mt-1">Auto Retry Queued</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reversals / Refunds</span>
            <div className="text-2xl font-extrabold text-slate-700 font-mono mt-1">2</div>
            <div className="text-xs text-slate-500 mt-1">Reconciled</div>
          </div>
        </div>

        {/* Animated Payment Pipeline Flow */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Automated 6-Stage Payment & Settlement Lifecycle</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded">
              REAL-TIME PROCESSING
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center font-mono text-xs">
            {[
              { stage: '1. BANK / GATEWAY', desc: 'HDFC / Razorpay / eNACH' },
              { stage: '2. STATEMENT IMPORT', desc: 'Real-time API & MT940' },
              { stage: '3. UTR MATCHING', desc: 'Rule Engine + AI Confidence' },
              { stage: '4. RECONCILIATION', desc: 'Loan & Borrower Binding' },
              { stage: '5. LEDGER POSTING', desc: 'Principal/Interest Alloc' },
              { stage: '6. IMMUTABLE AUDIT', desc: 'Event Sourcing Trail' }
            ].map((step, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-blue-400">{step.stage}</div>
                <div className="text-[10px] text-slate-400">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
