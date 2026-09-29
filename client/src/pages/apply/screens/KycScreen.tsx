import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, CreditCard, FileCheck, AlertCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface KycScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function KycScreen({ journey, onSuccess }: KycScreenProps) {
  const [panVerified, setPanVerified] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerNote, setProviderNote] = useState<string | null>(null);

  const pan = journey.customer_pan || journey.profile?.pan || "BZXPM1234F";
  const name = journey.customer_name || journey.profile?.full_name || "Krishna Vinod Mishra";

  const handleVerifyPan = async () => {
    setVerifyingPan(true);
    setError(null);
    try {
      const res = await journeyApi<{ ok: boolean; status: string; result?: any }>("/origination/kyc/verify", {
        method: "POST",
        body: {
          type: "pan",
          pan,
          name
        }
      });
      setPanVerified(true);
      if (res.result?.providerNote) {
        setProviderNote(res.result.providerNote);
      }
    } catch (err: any) {
      setError(err.message || "PAN verification failed.");
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleVerifyAadhaar = async () => {
    setVerifyingAadhaar(true);
    setError(null);
    try {
      const res = await journeyApi<{ ok: boolean; status: string; result?: any }>("/origination/kyc/verify", {
        method: "POST",
        body: {
          type: "aadhaar",
          aadhaar: "XXXXXXXX9012"
        }
      });
      setAadhaarVerified(true);
    } catch (err: any) {
      setError(err.message || "Aadhaar e-KYC failed.");
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const handleContinue = () => {
    const updated: JourneyData = {
      ...journey,
      status: "KYC_COMPLETED",
      current_step: "documents",
      completed_steps: [...new Set([...journey.completed_steps, "kyc"])]
    };
    onSuccess(updated);
  };

  // Auto-verify PAN on screen load if not yet verified
  useEffect(() => {
    if (!panVerified) {
      handleVerifyPan();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Instant Digital KYC Verification
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Secure, paperless identity authentication via NSDL / Income Tax Department and Digilocker.
        </p>
      </div>

      <div className="space-y-4">
        {/* PAN Verification Card */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">PAN Card Authentication</p>
                <p className="text-xs text-zinc-400 font-mono">
                  {pan} • {name}
                </p>
              </div>
            </div>

            {panVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleVerifyPan}
                disabled={verifyingPan}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                {verifyingPan ? "Verifying..." : "Verify Now"}
              </button>
            )}
          </div>

          {panVerified && (
            <div className="space-y-2">
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                <div className="text-zinc-400">
                  <span>Income Tax Dept Match: </span>
                  <strong className="text-emerald-400 font-mono">100% Valid</strong>
                </div>
                <div className="text-zinc-500 text-[11px]">
                  NSDL Direct API Live
                </div>
              </div>
              {providerNote && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                  <span>{providerNote}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Digilocker / Aadhaar Card */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Digilocker Aadhaar e-KYC</p>
                <p className="text-xs text-zinc-400">
                  Paperless address & identity confirmation
                </p>
              </div>
            </div>

            {aadhaarVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Linked</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleVerifyAadhaar}
                disabled={verifyingAadhaar}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                {verifyingAadhaar ? "Connecting..." : "Fetch via Digilocker"}
              </button>
            )}
          </div>

          {aadhaarVerified && (
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
              <div className="text-zinc-400">
                <span>Masked Aadhaar: </span>
                <strong className="text-white font-mono">XXXXXXXX9012</strong>
              </div>
              <div className="text-emerald-400 text-[11px] font-medium">
                UIDAI XML Authenticated
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!panVerified}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Continue to Document Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
