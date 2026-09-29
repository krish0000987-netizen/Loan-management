import React, { useState, useEffect } from "react";
import { ArrowRight, FileText, CheckCircle2, ShieldCheck, Download, AlertCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface AgreementScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function AgreementScreen({ journey, onSuccess }: AgreementScreenProps) {
  const [sanction, setSanction] = useState<any>(null);
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [agreementHash, setAgreementHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initSanctionAndAgreement = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Sanction
      const sRes = await journeyApi<{ sanction: any }>("/origination/sanction");
      setSanction(sRes.sanction);

      // 2. Draft Agreement
      const aRes = await journeyApi<{
        ok: boolean;
        agreement_id: number;
        amount: number;
        hash: string;
      }>("/origination/agreement", {
        method: "POST"
      });
      setAgreementId(aRes.agreement_id);
      setAgreementHash(aRes.hash);
    } catch (err: any) {
      setError(err.message || "Failed to load sanction letter.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSanctionAndAgreement();
  }, []);

  const handleProceed = () => {
    const updated: JourneyData = {
      ...journey,
      sanction,
      status: "AGREEMENT_PENDING",
      current_step: "esign",
      completed_steps: [...new Set([...journey.completed_steps, "agreement"])]
    };
    onSuccess(updated);
  };

  const amount = sanction?.amount || journey.amount || 300000;
  const tenure = sanction?.tenure || journey.tenure || 36;
  const rate = sanction?.rate || 14.5;
  const emi = sanction?.emi || 10328;
  const totalRepayable = emi * tenure;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Sanction Letter & Key Fact Statement (KFS)
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          RBI Compliant digital disclosure. Please review your terms before proceeding to Aadhaar e-Sign.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-300 font-medium">Generating digital sanction letter...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Document Header */}
          <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  Sanction Approved
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Sanction Order #{sanction?.sanction_no || "SNC26-DIGITAL"}
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Application Ref: {journey.application_no || "APP-DIGITAL-01"}
                </p>
              </div>

              {agreementHash && (
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-zinc-500 font-mono">Document Integrity</p>
                  <p className="text-xs font-mono text-zinc-300 truncate max-w-[200px]">
                    {agreementHash}
                  </p>
                </div>
              )}
            </div>

            {/* Key Fact Statement Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Key Fact Statement (RBI Mandated Format)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Sanctioned Amount</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    ₹{amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Annualized Rate (APR)</span>
                  <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {rate}% p.a.
                  </p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Tenure</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    {tenure} Months
                  </p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Monthly EMI</span>
                  <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    ₹{emi.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Total Repayment</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    ₹{totalRepayable.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Foreclosure Fee</span>
                  <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    NIL (0%)
                  </p>
                </div>
              </div>
            </div>

            {/* Repayment Schedule Preview */}
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <p className="text-xs font-semibold text-zinc-400">
                Amortization Schedule Preview (First 3 Months)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="pb-1.5 font-medium">Inst #</th>
                      <th className="pb-1.5 font-medium">Due Date</th>
                      <th className="pb-1.5 font-medium">Principal</th>
                      <th className="pb-1.5 font-medium">Interest</th>
                      <th className="pb-1.5 font-medium">Total Installment</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300 divide-y divide-zinc-800/60 font-mono">
                    {[1, 2, 3].map((num) => (
                      <tr key={num}>
                        <td className="py-2">Month {num}</td>
                        <td className="py-2">05-Next Mo</td>
                        <td className="py-2">₹{Math.round(emi * 0.65).toLocaleString("en-IN")}</td>
                        <td className="py-2 text-indigo-400">₹{Math.round(emi * 0.35).toLocaleString("en-IN")}</td>
                        <td className="py-2 font-bold text-white">₹{emi.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            onClick={handleProceed}
            className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Accept Terms & Proceed to Digital E-Sign</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
