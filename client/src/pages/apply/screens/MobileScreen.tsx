import React, { useState } from "react";
import { ArrowRight, Sparkles, Shield, Calculator, CheckCircle } from "lucide-react";
import { journeyApi, setJourneyToken } from "../../../lib/api";
import type { JourneyData } from "../types";

interface MobileScreenProps {
  onSuccess: (data: JourneyData, demoOtp?: string) => void;
}

export function MobileScreen({ onSuccess }: MobileScreenProps) {
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState(300000);
  const [tenure, setTenure] = useState(36);
  const [purpose, setPurpose] = useState("Personal Expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reducing balance EMI estimation at nominal 13.5%
  const ratePerMonth = 13.5 / 12 / 100;
  const estimatedEmi = Math.round(
    (amount * ratePerMonth * Math.pow(1 + ratePerMonth, tenure)) /
      (Math.pow(1 + ratePerMonth, tenure) - 1)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await journeyApi<{
        journey_id: number;
        token: string;
        masked_mobile: string;
        status: string;
        current_step: string;
        demo_otp?: string;
      }>("/origination/mobile/start", {
        method: "POST",
        body: {
          mobile: cleanMobile,
          amount,
          tenure,
          purpose,
          source: "digital"
        }
      });

      const token = (res as any).journey_token || res.token || String(res.journey_id);
      setJourneyToken(token);

      const journey: JourneyData = {
        id: (res as any).id || (res as any).journey_id,
        journey_id: (res as any).journey_id || (res as any).id,
        token,
        mobile: cleanMobile,
        masked_mobile: res.masked_mobile,
        status: res.status,
        current_step: res.current_step,
        completed_steps: ["mobile"],
        amount,
        tenure,
        purpose
      };

      onSuccess(journey, res.demo_otp);
    } catch (err: any) {
      setError(err.message || "Failed to start application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Paperless Approval in Under 3 Minutes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Get Instant Loan up to ₹10 Lakhs
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Low interest rates starting from 10.5% p.a. • Instant bank transfer upon approval
        </p>
      </div>

      {/* Main Interactive Form Card */}
      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Loan Amount Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Loan Amount Needed
            </label>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              ₹{amount.toLocaleString("en-IN")}
            </div>
          </div>
          <input
            type="range"
            min={50000}
            max={1000000}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>₹50,000</span>
            <span>₹5,00,000</span>
            <span>₹10,00,000</span>
          </div>
        </div>

        {/* Tenure Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Tenure (Months)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[12, 24, 36, 48, 60].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenure(t)}
                className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                  tenure === t
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                    : "bg-zinc-800/60 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                {t} Mo
              </button>
            ))}
          </div>
        </div>

        {/* Live Estimated EMI Callout */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Estimated Monthly EMI</p>
              <p className="text-lg font-bold text-white font-mono">₹{estimatedEmi.toLocaleString("en-IN")}/mo</p>
            </div>
          </div>
          <div className="text-right text-[11px] text-zinc-500">
            <span>@ 13.5% reducing ROI</span>
            <br />
            <span>Zero hidden charges</span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Mobile Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 text-sm font-medium border-r border-zinc-700 pr-2">
                +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10-digit mobile"
                className="w-full pl-16 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-base tracking-wide font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              We'll send a 6-digit verification code to this number.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Loan Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Personal Expense">Personal Expense</option>
              <option value="Debt Consolidation">Debt Consolidation</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Home Improvement">Home Improvement</option>
              <option value="Education">Higher Education</option>
              <option value="Business Expansion">Business Growth</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || mobile.length !== 10}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending OTP...
              </span>
            ) : (
              <>
                <span>Check Eligibility & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-[#161b22] border border-zinc-800 rounded-xl">
          <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-[11px] font-medium text-zinc-300">Safe & Secure</p>
          <p className="text-[10px] text-zinc-500">256-bit encryption</p>
        </div>
        <div className="p-3 bg-[#161b22] border border-zinc-800 rounded-xl">
          <CheckCircle className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <p className="text-[11px] font-medium text-zinc-300">Fast Approval</p>
          <p className="text-[10px] text-zinc-500">Instant digital check</p>
        </div>
        <div className="p-3 bg-[#161b22] border border-zinc-800 rounded-xl">
          <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <p className="text-[11px] font-medium text-zinc-300">Best Offers</p>
          <p className="text-[10px] text-zinc-500">Multi-lender match</p>
        </div>
      </div>
    </div>
  );
}
