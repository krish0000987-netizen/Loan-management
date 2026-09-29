import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Award, Zap, Percent, Clock, AlertCircle } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData, LenderOffer } from "../types";

interface OffersScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function OffersScreen({ journey, onSuccess }: OffersScreenProps) {
  const [offers, setOffers] = useState<LenderOffer[]>(journey.offers || []);
  const [selectedLenderId, setSelectedLenderId] = useState<number | null>(
    journey.selected_lender_id || null
  );
  const [loading, setLoading] = useState(offers.length === 0);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journeyApi<{
        ok: boolean;
        offers: LenderOffer[];
        count: number;
      }>("/origination/lenders/match", {
        method: "POST"
      });

      setOffers(res.offers || []);
      if (res.offers?.length > 0 && !selectedLenderId) {
        setSelectedLenderId(res.offers[0].lender_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch lender offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (offers.length === 0) {
      fetchMatches();
    } else if (!selectedLenderId && offers.length > 0) {
      setSelectedLenderId(offers[0].lender_id);
    }
  }, []);

  const handleSelectOffer = async () => {
    if (!selectedLenderId) {
      setError("Please choose one of the pre-approved lender offers.");
      return;
    }

    setSelecting(true);
    setError(null);
    try {
      await journeyApi(`/origination/offers/${selectedLenderId}/select`, {
        method: "POST"
      });

      const updatedOffers = offers.map((o) => ({
        ...o,
        selected: o.lender_id === selectedLenderId
      }));

      const updated: JourneyData = {
        ...journey,
        selected_lender_id: selectedLenderId,
        offers: updatedOffers,
        status: "OFFER_SELECTED",
        current_step: "confirm",
        completed_steps: [...new Set([...journey.completed_steps, "offers"])]
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Failed to select offer.");
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Multi-Lender Match Engine Active</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Select Your Pre-Approved Loan Offer
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          We evaluated your profile against {offers.length || 3} partner schemes. Choose the term that best fits your repayment goals.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-300 font-medium">
            Negotiating best rates with partner lenders...
          </p>
          <p className="text-xs text-zinc-500">
            Applying policy filters across HDFC, Kotak, Axis, and Growth Nations NBFCs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer, idx) => {
            const isSelected = selectedLenderId === offer.lender_id;
            return (
              <div
                key={offer.lender_id}
                onClick={() => setSelectedLenderId(offer.lender_id)}
                className={`relative bg-[#161b22] border rounded-2xl p-5 sm:p-6 shadow-xl transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-950/30"
                    : "border-zinc-800 hover:border-zinc-700 opacity-85 hover:opacity-100"
                }`}
              >
                {idx === 0 && (
                  <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                    ★ Best Overall Value
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{offer.lender_name}</h3>
                      <span className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-md font-mono">
                        {offer.scheme_name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{offer.product_name}</p>
                  </div>

                  <div className="flex items-center gap-2 text-right sm:text-right">
                    <div className="text-right">
                      <p className="text-[11px] text-zinc-400">Match Score</p>
                      <p className="text-sm font-bold text-emerald-400 font-mono">
                        {offer.match_score}% High
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-400 text-white"
                          : "border-zinc-600 bg-zinc-900 text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Approved Limit</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      ₹{Number(offer.max_amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Interest Rate</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {offer.roi_pct}% p.a.
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Monthly EMI</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      ₹{Number(offer.estimated_emi).toLocaleString("en-IN")}/mo
                    </p>
                  </div>
                  <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Processing Fee</p>
                    <p className="text-sm font-bold text-zinc-300 font-mono mt-0.5">
                      {offer.processing_fee_pct}% + GST
                    </p>
                  </div>
                </div>

                {/* Offer Highlights */}
                {offer.highlights && offer.highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    {offer.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSelectOffer}
            disabled={selecting || !selectedLenderId}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {selecting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Securing Selected Offer...
              </span>
            ) : (
              <>
                <span>Lock In Selected Offer & Review</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
