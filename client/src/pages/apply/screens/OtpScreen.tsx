import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, RefreshCw, KeyRound, AlertCircle, ShieldCheck } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface OtpScreenProps {
  journey: JourneyData;
  initialDemoOtp?: string;
  onSuccess: (updatedJourney: JourneyData) => void;
  onBack: () => void;
}

export function OtpScreen({ journey, initialDemoOtp, onSuccess, onBack }: OtpScreenProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [demoCode, setDemoCode] = useState<string | undefined>(initialDemoOtp);
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDemoCode(initialDemoOtp);
  }, [initialDemoOtp]);

  useEffect(() => {
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleAutofill = (code: string) => {
    const clean = code.replace(/\D/g, "").slice(0, 6);
    const split = clean.padEnd(6, " ").slice(0, 6).split("");
    setDigits(split);
    inputRefs.current[5]?.focus();
  };

  const handleChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const copy = [...digits];
      copy[index] = "";
      setDigits(copy);
      return;
    }

    if (clean.length > 1) {
      // Paste handling
      const pasted = clean.slice(0, 6).split("");
      const copy = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < 6) copy[index + i] = d;
      });
      setDigits(copy);
      const nextIdx = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const copy = [...digits];
    copy[index] = clean[0];
    setDigits(copy);

    if (index < 5 && clean.length > 0) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await journeyApi<{
        ok: boolean;
        status: string;
        current_step: string;
        next_step: string;
        journey?: any;
        applicant_name?: string;
        credit_score?: number;
        profile?: any;
        bureau?: any;
      }>("/origination/otp/verify", {
        method: "POST",
        body: {
          journey_id: journey.id,
          otp
        }
      });

      const updated: JourneyData = {
        ...journey,
        customer_name: res.applicant_name || journey.customer_name,
        customer_pan: res.profile?.pan || journey.customer_pan,
        credit_score: res.credit_score || journey.credit_score,
        profile: res.profile || journey.profile,
        status: res.status,
        current_step: res.next_step || "consent",
        completed_steps: [...new Set([...journey.completed_steps, "otp"])]
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await journeyApi<{ ok: boolean; demo_otp?: string }>("/origination/otp/send", {
        method: "POST",
        body: { journey_id: journey.id }
      });
      if (res.demo_otp) {
        setDemoCode(res.demo_otp);
      } else {
        setDemoCode(undefined);
      }
      setTimer(45);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please wait.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Change Mobile Number</span>
      </button>

      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Verify Your Mobile Number
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Enter the 6-digit OTP sent via SMS to{" "}
            <span className="font-mono text-white font-medium">{journey.masked_mobile || journey.mobile}</span>
          </p>
        </div>

        {/* Secure Delivery Notification */}
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-medium text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>SMS OTP Dispatched via Telecom</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            A 6-digit verification code has been dispatched via telecom gateway to{" "}
            <strong className="text-white font-mono">{journey.masked_mobile || journey.mobile}</strong>.
          </p>
        </div>

        {/* Instant Demo OTP Auto-fill helper (shown only when demo code returned) */}
        {demoCode && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-emerald-400">
                  Verification Code: <span className="font-mono text-white text-sm tracking-wider font-bold">{demoCode}</span>
                </p>
                <p className="text-[11px] text-zinc-400">Enter code above or click to auto-fill.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleAutofill(demoCode)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 cursor-pointer transition-all active:scale-95 flex items-center gap-1"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-mono font-bold bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || digits.join("").length !== 6}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Code...
              </span>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>

        {/* Resend Timer */}
        <div className="pt-2 text-xs text-zinc-400 flex items-center justify-center gap-2">
          {timer > 0 ? (
            <span>Resend code in <strong className="text-white font-mono">{timer}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>Resend OTP SMS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
