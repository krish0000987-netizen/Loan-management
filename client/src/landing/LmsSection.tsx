import React, { useState } from 'react';
import { Layers, Calendar, CheckCircle2, TrendingUp, DollarSign, Clock, ArrowRight } from 'lucide-react';

export const LmsSection: React.FC = () => {
  const [selectedEmi, setSelectedEmi] = useState(18);

  const schedule = [
    { emiNo: 16, dueDate: '05 Jun 2026', principal: 41820, interest: 9180, total: 51000, status: 'PAID', utr: 'UTR901248102' },
    { emiNo: 17, dueDate: '05 Jul 2026', principal: 42320, interest: 8680, total: 51000, status: 'PAID', utr: 'UTR901824190' },
    { emiNo: 18, dueDate: '05 Aug 2026', principal: 42840, interest: 8160, total: 51000, status: 'DUE TODAY', utr: 'PENDING' },
    { emiNo: 19, dueDate: '05 Sep 2026', principal: 43380, interest: 7620, total: 51000, status: 'UPCOMING', utr: 'SCHEDULED' },
    { emiNo: 20, dueDate: '05 Oct 2026', principal: 43920, interest: 7080, total: 51000, status: 'UPCOMING', utr: 'SCHEDULED' }
  ];

  return (
    <section id="lms" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>LOAN MANAGEMENT SYSTEM (LMS)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            FROM DISBURSEMENT TO FINAL REPAYMENT.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Real-time loan accounting engine with dynamic amortization, principal/interest allocation, penalty accrual, subvention management, and zero accounting drift.
          </p>
        </div>

        {/* Servicing Dashboard */}
        <div className="bg-slate-900 text-white p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-8">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400">Total Sanctioned Principal</span>
              <div className="text-xl font-extrabold text-white mt-1">₹25,00,000</div>
              <div className="text-[11px] text-slate-400 mt-1">Product: MSME Loan</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400">Outstanding Principal</span>
              <div className="text-xl font-extrabold text-blue-400 mt-1">₹14,82,400</div>
              <div className="text-[11px] text-emerald-400 mt-1">17 EMIs Repaid</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400">Next EMI Amount</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">₹51,000</div>
              <div className="text-[11px] text-amber-400 mt-1">Due: 05 Aug (Today)</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400">DPD Status</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">0 DPD</div>
              <div className="text-[11px] text-emerald-400 mt-1">Perfect Track Record</div>
            </div>
          </div>

          {/* Repayment Schedule Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Active Amortization Schedule (EMI #16 to #20)</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">Fixed Rate: 12.85% p.a. Reducing Balance</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                    <th className="py-2.5 px-3">EMI #</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Principal</th>
                    <th className="py-2.5 px-3">Interest</th>
                    <th className="py-2.5 px-3">Total EMI</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reference UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {schedule.map((item) => (
                    <tr 
                      key={item.emiNo}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        item.emiNo === 18 ? 'bg-blue-950/60 font-bold border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-white">EMI #{item.emiNo}</td>
                      <td className="py-3 px-3 text-slate-300">{item.dueDate}</td>
                      <td className="py-3 px-3 text-blue-400">₹{item.principal.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-slate-400">₹{item.interest.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-white font-bold">₹{item.total.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        {item.status === 'PAID' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            PAID
                          </span>
                        )}
                        {item.status === 'DUE TODAY' && (
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 animate-pulse">
                            DUE TODAY
                          </span>
                        )}
                        {item.status === 'UPCOMING' && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            SCHEDULED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{item.utr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
