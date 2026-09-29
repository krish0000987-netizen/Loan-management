import React, { useState } from "react";
import { ArrowRight, FileCheck, Shield, Building2, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface ConfirmScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function ConfirmScreen({ journey, onSuccess }: ConfirmScreenProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOffer =
    journey.offers?.find((o) => o.lender_id === journey.selected_lender_id) ||
    journey.offers?.[0];

  const amount = journey.amount || 300000;
  const tenure = journey.tenure || 36;
  const roi = selectedOffer?.roi_pct || 14.5;
  const processingFee = Math.round((amount * (selectedOffer?.processing_fee_pct || 2)) / 100);
  const gst = Math.round(processingFee * 0.18);
  const totalFees = processingFee + gst;
  const netDisbursal = amount - totalFees;

  const ratePerMonth = roi / 12 / 100;
  const emi = Math.round(
    (amount * ratePerMonth * Math.pow(1 + ratePerMonth, tenure)) /
      (Math.pow(1 + ratePerMonth, tenure) - 1)
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await journeyApi<{
        application_id: number;
        application_no: string;
        status: string;
        next_step: string;
      }>("/origination/application/submit", {
        method: "POST"
      });

      const updated: JourneyData = {
        ...journey,
        application_id: res.application_id,
        application_no: res.application_no,
        status: "APPLICATION_SUBMITTED",
        current_step: "agreement",
        completed_steps: [...new Set([...journey.completed_steps, "confirm"])]
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Failed to submit loan application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FileCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Review & Submit Application
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Verify your loan terms before formal submission. Your formal sanction letter and Key Fact Statement will be generated instantly.
        </p>
      </div>

      <div className="space-y-4">
        {/* Selected Lender Card */}
        {selectedOffer && (
          <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400">Chosen Financing Partner</p>
                <p className="text-sm font-bold text-white">{selectedOffer.lender_name}</p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              {selectedOffer.scheme_name}
            </span>
          </div>
        )}

        {/* Loan Financial Details */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-3">
            Loan Financial Breakdown
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Sanctioned Loan Amount</span>
              <span className="font-bold text-white font-mono">
                ₹{amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Tenure</span>
              <span className="font-medium text-white">{tenure} Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Annual Reducing Interest Rate (APR)</span>
              <span className="font-medium text-emerald-400 font-mono">{roi}% p.a.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Monthly Equated Installment (EMI)</span>
              <span className="font-bold text-emerald-400 font-mono">
                ₹{emi.toLocaleString("en-IN")} / month
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800/80 pt-2 text-xs">
              <span className="text-zinc-500">Processing Fee (incl. 18% GST)</span>
              <span className="text-zinc-400 font-mono">₹{totalFees.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-300">
                Net Estimated Bank Disbursal
              </span>
              <span className="text-sm font-bold text-white font-mono">
                ₹{netDisbursal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Applicant Snapshot */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-3">
            Applicant Verification Snapshot
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-zinc-500">Applicant Name</p>
              <p className="font-medium text-white">{journey.customer_name || journey.profile?.full_name || "Rahul Sharma"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Registered Mobile</p>
              <p className="font-mono text-white">{journey.masked_mobile}</p>
            </div>
            <div>
              <p className="text-zinc-500">Verified PAN</p>
              <p className="font-mono text-white">{journey.customer_pan || journey.profile?.pan || "ABCDE1234F"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Employment</p>
              <p className="font-medium text-white capitalize">{journey.profile?.employment_type || "Salaried"}</p>
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
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Canonical Application Record...
            </span>
          ) : (
            <>
              <span>Submit & Generate Sanction Letter</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
