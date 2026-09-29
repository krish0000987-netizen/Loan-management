import React, { useState } from "react";
import { ArrowRight, FileCheck, CheckCircle2, ShieldCheck, PenTool, AlertCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface EsignScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function EsignScreen({ journey, onSuccess }: EsignScreenProps) {
  const [aadhaarLast4, setAadhaarLast4] = useState("9012");
  const [aadhaarOtp, setAadhaarOtp] = useState("123456");
  const [consentChecked, setConsentChecked] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signerName = journey.customer_name || journey.profile?.full_name || "Applicant";

  const handleSign = async () => {
    if (!consentChecked) {
      setError("Please check the legal e-sign authorization checkbox.");
      return;
    }

    setSigning(true);
    setError(null);
    try {
      const res = await journeyApi<{
        ok: boolean;
        status: string;
        signed_at: string;
        signer: string;
        next_step: string;
      }>("/origination/esign/start", {
        method: "POST"
      });

      setSigned(true);

      const updated: JourneyData = {
        ...journey,
        status: "ESIGN_COMPLETED",
        current_step: "disbursement",
        completed_steps: [...new Set([...journey.completed_steps, "esign"])]
      };

      setTimeout(() => {
        onSuccess(updated);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "E-Sign execution failed.");
      setSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <PenTool className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Aadhaar OTP Based Digital E-Sign
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Legally binding digital signature under Section 3A of the Information Technology Act 2000.
        </p>
      </div>

      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Signer Legal Name</span>
            <span className="font-bold text-white">{signerName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Document Type</span>
            <span className="text-emerald-400 font-mono">Digital Loan Agreement v1</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Application Number</span>
            <span className="font-mono text-white">{journey.application_no || "APP-DIGITAL-01"}</span>
          </div>
        </div>

        {/* Aadhaar Input Simulation */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Aadhaar Linked Mobile Verification Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={aadhaarOtp}
                onChange={(e) => setAadhaarOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 text-center">
              (Demo simulation auto-fills sample UIDAI OTP: 123456)
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            <input
              type="checkbox"
              id="esign-consent"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-zinc-800 border-zinc-700"
            />
            <label htmlFor="esign-consent" className="text-[11px] text-zinc-400 leading-relaxed cursor-pointer">
              I hereby authorize Digitap / NSDL to authenticate my Aadhaar credentials and affix my electronic signature to the Loan Agreement.
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSign}
          disabled={signing || signed}
          className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {signing ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Executing Digital E-Sign via UIDAI...
            </span>
          ) : signed ? (
            <span className="inline-flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
              <span>Agreement Signed Successfully!</span>
            </span>
          ) : (
            <>
              <span>Sign Contract & Request Disbursement</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
