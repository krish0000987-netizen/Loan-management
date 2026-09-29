import React from 'react';
import { MOCK_COLLECTIONS } from '../data/mockData';
import { Receipt, AlertTriangle, PhoneCall, MapPin, CheckCircle2, TrendingUp } from 'lucide-react';

export const CollectionsSection: React.FC = () => {
  return (
    <section id="collections" className="py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>INTELLIGENT COLLECTIONS & RECOVERY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            MAKE COLLECTIONS MORE INTELLIGENT.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            DPD risk segmentation, automated WhatsApp PTP payment link dispatch, field-agent route optimization, and settlement matrix governance.
          </p>
        </div>

        {/* Collections Dashboard Frame */}
        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8">
          
          {/* Target Progress Bar */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase">Today's Collections Target vs Actual</span>
              <span className="text-emerald-400 font-bold">79% ACHIEVED (₹94.8 Lakhs / ₹1.2 Crore)</span>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000 w-[79%]" />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Remaining Target: ₹25.2 Lakhs</span>
              <span>18 Active Agents Online</span>
            </div>
          </div>

          {/* DPD Queue Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Delinquency Queue & PTP Tracker
              </h3>
              <span className="text-xs font-mono text-slate-500">Demo Environment Values</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-3 px-4">Borrower & Loan</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">DPD Bucket</th>
                    <th className="py-3 px-4">PTP Date & Amount</th>
                    <th className="py-3 px-4">Last Collection Action</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_COLLECTIONS.map((col) => (
                    <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{col.borrowerName}</div>
                        <div className="text-[10px] text-blue-600">Loan #{col.loanId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{col.outstandingAmount.toLocaleString('en-IN')}
                        <div className="text-[10px] text-slate-400 font-normal">EMI: ₹{col.emiAmount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          col.dpdDays <= 30 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {col.dpdDays} DPD ({col.bucket})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{col.ptpDate}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">₹{col.ptpAmount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {col.lastAction}
                      </td>
                      <td className="py-3.5 px-4">
                        {col.status === 'PTP_KEPT' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            PTP AGREED
                          </span>
                        )}
                        {col.status === 'PTP_BROKEN' && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                            BROKEN PTP
                          </span>
                        )}
                        {col.status === 'FIELD_ASSIGNED' && (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                            FIELD VISITED
                          </span>
                        )}
                      </td>
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
