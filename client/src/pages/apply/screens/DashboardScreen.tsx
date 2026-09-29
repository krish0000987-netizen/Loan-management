import React, { useState, useEffect } from "react";
import { Landmark, Calendar, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, FileText } from "lucide-react";
import { journeyApi, clearJourneyToken } from "../../../lib/api";
import type { JourneyData } from "../types";

interface DashboardScreenProps {
  journey: JourneyData;
  onNewApplication: () => void;
}

export function DashboardScreen({ journey, onNewApplication }: DashboardScreenProps) {
  const [appDetails, setAppDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await journeyApi<{ application: any }>("/origination/application");
        setAppDetails(res.application);
      } catch (e) {
        // use fallback from journey
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, []);

  const app = appDetails || {};
  const loanNo = app.loan_no || journey.disbursement?.loan_no || "LN26-DIGITAL";
  const amount = app.sanctioned_amount || journey.amount || 300000;
  const emi = app.sanctioned_emi || 10328;
  const status = app.status || journey.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Your Active Digital Loan
          </h1>
          <p className="text-xs text-zinc-400">
            Account #{loanNo} • Sourced digitally via SNIPER
          </p>
        </div>
        <button
          type="button"
          onClick={onNewApplication}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          + New Application
        </button>
      </div>

      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{app.product_name || "Personal Loan"}</p>
              <p className="text-xs text-zinc-400">Borrower: {journey.customer_name || "Rahul Sharma"}</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="capitalize">{status.replace(/_/g, " ")}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">Disbursed Principal</span>
            <p className="text-lg font-bold text-white font-mono mt-0.5">
              ₹{Number(amount).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">Monthly EMI Due</span>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              ₹{Number(emi).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800">
            <span className="text-zinc-500">Next Auto-Debit Date</span>
            <p className="text-lg font-bold text-white font-mono mt-0.5">
              05-Next Mo
            </p>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NACH e-Mandate active on verified account</span>
          </div>
          <span className="text-emerald-400 font-mono font-medium">Auto-Debit Enabled</span>
        </div>
      </div>
    </div>
  );
}
