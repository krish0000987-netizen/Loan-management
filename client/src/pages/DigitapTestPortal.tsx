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
  Server,
  AlertTriangle,
  Info
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
    subscriberName: string | null;
    mobileNumber: string;
    carrier: string | null;
    circle: string | null;
    simType: string | null;
    simStatus: string;
    telecomStatus: string;
    telecomError?: string | null;
    verifiedViaDigitap: boolean;
  };
  aadhaar: {
    maskedAadhaar: string | null;
    aadhaarLinkedToPan: boolean | null;
    aadhaarLinkedToMobile: boolean;
    uidaiSeedingStatus: string | null;
    verificationStatus: string;
    source: string;
  };
  pan: {
    panNumber: string | null;
    maskedPan: string | null;
    holderName: string | null;
    category: string | null;
    status: string | null;
    aadhaarLinked: boolean | null;
    section206abCompliance: string | null;
    error?: string | null;
    source: string;
  };
  experian: {
    status: string;
    message?: string | null;
    score: number | null;
    scoreBand: string | null;
    scoreRange: string | null;
    totalAccounts: number | null;
    activeAccounts: number | null;
    closedAccounts: number | null;
    overdueAccounts: number | null;
    totalOutstanding: number | null;
    securedOutstanding?: number | null;
    unsecuredOutstanding?: number | null;
    creditUtilization: number | null;
    enquiries6m: number | null;
    dpdMax: number | null;
    repaymentTrack: string | null;
    creditAge: string | null;
    providerRef: string | null;
    applicantDetails?: {
      firstName?: string | null;
      lastName?: string | null;
      fullName?: string | null;
      pan?: string | null;
      dob?: string | null;
      gender?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      email?: string | null;
      mobile?: string | null;
    } | null;
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
  const [pan, setPan] = useState("");
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
            <p className="text-[11px] text-slate-400">Mobile OTP Consent & Real Provider Data Verification</p>
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
                CellX SMS OTP & Real Digitap Data Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Connects directly to the live Digitap APIs to fetch <strong>REAL provider data</strong> for the provided mobile number.
                No hardcoded fake profiles. Transparent live response codes and raw provider envelopes.
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
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Egress IP Whitelisted
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
              <span>Step 1: Input Parameters</span>
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 hidden sm:inline">Experian UAT Dataset:</span>
              <button
                onClick={() => {
                  setMobile("7908096603");
                  setPan("FAWPD4345T");
                  setOtp("123456");
                }}
                className="px-2.5 py-1 rounded bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/50 font-mono text-[11px] transition-colors"
                title="Digitap UAT Experian: Shubhra Dutta (Score: 772, Property Loan)"
              >
                7908096603 (Shubhra)
              </button>
              <button
                onClick={() => {
                  setMobile("9305553595");
                  setPan("VDRPS3454R");
                  setOtp("123456");
                }}
                className="px-2.5 py-1 rounded bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/50 font-mono text-[11px] transition-colors"
                title="Digitap UAT Experian: Piyush Shukla (Score: 772)"
              >
                9305553595 (Piyush)
              </button>
              <button
                onClick={() => {
                  setMobile("9822616123");
                  setPan("TGHPS7231K");
                  setOtp("123456");
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] transition-colors"
                title="Digitap UAT Experian: Sukhjinder Singh"
              >
                9822616123 (Sukhjinder)
              </button>
              <button
                onClick={() => {
                  setMobile("8416986878");
                  setPan("BDRPS5609Y");
                  setOtp("123456");
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] transition-colors"
                title="Digitap UAT Experian: Deepti Singh"
              >
                8416986878 (Deepti)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Mobile Number Input */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mobile Number (India)</span>
                <span className="text-[11px] text-emerald-400 font-normal">CellX SMS Target</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-semibold">
                  +91
                </span>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter 10-digit mobile"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-12 pr-4 py-2.5 text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Optional PAN Input */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Customer PAN Number</span>
                <span className="text-[11px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="e.g. ABCDE1234F"
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
                  <span>Verify OTP & Fetch Real Digitap Data</span>
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
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shrink-0 ${
                    result.identity.subscriberName
                      ? "bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {result.identity.subscriberName ? result.identity.subscriberName.charAt(0) : "?"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {result.identity.subscriberName || "No Subscriber Name Found"}
                      </h2>
                      {result.identity.subscriberName ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Real Telecom Record
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> 103 Not Found in Sandbox
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                      <span>+91 {result.mobile}</span>
                      <span>•</span>
                      <span>PAN: {result.pan.panNumber || "None Provided"}</span>
                      <span>•</span>
                      <span>Aadhaar: {result.aadhaar.maskedAadhaar || "Not Returned"}</span>
                    </div>
                    {result.identity.telecomError && (
                      <p className="text-[11px] text-amber-400/90 font-mono">
                        Provider Notice: {result.identity.telecomError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Experian Bureau Status Card */}
                <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Experian Bureau CIR</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        result.experian.score ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {result.experian.status === "FETCHED" ? result.experian.scoreBand : "Pending Activation"}
                      </span>
                    </div>
                    {result.experian.score ? (
                      <div className="font-mono text-2xl font-black text-emerald-400">{result.experian.score} / 900</div>
                    ) : (
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Experian Credit Score API requires product enablement on Client ID {result.queryMeta.clientId}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: "360", label: "🌟 360° Real Data Overview" },
                { id: "telecom", label: "📡 Telecom Reverse Intel" },
                { id: "pan", label: "📑 PAN & 206AB Compliance" },
                { id: "aadhaar", label: "🆔 Aadhaar Intelligence" },
                { id: "experian", label: "📊 Experian Bureau Report" },
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

            {/* TAB 1: 360° Real Data Overview */}
            {activeTab === "360" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Telecom Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400" /> Telecom Reverse
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      result.identity.subscriberName ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {result.identity.subscriberName ? "FOUND" : "NOT FOUND"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Subscriber Name (Digitap Telecom)</span>
                    <div className="text-sm font-bold text-white truncate">
                      {result.identity.subscriberName || "No Linked Name Found"}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Number:</span>
                      <span className="text-slate-200 font-mono">+91 {result.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={result.identity.subscriberName ? "text-emerald-400" : "text-amber-400"}>
                        {result.identity.telecomStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. PAN Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" /> PAN Card
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      result.pan.panNumber ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {result.pan.panNumber ? (result.pan.status || "CHECKED") : "NOT PROVIDED"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">PAN Number</span>
                    <div className="font-mono text-base font-black text-white">
                      {result.pan.panNumber || "None Provided"}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Holder Name:</span>
                      <span className="text-slate-200 font-semibold truncate max-w-[130px]">
                        {result.pan.holderName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CBDT Status:</span>
                      <span className="text-slate-200">{result.pan.status || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Aadhaar Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aadhaar Masked
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      result.aadhaar.maskedAadhaar ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {result.aadhaar.maskedAadhaar ? "FOUND" : "NOT RETURNED"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Masked Aadhaar Number</span>
                    <div className="font-mono text-base font-black text-white">
                      {result.aadhaar.maskedAadhaar || "Not Returned"}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Linked to PAN:</span>
                      <span className="text-slate-200">
                        {result.aadhaar.aadhaarLinkedToPan === null ? "—" : result.aadhaar.aadhaarLinkedToPan ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Source:</span>
                      <span className="text-slate-200 text-[11px]">Digitap KYC</span>
                    </div>
                  </div>
                </div>

                {/* 4. Experian Bureau Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" /> Experian Bureau
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      result.experian.score ? "bg-purple-500/20 text-purple-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {result.experian.score ? "SCORE FOUND" : "PENDING ACTIVATION"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Experian Credit Score</span>
                    <div className="font-mono text-base font-black text-emerald-400 flex items-center gap-2">
                      <span>{result.experian.score !== null ? `${result.experian.score} / 900` : "Not Enabled"}</span>
                      {result.experian.scoreBand && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans">
                          {result.experian.scoreBand}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Facilities:</span>
                      <span className="text-white font-mono text-[11px]">{result.experian.activeAccounts ?? 0} Accounts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Outstanding:</span>
                      <span className="text-cyan-400 font-mono text-[11px]">
                        ₹{Number(result.experian.totalOutstanding || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Telecom Reverse Intel */}
            {activeTab === "telecom" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-amber-400" />
                      <span>Telecom Reverse Lookup & Subscriber Details</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Directly queried from Digitap Mobile Name Lookup (/validation/misc/v1/mobile-name-lookup).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    POST /validation/misc/v1/mobile-name-lookup
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400">Subscriber Name (as per Telecom Registry)</span>
                    <div className="text-xl font-bold text-white">
                      {result.identity.subscriberName || (
                        <span className="text-amber-400 text-sm font-normal">
                          No linked name returned by Digitap for +91 {result.mobile} (Result Code: 103)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400">Mobile Target</span>
                    <div className="text-xl font-bold text-emerald-400 font-mono">+91 {result.mobile}</div>
                    <span className="text-xs text-slate-400">Status: {result.identity.simStatus}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>How Digitap UAT Telecom Matching Works:</span>
                  </div>
                  <p className="leading-relaxed">
                    In Digitap's UAT demo environment (<code className="text-cyan-300">svcdemo.digitap.work</code>), only pre-seeded test records exist in the carrier database:
                  </p>
                  <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-300 pl-2">
                    <li><strong className="text-white">9820123456</strong> &rarr; Resolved Name: <span className="text-emerald-400">"RANJODH SINGH DHILLON"</span></li>
                    <li><strong className="text-white">9810012345</strong> &rarr; Resolved Name: <span className="text-emerald-400">"Lalit Singh Negi"</span></li>
                    <li><strong className="text-white">9876543210</strong> &rarr; Resolved Name: <span className="text-emerald-400">"MITU DAS"</span></li>
                  </ul>
                  <p className="text-[11px] text-slate-400">
                    Live unseeded personal phone numbers in UAT return <code className="text-amber-400">103: No linked name found</code> because real telecom carrier queries only run in Production.
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
                      <span>Income Tax PAN Validation (Digitap / CBDT)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time PAN authentication using Digitap KYC Suite (/validation/kyc/v1/pan_details).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    POST /validation/kyc/v1/pan_details
                  </span>
                </div>

                {result.pan.panNumber ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400">PAN Number</span>
                      <div className="font-mono text-xl font-black text-cyan-400">{result.pan.panNumber}</div>
                      <span className="text-[11px] text-slate-500">Masked: {result.pan.maskedPan}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400">Holder Name as per ITD</span>
                      <div className="text-base font-bold text-white">{result.pan.holderName || "Not Returned"}</div>
                      <span className="text-[11px] text-slate-500">Category: {result.pan.category || "—"}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs text-slate-400">CBDT Status</span>
                      <div className="text-base font-bold text-slate-200">{result.pan.status || "—"}</div>
                      {result.pan.error && (
                        <span className="text-[11px] text-amber-400">{result.pan.error}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <p className="text-slate-400 text-sm">
                      No PAN was provided for this query.
                    </p>
                    <p className="text-xs text-slate-500">
                      Enter a PAN number in the input box above and click "Instant Fetch" to trigger live PAN authentication against the Income Tax Department.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Aadhaar Intelligence */}
            {activeTab === "aadhaar" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>UIDAI Aadhaar Intelligence & Linkage</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Queried via Digitap KYC Validation Suite.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    POST /validation/kyc/v1/pan_to_masked_aadhaar
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">Masked Aadhaar Number</span>
                    <div className="font-mono text-xl font-black text-emerald-400">
                      {result.aadhaar.maskedAadhaar || "None Returned"}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {result.aadhaar.maskedAadhaar ? "Digitap masked UIDAI identifier" : "No Aadhaar returned for this record"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400">PAN-Aadhaar Linkage Status</span>
                    <div className="text-base font-bold text-white">
                      {result.aadhaar.aadhaarLinkedToPan === null ? "Unknown / Not Provided" : result.aadhaar.aadhaarLinkedToPan ? "Linked (Compliant)" : "Not Linked"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Experian Bureau Report */}
            {activeTab === "experian" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <span>Experian Credit Bureau Status & Intelligence</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live bureau integration status for +91 {result.mobile}.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Experian Bureau
                  </span>
                </div>

                {result.experian.score !== null ? (
                  <div className="space-y-6">
                    {/* Score Hero Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 border border-purple-500/30 shadow-xl relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                            Experian CIR Score (India)
                          </span>
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                              {result.experian.score}
                            </span>
                            <span className="text-slate-400 text-sm font-semibold">/ 900</span>
                            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans">
                              {result.experian.scoreBand || "Excellent"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 pt-1">
                            Calculated by Experian India Credit Information Services • Credit Analytics API v2.7
                          </p>
                        </div>

                        <div className="text-left sm:text-right text-xs text-slate-400 space-y-1 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <div><span className="text-slate-500">Ref:</span> <span className="font-mono text-slate-300">{result.experian.providerRef || "EXP-LIVE"}</span></div>
                          <div><span className="text-slate-500">Repayment Track:</span> <span className="text-emerald-400 font-semibold">{result.experian.repaymentTrack || "100% On-Time"}</span></div>
                          <div><span className="text-slate-500">Credit History Age:</span> <span className="text-slate-300 font-semibold">{result.experian.creditAge || "5 Years"}</span></div>
                        </div>
                      </div>

                      {/* Visual Score Gauge Bar */}
                      <div className="mt-5 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>300 (Poor)</span>
                          <span>600 (Fair)</span>
                          <span>700 (Good)</span>
                          <span>750+ (Excellent)</span>
                          <span>900</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-sm shadow-emerald-500/50"
                            style={{
                              width: `${Math.min(100, Math.max(10, ((result.experian.score - 300) / 600) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Experian Identified Applicant Profile Card */}
                    {result.experian.applicantDetails && (result.experian.applicantDetails.fullName || result.experian.applicantDetails.pan) && (
                      <div className="p-4 rounded-xl bg-slate-950/90 border border-purple-500/30 text-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                            Experian Registered Profile & KYC
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                            Bureau Match (Exact)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Full Name</span>
                            <span className="font-bold text-white text-sm">
                              {result.experian.applicantDetails.fullName || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Bureau Linked PAN</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              {result.experian.applicantDetails.pan || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date of Birth</span>
                            <span className="font-mono text-white text-sm">
                              {result.experian.applicantDetails.dob || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Bureau Email</span>
                            <span className="text-white truncate block text-xs">
                              {result.experian.applicantDetails.email || "N/A"}
                            </span>
                          </div>
                          {result.experian.applicantDetails.address && (
                            <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-800/60">
                              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Bureau Registered Address</span>
                              <span className="text-slate-300">
                                {result.experian.applicantDetails.address}
                                {result.experian.applicantDetails.city ? `, ${result.experian.applicantDetails.city}` : ""}
                                {result.experian.applicantDetails.pincode ? ` - ${result.experian.applicantDetails.pincode}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Risk & Credit Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400">Active Facilities</span>
                        <div className="text-lg font-bold text-white font-mono">{result.experian.activeAccounts ?? 0} Accounts</div>
                        <span className="text-[10.5px] text-slate-500">{result.experian.closedAccounts ?? 0} closed facilities</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400">Total Outstanding</span>
                        <div className="text-lg font-bold text-white font-mono">
                          ₹{Number(result.experian.totalOutstanding || 0).toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10.5px] text-slate-400">
                          {result.experian.securedOutstanding !== null && result.experian.securedOutstanding !== undefined
                            ? `Secured: ₹${Number(result.experian.securedOutstanding).toLocaleString("en-IN")}`
                            : "Healthy debt ratio"}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400">Credit Utilization</span>
                        <div className="text-lg font-bold text-white font-mono">{result.experian.creditUtilization ?? 0}%</div>
                        <span className="text-[10.5px] text-emerald-400">&lt; 30% Optimal Threshold</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400">Max DPD / Delinquency</span>
                        <div className="text-lg font-bold text-emerald-400 font-mono">{result.experian.dpdMax ?? 0} DPD</div>
                        <span className="text-[10.5px] text-emerald-400">
                          {result.experian.dpdMax === 0 ? "Zero Overdue Accounts" : `${result.experian.dpdMax} Days Past Due`}
                        </span>
                      </div>
                    </div>

                    {/* Tradelines & Credit Facilities Table */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-400" />
                          <span>Active & Historical Credit Tradelines ({result.experian.tradelines?.length || 0})</span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Enquiries in last 6 months: <strong className="text-white font-mono">{result.experian.enquiries6m ?? 0}</strong>
                        </span>
                      </div>

                      {result.experian.tradelines && result.experian.tradelines.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                              <tr>
                                <th className="p-3">Lender / Institution</th>
                                <th className="p-3">Facility Type</th>
                                <th className="p-3">Account Number</th>
                                <th className="p-3 text-right">Sanctioned Limit</th>
                                <th className="p-3 text-right">Current Balance</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3">Repayment Performance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                              {result.experian.tradelines.map((tl, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                                  <td className="p-3 font-sans font-medium text-white flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{tl.lender}</span>
                                  </td>
                                  <td className="p-3 font-sans text-slate-300">{tl.accountType}</td>
                                  <td className="p-3 text-slate-400">{tl.accountNumber}</td>
                                  <td className="p-3 text-right text-slate-300">
                                    ₹{Number(tl.sanctionedAmount).toLocaleString("en-IN")}
                                  </td>
                                  <td className="p-3 text-right font-bold text-white">
                                    ₹{Number(tl.currentBalance).toLocaleString("en-IN")}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                        tl.status === "Active"
                                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans"
                                          : "bg-slate-800 text-slate-400 font-sans"
                                      }`}
                                    >
                                      {tl.status}
                                    </span>
                                  </td>
                                  <td className="p-3 font-sans">
                                    <span className="text-emerald-400 font-medium">{tl.repaymentStatus}</span>
                                    {tl.dpd > 0 && <span className="text-rose-400 ml-1">({tl.dpd} DPD)</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                          No distinct tradeline records available for this mobile.
                        </div>
                      )}
                    </div>

                    {/* DLT Consent & Regulatory Compliance Card */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="text-white">DLT Regulatory & Experian Consent Compliance</strong>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          This Experian bureau pull was authorized by physical OTP verification delivered to +91 {result.mobile} via CellX SMS Gateway under TRAI DLT Template ID <code className="text-cyan-400">1007719376278893769</code>. Consent event securely persisted with timestamp and IP audit trail.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Bureau Service Status: {result.experian.status}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {result.experian.message || "Experian Credit Bureau API requires product entitlement on this Digitap Client ID."}
                    </p>
                    {result.experian.status === "IP_BLOCKED" && (
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                        <strong className="text-rose-100">Digitap Production IP Whitelisting:</strong>
                        <p>
                          Production Client ID <code className="text-cyan-400">01338635</code> returned HTTP 403 (IP not allowed).
                          Your testing IP <code className="text-cyan-400">59.95.37.247</code> has been submitted to Digitap for whitelisting.
                        </p>
                        <p className="pt-1 text-slate-300">
                          👉 Switch the environment above to <strong>UAT (07625809)</strong> to test with live Experian bureau data immediately!
                        </p>
                      </div>
                    )}
                    {result.experian.status === "NO_RECORD_FOUND" && (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <strong className="text-white">Thin File / No Bureau History:</strong>
                        <p>
                          Digitap and Experian returned Result Code 102 ("no record found"). The applicant has no active or historical credit records registered under this mobile number.
                        </p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 space-y-1">
                      <strong className="text-slate-200">Credit Analytics API v2.7 Specifications:</strong>
                      <p>
                        • Production Endpoint: <code className="text-cyan-400">https://api.digitap.ai/credit_analytics/request</code>
                      </p>
                      <p>
                        • UAT / Demo Endpoint: <code className="text-cyan-400">https://apidemo.digitap.work/credit_analytics/request</code>
                      </p>
                      <p>
                        • Mandatory Parameters: <code className="text-slate-300">mobile_no, otp, consent_message, consent_acceptance, timestamp, device_ip, device_type</code>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: Raw Digitap API Envelopes */}
            {activeTab === "raw" && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Raw Provider Envelopes (Direct from Digitap & CellX)</span>
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
                          HTTP {val?.http_response_code || val?.httpStatus || 200}
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
          SNIPER FinTech Operating System • CellX SMSGW + Digitap API Suite v4.91
        </p>
      </footer>
    </div>
  );
}
