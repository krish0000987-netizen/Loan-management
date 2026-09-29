import React from "react";
import { CheckCircle2, Download, ExternalLink, ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { JourneyData } from "../types";

interface SuccessScreenProps {
  journey: JourneyData;
  onViewDashboard?: () => void;
}

export function SuccessScreen({ journey, onViewDashboard }: SuccessScreenProps) {
  const navigate = useNavigate();
  const disb = journey.disbursement;
  const loanNo = disb?.loan_no || "LN26-DIGITAL";
  const utr = disb?.utr || "UTR" + Date.now();
  const amount = disb?.amount || journey.amount || 300000;
  const emiDate = disb?.first_emi_date || "05-Next Month";

  return (
    <div className="space-y-6 text-center">
      {/* Celebration Icon */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fund Transfer Complete</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Congratulations! ₹{amount.toLocaleString("en-IN")} Disbursed
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            The funds have been credited directly into your verified bank account via instant IMPS payout rails.
          </p>
        </div>
      </div>

      {/* Loan Credentials Card */}
      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl text-left space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-3">
          Canonical LMS Loan Record
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-500">Loan Account Number</p>
            <p className="text-base font-bold text-white font-mono mt-0.5">{loanNo}</p>
          </div>

          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-500">Bank IMPS UTR Reference</p>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5 truncate">{utr}</p>
          </div>

          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-500">First Installment Due Date</p>
            <p className="text-sm font-bold text-white font-mono mt-0.5">{emiDate}</p>
          </div>

          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-500">Credited Bank Account</p>
            <p className="text-sm font-bold text-zinc-300 font-mono mt-0.5">
              {disb?.account_number ? `••••${disb.account_number.slice(-4)}` : "Verified Bank A/C"}
            </p>
          </div>
        </div>

        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            This loan account is registered on the SNIPER single-source-of-truth LMS ledger. Repayments will automatically update your credit score.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => {
            if (onViewDashboard) {
              onViewDashboard();
            } else {
              navigate("/portal");
            }
          }}
          className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>View Loan in Customer Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
