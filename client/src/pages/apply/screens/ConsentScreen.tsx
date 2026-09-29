import React, { useState } from "react";
import { ArrowRight, ShieldCheck, CheckSquare, Square, FileText, CheckCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface ConsentScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

interface ConsentItem {
  id: string;
  category: string;
  title: string;
  description: string;
  mandatory: boolean;
}

const CONSENTS: ConsentItem[] = [
  {
    id: "bureau",
    category: "bureau",
    title: "Credit Bureau Inquiry Consent (CICRA 2005)",
    description:
      "I authorize SNIPER and its partner lenders to pull my credit information report from TransUnion CIBIL, Experian, Equifax, and CRIF High Mark to evaluate my loan eligibility.",
    mandatory: true
  },
  {
    id: "kyc",
    category: "kyc",
    title: "Identity & Digilocker e-KYC Verification",
    description:
      "I consent to paperless identity verification using my PAN and Digilocker / Aadhaar offline XML as permitted by the Reserve Bank of India (RBI) KYC Master Directions.",
    mandatory: true
  },
  {
    id: "lender_matching",
    category: "lender_matching",
    title: "Multi-Lender Matchmaking & Policy Submission",
    description:
      "I agree to share my application details with partner Banks and NBFCs in the Growth Nations network to receive tailored loan schemes with the highest approval probability.",
    mandatory: true
  },
  {
    id: "comms",
    category: "comms",
    title: "Digital Communication & Account Updates",
    description:
      "I agree to receive transaction alerts, sanction letters, and loan repayment reminders via SMS, WhatsApp, and email.",
    mandatory: true
  }
];

export function ConsentScreen({ journey, onSuccess }: ConsentScreenProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    bureau: true,
    kyc: true,
    lender_matching: true,
    comms: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = CONSENTS.every((c) => selected[c.id]);

  const toggleAll = () => {
    const nextVal = !allSelected;
    const next: Record<string, boolean> = {};
    CONSENTS.forEach((c) => {
      next[c.id] = nextVal;
    });
    setSelected(next);
  };

  const toggleItem = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContinue = async () => {
    const mandatoryMissing = CONSENTS.filter((c) => c.mandatory && !selected[c.id]);
    if (mandatoryMissing.length > 0) {
      setError("Please accept all mandatory regulatory consents to proceed with your application.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const activeCategories = CONSENTS.filter((c) => selected[c.id]).map((c) => c.category);
      const res = await journeyApi<{ ok: boolean; status: string; next_step: string }>("/origination/consent", {
        method: "POST",
        body: {
          categories: activeCategories,
          agreed: true
        }
      });

      const updated: JourneyData = {
        ...journey,
        status: res.status,
        current_step: res.next_step || "profile",
        completed_steps: [...new Set([...journey.completed_steps, "consent"])]
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Failed to record consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Applicant Consent & Regulatory Disclosures
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          We operate strictly in accordance with RBI Digital Lending Directions. Your data is encrypted and used only for loan evaluation.
        </p>
      </div>

      <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Toggle All Bar */}
        <div className="flex items-center justify-between p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2.5 text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-zinc-500" />
            )}
            <span>Select All Authorizations</span>
          </button>
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
            4 / 4 Consents
          </span>
        </div>

        {/* Consent Cards */}
        <div className="space-y-3">
          {CONSENTS.map((c) => {
            const isChecked = !!selected[c.id];
            return (
              <div
                key={c.id}
                onClick={() => toggleItem(c.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? "bg-zinc-900/70 border-zinc-700/90"
                    : "bg-zinc-900/30 border-zinc-800/60 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 text-emerald-400 flex-shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      {c.title}
                      {c.mandatory && <span className="text-red-400 text-[10px]">*</span>}
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={loading || !allSelected}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Recording Consent...
            </span>
          ) : (
            <>
              <span>Agree & Continue to Profile</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
