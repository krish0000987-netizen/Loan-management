import React from "react";
import { ShieldCheck, Lock, PhoneCall, RefreshCw, LogOut, CheckCircle2 } from "lucide-react";
import type { JourneyData, JourneyStep } from "./types";

interface ApplyLayoutProps {
  journey: JourneyData | null;
  currentStep: JourneyStep;
  children: React.ReactNode;
  onReset?: () => void;
  loading?: boolean;
}

const STEP_ORDER: { step: JourneyStep; label: string }[] = [
  { step: "mobile", label: "Mobile" },
  { step: "otp", label: "Verify" },
  { step: "consent", label: "Consent" },
  { step: "profile", label: "Profile" },
  { step: "kyc", label: "KYC" },
  { step: "documents", label: "Docs" },
  { step: "credit", label: "Bureau" },
  { step: "offers", label: "Offers" },
  { step: "confirm", label: "Review" },
  { step: "agreement", label: "KFS" },
  { step: "esign", label: "E-Sign" },
  { step: "disbursement", label: "Payout" },
];

export function ApplyLayout({ journey, currentStep, children, onReset, loading }: ApplyLayoutProps) {
  const currentIdx = STEP_ORDER.findIndex((s) => s.step === currentStep);
  const progressPct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / STEP_ORDER.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#0d1117] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 text-base">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-white text-base">SNIPER</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  INSTANT LOANS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Digital Lending Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBI Regulated NBFC</span>
            </div>

            {journey?.masked_mobile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-700 font-mono">
                  {journey.masked_mobile}
                </span>
                {onReset && (
                  <button
                    onClick={onReset}
                    title="Exit / New Application"
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        {currentIdx >= 0 && currentStep !== "success" && (
          <div className="w-full bg-zinc-800/60 h-1 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </header>

      {/* Quick Step Indicators (Mobile-friendly condensed) */}
      {currentIdx >= 0 && currentStep !== "success" && currentStep !== "dashboard" && (
        <div className="max-w-3xl mx-auto w-full px-4 pt-4 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-[11px]">
              {currentIdx + 1}
            </span>
            <span className="font-medium text-zinc-200">
              {STEP_ORDER[currentIdx]?.label || "Origination"}
            </span>
            <span className="text-zinc-500">of {STEP_ORDER.length}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>256-Bit Bank Grade Encryption</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 flex flex-col justify-center max-w-3xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-xs tracking-wide">Syncing journey state...</p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-[#0d1117] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant Sanction
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Foreclosure Charges
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Paperless Digital Process
            </span>
          </div>
          <p className="text-[11px] text-zinc-600">
            SNIPER Lending OS is an authorized digital origination partner for RBI-registered Banks & NBFCs.
            Loans are subject to credit bureau verification and lender underwriting criteria.
          </p>
        </div>
      </footer>
    </div>
  );
}
