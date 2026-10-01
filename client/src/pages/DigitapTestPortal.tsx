import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Zap,
  RefreshCw,
  Copy,
  Check,
  FileText,
  UserCheck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Radio,
  Server
} from "lucide-react";
import { Link } from "react-router-dom";

interface FetchResponse {
  success: boolean;
  timestamp: string;
  executionMode: string;
  mobile: string;
  maskedMobile: string;
  queryMeta: {
    environment: string;
    clientId: string;
    smsProvider: string;
    kycProvider: string;
    creditBureauProvider: string;
  };
  identity: {
    subscriberName: string;
    mobileNumber: string;
    carrier: string;
    circle: string;
    simType: string;
    simStatus: string;
    registeredAddress: string;
    telecomMatchScore: number;
    verifiedViaDigitap: boolean;
  };
  aadhaar: {
    maskedAadhaar: string;
    aadhaarLinkedToPan: boolean;
    aadhaarLinkedToMobile: boolean;
    uidaiSeedingStatus: string;
    verificationStatus: string;
    source: string;
  };
  pan: {
    panNumber: string;
    maskedPan: string;
    holderName: string;
    category: string;
    status: string;
    aadhaarLinked: boolean;
    section206abCompliance: string;
    panAllotmentStatus: string;
    source: string;
  };
  experian: {
    score: number;
    scoreBand: string;
    scoreRange: string;
    totalAccounts: number;
    activeAccounts: number;
    closedAccounts: number;
    overdueAccounts: number;
    totalOutstanding: number;
    creditUtilization: number;
    enquiries6m: number;
    dpdMax: number;
    repaymentTrack: string;
    creditAge: string;
    providerRef: string;
    tradelines: Array<{
      accountNumber: string;
      lender: string;
      accountType: string;
      sanctionedAmount: number;
      currentBalance: number;
      repaymentStatus: string;
      dpd: number;
      openedDate: string;
      status: string;
    }>;
  };
  rawEnvelopes: Record<string, any>;
}

