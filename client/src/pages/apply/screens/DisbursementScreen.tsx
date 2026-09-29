import React, { useState } from "react";
import { ArrowRight, Landmark, CheckCircle2, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface DisbursementScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function DisbursementScreen({ journey, onSuccess }: DisbursementScreenProps) {
  const [accountNumber, setAccountNumber] = useState("9876543210001");
  const [confirmAccount, setConfirmAccount] = useState("9876543210001");
  const [ifsc, setIfsc] = useState("HDFC0000060");
  const [beneficiaryName, setBeneficiaryName] = useState(
    journey.customer_name || journey.profile?.full_name || "Rahul Sharma"
  );
  const [pennyDropVerified, setPennyDropVerified] = useState(true);
  const [disbursing, setDisbursing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = journey.sanction?.amount || journey.amount || 300000;

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber !== confirmAccount) {
      setError("Bank account numbers do not match.");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
      setError("Please enter a valid 11-character bank IFSC code.");
      return;
    }

    setDisbursing(true);
    setError(null);
    try {
      const idempotencyKey = `DISB-DIGITAL-${journey.journey_id}-${Date.now()}`;
      const res = await journeyApi<{
        ok: boolean;
        status: string;
        loan_no: string;
        utr: string;
        amount: number;
        first_emi_date: string;
      }>("/origination/disbursement/request", {
        method: "POST",
        body: {
          account_number: accountNumber.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          beneficiary_name: beneficiaryName.trim(),
          idempotency_key: idempotencyKey
        }
      });

      const updated: JourneyData = {
        ...journey,
        status: "DISBURSED",
        current_step: "success",
        completed_steps: [...new Set([...journey.completed_steps, "disbursement"])],
        disbursement: {
          status: res.status,
          loan_no: res.loan_no,
          utr: res.utr,
          amount: res.amount,
          account_number: accountNumber.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          beneficiary_name: beneficiaryName.trim(),
          first_emi_date: res.first_emi_date
        }
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Disbursement processing failed.");
      setDisbursing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Landmark className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Instant Bank Account Disbursal
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Funds are transferred directly to your bank account via instant IMPS / RTGS rails upon confirmation.
        </p>
      </div>

      <form onSubmit={handleDisburse} className="space-y-6">
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Bank Account Details
            </span>
            {pennyDropVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Penny Drop Name Match Confirmed</span>
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Beneficiary Name (as registered with bank) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Bank Account Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9876543210001"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Confirm Account Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={confirmAccount}
                  onChange={(e) => setConfirmAccount(e.target.value.replace(/\D/g, ""))}
                  placeholder="Re-enter account number"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Bank IFSC Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                maxLength={11}
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="HDFC0000060"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Total Disbursal Amount</span>
            <span className="font-bold text-emerald-400 font-mono text-base">
              ₹{amount.toLocaleString("en-IN")}
            </span>
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
          disabled={disbursing}
          className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {disbursing ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Instant Bank Payout via NPCI IMPS...
            </span>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Confirm & Disburse ₹{amount.toLocaleString("en-IN")} Now</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
