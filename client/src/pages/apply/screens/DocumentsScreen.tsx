import React, { useState } from "react";
import { ArrowRight, UploadCloud, FileText, CheckCircle2, Shield, AlertCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData } from "../types";

interface DocumentsScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

interface DocSlot {
  category: string;
  label: string;
  description: string;
  required: boolean;
  uploadedName?: string;
  verified?: boolean;
}

export function DocumentsScreen({ journey, onSuccess }: DocumentsScreenProps) {
  const [slots, setSlots] = useState<DocSlot[]>([
    {
      category: "salary_slip",
      label: "Latest Salary Slip (PDF)",
      description: "Last 3 months salary slip showing employer and gross/net pay",
      required: true,
      uploadedName: "Salary_Slip_Latest.pdf",
      verified: true
    },
    {
      category: "bank_statement",
      label: "Bank Account Statement (6 Months)",
      description: "Salary credit account statement in e-PDF format",
      required: true,
      uploadedName: undefined,
      verified: false
    },
    {
      category: "pan_card",
      label: "PAN Card Copy",
      description: "Clear photo or scanned PDF copy of your PAN card",
      required: false,
      uploadedName: "PAN_Card_Scanned.jpg",
      verified: true
    }
  ]);

  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateUpload = async (category: string) => {
    setUploadingCategory(category);
    setError(null);
    try {
      const fileName =
        category === "bank_statement"
          ? "Bank_Statement_6M_HDFC.pdf"
          : category === "salary_slip"
          ? "Salary_Slip_May2026.pdf"
          : "PAN_Copy.pdf";

      await journeyApi("/origination/documents", {
        method: "POST",
        body: {
          category,
          name: fileName
        }
      });

      setSlots((prev) =>
        prev.map((s) =>
          s.category === category
            ? { ...s, uploadedName: fileName, verified: true }
            : s
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleContinue = () => {
    const requiredDone = slots.filter((s) => s.required).every((s) => s.verified);
    if (!requiredDone) {
      setError("Please upload the mandatory documents before continuing.");
      return;
    }

    const updated: JourneyData = {
      ...journey,
      status: "KYC_COMPLETED",
      current_step: "credit",
      completed_steps: [...new Set([...journey.completed_steps, "documents"])]
    };
    onSuccess(updated);
  };

  const allRequiredDone = slots.filter((s) => s.required).every((s) => s.verified);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Document Verification Checklist
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Upload your latest financial documents. Our OCR engine verifies statements in real time.
        </p>
      </div>

      <div className="space-y-4">
        {slots.map((s) => (
          <div
            key={s.category}
            className="bg-[#161b22] border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  {s.required && (
                    <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">{s.description}</p>
                {s.uploadedName && (
                  <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                    <span>File: {s.uploadedName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end">
              {s.verified ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OCR Verified</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSimulateUpload(s.category)}
                  disabled={uploadingCategory === s.category}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium cursor-pointer shadow-md flex items-center gap-2"
                >
                  {uploadingCategory === s.category ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload & Verify</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!allRequiredDone}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Continue to Credit Bureau Check</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