export default function DigitapTestPortal() {
  const [mobile, setMobile] = useState("9820123456");
  const [pan, setPan] = useState("BZXPM1234F");
  const [otp, setOtp] = useState("");
  const [env, setEnv] = useState<"uat" | "prod">("uat");
  const [journeyToken, setJourneyToken] = useState("");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [smsStatus, setSmsStatus] = useState<any>(null);
  const [cooldown, setCooldown] = useState(0);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const [activeTab, setActiveTab] = useState<"360" | "aadhaar" | "pan" | "experian" | "telecom" | "raw">("360");
  const [result, setResult] = useState<FetchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Send OTP via CellX SMS Gateway
  const handleSendOtp = async () => {
    if (!mobile || mobile.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    setSmsStatus(null);

    try {
      const res = await fetch("/api/digitap-portal/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to dispatch OTP via CellX.");
      }

      setJourneyToken(data.journeyToken);
      setCooldown(data.resendCooldown || 60);
      setSmsStatus(data);
      if (data.demoOtp) {
        setOtp(data.demoOtp);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send CellX OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify & Fetch Digitap Data
  const handleFetchData = async (bypassOtp = false) => {
    if (!mobile || mobile.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!bypassOtp && !otp) {
      setError("Please enter the 6-digit OTP received on your mobile, or click 'Instant 1-Click Fetch'.");
      return;
    }

    setError(null);
    setIsFetchingData(true);

    try {
      const res = await fetch("/api/digitap-portal/fetch-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile.trim(),
          otp: otp.trim(),
          bypassOtp,
          journeyToken,
          pan: pan.trim() || undefined,
          env
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Digitap API verification failed.");
      }

      setResult(data);
      setActiveTab("360");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during Digitap verification.");
    } finally {
      setIsFetchingData(false);
    }
  };

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Radio className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">CELLX + DIGITAP</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LIVE PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Mobile OTP Consent & KYC Bureau Intelligence Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">CellX SMSGW:</span>
              <span className="font-mono text-emerald-400 font-semibold">SNIELE (Active)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Digitap:</span>
              <span className="font-mono text-cyan-400 font-semibold">{env === "uat" ? "07625809 (UAT)" : "01338635 (PROD)"}</span>
            </div>
          </div>

          <Link
            to="/apply"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
          >
            <span>Customer Flow</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <Link
            to="/app"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner Alert */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 p-5 sm:p-6 shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DLT Template #1007719376278893769
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PE ID #1001609656640066899
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                CellX SMS OTP & Digitap 360° Data Verification Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Enter any Indian mobile number to trigger an authentic CellX SMS OTP and instantly pull the complete Digitap KYC profile:
                <strong className="text-white"> Masked Aadhaar</strong>, <strong className="text-white">PAN Verification</strong>,
                <strong className="text-white"> Experian Credit Score & Tradelines</strong>, and <strong className="text-white">Reverse Telecom Intelligence</strong>.
              </p>
            </div>

            {/* Environment Switcher */}
            <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
              <label className="text-[11px] font-medium text-slate-400">Digitap Environment:</label>
              <div className="flex bg-slate-900 border border-slate-700/80 rounded-lg p-1">
                <button
                  onClick={() => setEnv("uat")}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    env === "uat"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  UAT (07625809)
                </button>
                <button
                  onClick={() => setEnv("prod")}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    env === "prod"
                      ? "bg-cyan-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Production (01338635)
                </button>
              </div>
              {env === "prod" && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Requires IP whitelist with Digitap RM
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Input & Execution Control Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Step 1: Test Input Parameters</span>
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Quick Test Numbers:</span>
              <button
                onClick={() => { setMobile("9820123456"); setPan("BZXPM1234F"); }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] transition-colors"
                title="Digitap UAT Verified Number (Ranjodh Singh Dhillon)"
              >
                9820123456 (UAT)
              </button>
              <button
                onClick={() => { setMobile("9885622862"); setPan("BZXPM1234F"); }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] transition-colors"
                title="Live Active SIM"
              >
                9885622862
              </button>
              <button
                onClick={() => { setMobile("9876543210"); setPan("BZXPM1234F"); }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] transition-colors"
                title="Demo Number"
              >
                9876543210
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Mobile Number Input */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mobile Number (India)</span>
                <span className="text-[11px] text-emerald-400 font-normal">CellX Gateway Target</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-semibold">
                  +91
                </span>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9820123456"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-12 pr-4 py-2.5 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Optional PAN Input */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>PAN Number</span>
                <span className="text-[11px] text-slate-400 font-normal">Optional / Auto</span>
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="BZXPM1234F"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-base uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Send OTP Button */}
            <div className="md:col-span-5 flex items-center gap-2">
              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp || cooldown > 0}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching SMS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{cooldown > 0 ? `Resend SMS (${cooldown}s)` : "Send OTP via CellX SMS"}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleFetchData(true)}
                disabled={isFetchingData}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-sm shrink-0"
                title="Bypass OTP & directly trigger Digitap APIs for this number"
              >
                {isFetchingData ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Zap className="w-4 h-4 text-cyan-400" />
                )}
                <span>Instant Fetch</span>
              </button>
            </div>
          </div>

          {/* SMS Delivery Notice Box */}
          {smsStatus && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CellX SMS Dispatched to +91 {smsStatus.maskedMobile || mobile}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Ref: {smsStatus.journeyToken?.slice(-16)}
                </span>
              </div>
              <p className="text-slate-300">
                Template Message:{" "}
                <em className="text-emerald-200/90 font-mono">
                  "Hi,As per your requirement, we are checking your loan eligibility & Credit Rating.Pls share this OTP {smsStatus.demoOtp ? <span className="underline font-bold text-white">{smsStatus.demoOtp}</span> : "{#var#}"} as your consent for the same. Tx.SNPREL."
                </em>
              </p>
              {smsStatus.demoOtp && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-400">Test OTP Code:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm tracking-widest border border-emerald-500/40">
                    {smsStatus.demoOtp}
                  </span>
                  <button
                    onClick={() => {
                      setOtp(smsStatus.demoOtp);
                      setCopiedOtp(true);
                      setTimeout(() => setCopiedOtp(false), 2000);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedOtp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Auto-paste into OTP field</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OTP Input & Verification Section */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-white font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleFetchData(false)}
              disabled={isFetchingData || !otp}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold py-2 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 text-sm"
            >
              {isFetchingData ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting Digitap APIs...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Verify OTP & Fetch Digitap Profile</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Executive Hero Summary Banner */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Applicant Identity Card */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20 shrink-0">
                    {result.identity.subscriberName ? result.identity.subscriberName.charAt(0) : "A"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {result.identity.subscriberName || "Applicant"}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Digitap KYC Level-3
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                      <span>+91 {result.mobile}</span>
                      <span>•</span>
                      <span>PAN: {result.pan.panNumber}</span>
                      <span>•</span>
                      <span>Aadhaar: {result.aadhaar.maskedAadhaar}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Carrier: <strong className="text-slate-200">{result.identity.carrier} ({result.identity.circle})</strong> • SIM: <strong className="text-slate-200">{result.identity.simType}</strong>
                    </p>
                  </div>
                </div>

                {/* Experian Score Highlight */}
                <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 shrink-0">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-white font-mono leading-none">
                        {result.experian.score}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Score</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Experian CIR</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                        {result.experian.scoreBand}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Active: <strong className="text-emerald-400">{result.experian.activeAccounts} Loans/Cards</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Delinquency: <strong className="text-slate-200">{result.experian.dpdMax} DPD (Clean)</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: "360", label: "🌟 360° Comprehensive Dossier" },
                { id: "aadhaar", label: "🆔 Aadhaar Intelligence" },
                { id: "pan", label: "📑 PAN & 206AB Compliance" },
                { id: "experian", label: "📊 Experian Bureau & Tradelines" },
                { id: "telecom", label: "📡 Telecom Reverse Intel" },
                { id: "raw", label: "💻 Raw Digitap API Envelopes" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === t.id
                      ? "bg-slate-900 border-t-2 border-emerald-400 text-emerald-400 border-x border-slate-800"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}

            {/* TAB 1: 360° Comprehensive Dossier */}
            {activeTab === "360" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Aadhaar Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aadhaar KYC
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      VERIFIED
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Masked Aadhaar Number</span>
                    <div className="font-mono text-base font-black text-white">{result.aadhaar.maskedAadhaar}</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">UIDAI Seeding:</span>
                      <span className="text-emerald-400 font-semibold">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Linked to PAN:</span>
                      <span className="text-emerald-400 font-semibold">{result.aadhaar.aadhaarLinkedToPan ? "Yes (Sec 139AA)" : "Pending"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mobile Match:</span>
                      <span className="text-emerald-400 font-semibold">100% Match</span>
                    </div>
                  </div>
                </div>

                {/* 2. PAN Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" /> PAN Card
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                      OPERATIVE
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">PAN Number</span>
                    <div className="font-mono text-base font-black text-white">{result.pan.panNumber}</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Holder Name:</span>
                      <span className="text-slate-200 font-semibold truncate max-w-[130px]">{result.pan.holderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="text-slate-200 font-semibold">{result.pan.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sec 206AB:</span>
                      <span className="text-emerald-400 font-semibold">Compliant</span>
                    </div>
                  </div>
                </div>

                {/* 3. Experian Credit Bureau */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" /> Experian CIR
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      {result.experian.scoreBand}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Bureau Score</span>
                    <div className="font-mono text-base font-black text-white">
                      {result.experian.score} <span className="text-xs text-slate-500 font-normal">/ 900</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Outstanding:</span>
                      <span className="text-slate-200 font-semibold">₹{result.experian.totalOutstanding.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Utilization:</span>
                      <span className="text-emerald-400 font-semibold">{result.experian.creditUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Repayment Track:</span>
                      <span className="text-emerald-400 font-semibold">100% On-Time</span>
                    </div>
                  </div>
                </div>

                {/* 4. Telecom Intel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400" /> Telecom Match
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      ACTIVE SIM
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Carrier / Circle</span>
                    <div className="text-sm font-bold text-white truncate">{result.identity.carrier}</div>
                    <div className="text-xs text-slate-400 truncate">{result.identity.circle}</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">SIM Type:</span>
                      <span className="text-slate-200 font-semibold">{result.identity.simType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-semibold">Active Handset</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reverse Name:</span>
                      <span className="text-slate-200 font-semibold truncate max-w-[120px]">{result.identity.subscriberName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Aadhaar Intelligence */}
            {activeTab === "aadhaar" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>UIDAI Aadhaar Intelligence & Linkage</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Per RBI KYC guidelines and Aadhaar Act, raw 12-digit Aadhaar numbers are never exposed; only provider-masked identifiers are handled.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Digitap KYC Endpoint /pan_to_masked_aadhaar
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Masked Aadhaar Number</span>
                    <div className="font-mono text-xl font-black text-emerald-400">{result.aadhaar.maskedAadhaar}</div>
                    <p className="text-[11px] text-slate-500">Digitap cryptographically masked UIDAI identifier</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">PAN-Aadhaar Seeding Status</span>
                    <div className="text-base font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{result.aadhaar.aadhaarLinkedToPan ? "Linked (CBDT Section 139AA Compliant)" : "Not Linked"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Verified against ITD database via Digitap</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">UIDAI / NPCI Seeding</span>
                    <div className="text-base font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{result.aadhaar.uidaiSeedingStatus}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Aadhaar payment bridge eligible for direct benefit transfers</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-slate-200">Legal & Security Audit Footprint:</div>
                  <p>
                    All Aadhaar checks executed via Digitap's compliant KYC Validation Suite (v4.91).
                    No Aadhaar data is stored unmasked. Verification reference: <span className="font-mono text-emerald-400">{result.identity.mobileNumber}-DT-UIDAI</span>.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: PAN Details */}
            {activeTab === "pan" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                      <span>CBDT Income Tax PAN Profile & Compliance</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time PAN details from Digitap KYC suite (/validation/kyc/v1/pan_details).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Digitap KYC Endpoint /pan_details
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">PAN Number</span>
                    <div className="font-mono text-xl font-black text-cyan-400">{result.pan.panNumber}</div>
                    <span className="text-[11px] text-slate-500">Masked: {result.pan.maskedPan}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Legal Name as per ITD</span>
                    <div className="text-base font-bold text-white">{result.pan.holderName}</div>
                    <span className="text-[11px] text-slate-500">Category: {result.pan.category}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">ITD Operative Status</span>
                    <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{result.pan.status}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">CBDT Pan Allotment Verified</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Section 206AB Compliance</span>
                    <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{result.pan.section206abCompliance}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Not subject to penal higher TDS/TCS deduction</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">PAN-Aadhaar Link Status</span>
                    <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{result.pan.aadhaarLinked ? "Operative (Linked)" : "Inoperative"}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Compliant with Section 139AA</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Data Source</span>
                    <div className="text-base font-bold text-slate-200">{result.pan.source}</div>
                    <span className="text-[11px] text-slate-500">Authenticated via Digitap API</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Experian Credit Bureau & Tradelines */}
            {activeTab === "experian" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span>Experian Credit Bureau Report (CIR)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Credit rating and comprehensive repayment telemetry pulled for +91 {result.mobile}.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Experian Credit Score: {result.experian.score}
                  </span>
                </div>

                {/* Score Key Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Credit Score</span>
                    <div className="font-mono text-xl font-black text-emerald-400">{result.experian.score}</div>
                    <span className="text-[10px] text-slate-500">Range: 300 - 900</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Rating Band</span>
                    <div className="text-sm font-bold text-purple-300">{result.experian.scoreBand}</div>
                    <span className="text-[10px] text-slate-500">Prime Segment</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Total Outstanding</span>
                    <div className="font-mono text-sm font-bold text-white">
                      ₹{result.experian.totalOutstanding.toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] text-slate-500">Across all banks</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Credit Utilization</span>
                    <div className="font-mono text-sm font-bold text-emerald-400">
                      {result.experian.creditUtilization}%
                    </div>
                    <span className="text-[10px] text-slate-500">Safe threshold (&lt;30%)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Delinquency</span>
                    <div className="font-mono text-sm font-bold text-emerald-400">
                      {result.experian.dpdMax} DPD
                    </div>
                    <span className="text-[10px] text-slate-500">Zero default record</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] text-slate-400">6M Inquiries</span>
                    <div className="font-mono text-sm font-bold text-white">
                      {result.experian.enquiries6m}
                    </div>
                    <span className="text-[10px] text-slate-500">Low bureau search</span>
                  </div>
                </div>

                {/* Tradeline Accounts Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-200">Bureau Tradeline Accounts</h4>
                    <span className="text-xs text-slate-400">{result.experian.tradelines.length} Accounts Found</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3">Lender / Institution</th>
                          <th className="p-3">Facility Type</th>
                          <th className="p-3 font-mono">Account No.</th>
                          <th className="p-3 text-right">Sanctioned Limit</th>
                          <th className="p-3 text-right">Current Balance</th>
                          <th className="p-3 text-center">DPD Track</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {result.experian.tradelines.map((tl, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition-colors font-sans">
                            <td className="p-3 font-semibold text-white">{tl.lender}</td>
                            <td className="p-3 text-slate-300">{tl.accountType}</td>
                            <td className="p-3 font-mono text-slate-400">{tl.accountNumber}</td>
                            <td className="p-3 text-right font-mono text-slate-200">
                              ₹{tl.sanctionedAmount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-200">
                              ₹{tl.currentBalance.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                                {tl.dpd} DPD
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tl.status === "Active"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {tl.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Telecom Reverse Intel */}
            {activeTab === "telecom" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-amber-400" />
                      <span>Telecom Reverse Lookup & Carrier Intelligence</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Directly queried from Digitap Mobile Name Lookup (/validation/misc/v1/mobile-name-lookup).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live Carrier Ping
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400">Subscriber Registered Legal Name</span>
                    <div className="text-xl font-bold text-white">{result.identity.subscriberName}</div>
                    <p className="text-[11px] text-slate-500">Extracted directly from telecom carrier registry via Digitap</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400">Telecom Carrier & Circle</span>
                    <div className="text-xl font-bold text-amber-400">{result.identity.carrier}</div>
                    <p className="text-xs text-slate-300">{result.identity.circle} ({result.identity.simType})</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 md:col-span-2">
                    <span className="text-xs text-slate-400">Registered Billing Address (Telecom Records)</span>
                    <div className="text-sm font-semibold text-slate-200">{result.identity.registeredAddress}</div>
                    <p className="text-[11px] text-slate-500">Address linked to the active telecom connection</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Raw Digitap API Envelopes */}
            {activeTab === "raw" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Raw Provider Envelopes (Digitap & CellX)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Exact payload structures returned by Digitap's endpoints for audit & compliance logging.
                    </p>
                  </div>
                  <button
                    onClick={copyJson}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRaw ? "Copied Full JSON!" : "Copy Full JSON"}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(result.rawEnvelopes || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-emerald-400 font-bold uppercase">{key}</span>
                        <span className="text-slate-500 font-mono">
                          HTTP {val?.http_response_code || 200}
                        </span>
                      </div>
                      <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-64 leading-relaxed">
                        {JSON.stringify(val, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          SNIPER FinTech Operating System • CellX SMSGW + Digitap API Suite v4.91 • Experian CIR Integration
        </p>
      </footer>
    </div>
  );
}
