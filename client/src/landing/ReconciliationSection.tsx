import React, { useState } from 'react';
import { MOCK_RECONCILIATION_PAYMENTS } from '../data/mockData';
import { UnreconciledPayment } from '../types';
import { CreditCard, Check, X, AlertTriangle, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ReconciliationSection: React.FC = () => {
  const [payments, setPayments] = useState<UnreconciledPayment[]>(MOCK_RECONCILIATION_PAYMENTS);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const handleMatch = (id: string) => {
    setMatchingId(id);
    setTimeout(() => {
      setPayments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'MATCHED' } : item))
      );
      setMatchingId(null);
    }, 800);
  };

  const handleReject = (id: string) => {
    setPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
    );
  };

  const handleException = (id: string) => {
    setPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'EXCEPTIONAL' } : item))
    );
  };

  return (
    <section id="reconciliation" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI PAYMENT RECONCILIATION ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            STOP CHASING UNMATCHED PAYMENTS.
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Automated UTR matching links incoming bank transfers directly to borrower loan accounts with 98.7% accuracy and single-click exception resolution.
          </p>
        </div>

        {/* Interactive Table Container */}
        <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 lg:p-8 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Unreconciled Bank Transactions Queue</h3>
                <p className="text-xs text-slate-400">12 Pending Review • High Confidence Match Suggestions</p>
              </div>
            </div>

            <div className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              Automated Rule Confidence &gt; 90%
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                  <th className="py-3 px-4">Amount & Channel</th>
                  <th className="py-3 px-4">Bank Ref UTR</th>
                  <th className="py-3 px-4">Candidate Loan & Borrower</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((item) => {
                  const isMatching = matchingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        <div className="text-sm text-emerald-400">₹{item.amount.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.channel}</div>
                      </td>

                      <td className="py-4 px-4 text-blue-300 font-bold">
                        {item.utr}
                        <div className="text-[10px] text-slate-400 font-normal">{item.date}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-white font-bold">{item.candidateBorrower}</div>
                        <div className="text-[10px] text-blue-400">Target Loan: #{item.candidateLoanId}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400">{item.confidenceScore}%</span>
                          <span className="text-[10px] text-slate-400">Match</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {item.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                            REQUIRES REVIEW
                          </span>
                        )}
                        {item.status === 'MATCHED' && (
                          <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            MATCHED & POSTED
                          </span>
                        )}
                        {item.status === 'EXCEPTIONAL' && (
                          <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                            EXCEPTION CREATED
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                            REJECTED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {item.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleMatch(item.id)}
                              disabled={isMatching}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow"
                            >
                              {isMatching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              <span>MATCH</span>
                            </button>
                            <button
                              onClick={() => handleException(item.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              EXCEPTION
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-normal">Reconciled in Ledger</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </section>
  );
};
