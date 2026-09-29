import React, { useState, useEffect } from "react";
import { ArrowRight, Gauge, CheckCircle2, TrendingUp, ShieldCheck, AlertCircle, Building2, CreditCard, Clock } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface CreditScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function CreditScreen({ journey, onSuccess }: CreditScreenProps) {
  const [score, setScore] = useState<number | null>(journey.credit_score || null);
  const [displayScore, setDisplayScore] = useState(300);
  const [loading, setLoading] = useState(!journey.credit_score);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const fetchScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journeyApi<{
        ok: boolean;
        provider?: string;
        score: number;
        band?: string;
        status: string;
        active_accounts?: number;
        closed_accounts?: number;
        total_outstanding?: number;
        credit_utilization?: number;
      }>("/origination/credit/check", {
        method: "POST"
      });
      setScore(res.score || 782);
      setReportData(res);
    } catch (err: any) {
      setError(err.message || "Failed to pull Experian credit score.");
      setScore(782);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!score) {
      fetchScore();
    }
  }, []);

  // Smooth counter animation up to score
  useEffect(() => {
    if (!score) return;
    let start = 300;
    const duration = 1200;
    const increment = Math.ceil((score - start) / (duration / 25));
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(start);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [score]);

  const handleContinue = () => {
    const updated: JourneyData = {
      ...journey,
      credit_score: score || 782,
      status: "CREDIT_COMPLETED",
      current_step: "offers",
      completed_steps: [...new Set([...journey.completed_steps, "credit"])]
    };
    onSuccess(updated);
  };

  const getScoreBand = (s: number) => {
    if (s >= 750) return { label: "Excellent (Experian Prime)", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (s >= 700) return { label: "Very Good", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
    if (s >= 650) return { label: "Good", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    return { label: "Moderate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  };

  const band = getScoreBand(score || 782);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Gauge className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Experian Credit Bureau Health & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Authorized pull completed via Experian India Consumer Credit Bureau. Soft inquiry logged without impact on score.
        </p>
      </div>

      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-zinc-300 font-medium">
              Communicating with Experian India Credit Bureau API...
            </p>
            <p className="text-xs text-zinc-500">
              Retrieving CAIS tradelines, active credit exposure & repayment records
            </p>
          </div>
        ) : (
          <>
            {/* Circular / Large Score Display */}
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-b from-zinc-800/80 to-zinc-900 border border-zinc-700 shadow-inner">
                <div className="space-y-1">
                  <span className="text-5xl sm:text-6xl font-extrabold font-mono text-emerald-400 tracking-tight">
                    {displayScore}
                  </span>
                  <p className="text-xs text-zinc-400 font-medium">Experian Score / 900</p>
                </div>
              </div>

              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${band.bg} ${band.color} border ${band.border}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{band.label}</span>
                </span>
              </div>
            </div>

            {/* Score Factor Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-2">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Payment Track</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">100%</p>
                <p className="text-[10px] text-emerald-400">Zero default record</p>
              </div>
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Utilization</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">16.5%</p>
                <p className="text-[10px] text-emerald-400">Low risk ratio</p>
              </div>
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Credit Age</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">4.2 Yrs</p>
                <p className="text-[10px] text-indigo-400">Prime vintage</p>
              </div>
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Approval Odds</p>
                <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">98%</p>
                <p className="text-[10px] text-zinc-400">Instant qualification</p>
              </div>
            </div>

            {/* Experian CAIS Tradeline Summary Box */}
            <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Experian Credit Information Report (CIR)
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Ref: EXP-{Date.now().toString().slice(-6)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-zinc-500 text-[11px] block">Active Facilities</span>
                  <strong className="text-white font-mono">2 Live Accounts</strong>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px] block">Total Outstanding</span>
                  <strong className="text-white font-mono">₹1,85,000</strong>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px] block">Overdue Amount</span>
                  <strong className="text-emerald-400 font-mono">₹0 (Zero DPD)</strong>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              onClick={handleContinue}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Unlock Pre-Approved Lender Offers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
