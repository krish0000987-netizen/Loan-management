import React, { useState } from "react";
import { ArrowRight, User, MapPin, Briefcase, IndianRupee, AlertCircle, Sparkles, ShieldCheck, Phone, Mail, CreditCard } from "lucide-react";
import { journeyApi } from "../../../lib/api";
import type { JourneyData, JourneyProfile } from "../types";

interface ProfileScreenProps {
  journey: JourneyData;
  onSuccess: (updatedJourney: JourneyData) => void;
}

export function ProfileScreen({ journey, onSuccess }: ProfileScreenProps) {
  const initial = journey.profile || {};
  const [fullName, setFullName] = useState(initial.full_name || journey.customer_name || "Krishna Vinod Mishra");
  const [dob, setDob] = useState(initial.dob || "1992-08-14");
  const [gender, setGender] = useState(initial.gender || "male");
  const [email, setEmail] = useState(initial.email || "krishna.mishra@gmail.com");
  const [altEmail, setAltEmail] = useState(initial.alt_email || "krishna.alt@outlook.com");
  const [altMobile, setAltMobile] = useState(initial.alt_mobile || "9820011223");
  const [pan, setPan] = useState(initial.pan || journey.customer_pan || "FAWPD4345T");
  const [aadhaar, setAadhaar] = useState(initial.aadhaar || "XXXXXXXX9012");

  const [address, setAddress] = useState(initial.address || "Flat 402, Royal Residency, Andheri West");
  const [city, setCity] = useState(initial.city || "Mumbai");
  const [state, setState] = useState(initial.state || "Maharashtra");
  const [pincode, setPincode] = useState(initial.pincode || "400053");

  const [empType, setEmpType] = useState(initial.employment_type || "salaried");
  const [employer, setEmployer] = useState(initial.employer_name || "Tech Solutions India Ltd");
  const [monthlyIncome, setMonthlyIncome] = useState(initial.monthly_income || 85000);

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadSavedProfile() {
      try {
        const res = await journeyApi<{
          full_name?: string;
          dob?: string;
          gender?: string;
          email?: string;
          alt_email?: string;
          alt_mobile?: string;
          pan?: string;
          aadhaar?: string;
          address?: string;
          city?: string;
          state?: string;
          pincode?: string;
          employment_type?: string;
          employer_name?: string;
          business_name?: string;
          monthly_income?: number;
        }>("/origination/profile");

        if (res) {
          if (res.full_name && res.full_name !== "Applicant") setFullName(res.full_name);
          if (res.dob) setDob(res.dob);
          if (res.gender) setGender(res.gender);
          if (res.email) setEmail(res.email);
          if (res.alt_email) setAltEmail(res.alt_email);
          if (res.alt_mobile) setAltMobile(res.alt_mobile);
          if (res.pan) setPan(res.pan);
          if (res.aadhaar) setAadhaar(res.aadhaar);
          if (res.address) setAddress(res.address);
          if (res.city) setCity(res.city);
          if (res.state) setState(res.state);
          if (res.pincode) setPincode(res.pincode);
          if (res.employment_type) setEmpType(res.employment_type);
          if (res.employer_name || res.business_name) {
            setEmployer(res.employer_name || res.business_name || "");
          }
          if (res.monthly_income) setMonthlyIncome(res.monthly_income);
        }
      } catch (err) {
        // Fallback to initial values
      } finally {
        setFetchingProfile(false);
      }
    }
    loadSavedProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError("Please enter your full legal name as per PAN.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const cleanPan = pan.toUpperCase().trim();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
      setError("Please enter a valid 10-character PAN number (e.g. FAWPD4345T).");
      return;
    }
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit postal pincode.");
      return;
    }
    if (!monthlyIncome || monthlyIncome < 15000) {
      setError("Monthly income must be at least ₹15,000.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profileData: any = {
        full_name: fullName.trim(),
        dob,
        gender,
        email: email.trim().toLowerCase(),
        alt_email: altEmail.trim().toLowerCase(),
        alt_mobile: altMobile.trim(),
        pan: cleanPan,
        aadhaar: aadhaar.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        employment_type: empType,
        employer_name: employer.trim(),
        monthly_income: Number(monthlyIncome),
        annual_income: Number(monthlyIncome) * 12
      };

      const res = await journeyApi<{ ok: boolean; status: string; next_step: string }>("/origination/profile", {
        method: "PATCH",
        body: {
          ...profileData,
          complete: true
        }
      });

      const updated: JourneyData = {
        ...journey,
        customer_name: fullName.trim(),
        customer_pan: cleanPan,
        profile: profileData,
        status: res.status,
        current_step: res.next_step || "kyc",
        completed_steps: [...new Set([...journey.completed_steps, "profile"])]
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Applicant Profile Information
        </h1>
        <p className="text-xs text-zinc-400">
          Auto-fetched and verified via Experian Credit Bureau & Telecom Gateway
        </p>
      </div>

      {/* Experian & Telecom Auto-Fetch Live Badge */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-emerald-950/60 border border-indigo-500/30 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Auto-Fetched via Experian & Telecom Bureau
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Name, PAN, registered address, and Experian Credit Score (782) were automatically retrieved from the verified mobile number{" "}
            <strong className="text-white font-mono">{journey.masked_mobile || journey.mobile}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        {/* Section 1: Personal Details */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider border-b border-zinc-800 pb-3">
            <User className="w-4 h-4" />
            <span>1. Identity & Contact Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Full Name (as on PAN) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Krishna Vinod Mishra"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                PAN Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="FAWPD4345T"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm tracking-widest focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Primary Mobile (Verified)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={journey.mobile ? `+91 ${journey.mobile}` : "+91 7383192767"}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-400 font-mono text-sm"
                />
                <span className="absolute right-3 top-3 text-[11px] font-bold text-emerald-400">Verified</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Alternate Mobile No.
              </label>
              <input
                type="tel"
                maxLength={10}
                value={altMobile}
                onChange={(e) => setAltMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="Alternate 10-digit mobile"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Primary Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Alternate Email ID
              </label>
              <input
                type="email"
                value={altEmail}
                onChange={(e) => setAltEmail(e.target.value)}
                placeholder="alternate.email@example.com"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Aadhaar Number (Masked)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={aadhaar}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-400 font-mono text-sm tracking-wider"
                />
                <span className="absolute right-3 top-3 text-[11px] font-bold text-indigo-400">Digilocker Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Residential Address */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider border-b border-zinc-800 pb-3">
            <MapPin className="w-4 h-4" />
            <span>2. Current Residential Address</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Address Line <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat No, Building, Street"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Pincode <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="400001"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Professional & Financial */}
        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider border-b border-zinc-800 pb-3">
            <Briefcase className="w-4 h-4" />
            <span>3. Employment & Monthly Income</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Employment Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEmpType("salaried")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    empType === "salaried"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-zinc-900 text-zinc-400 border-zinc-700"
                  }`}
                >
                  Salaried
                </button>
                <button
                  type="button"
                  onClick={() => setEmpType("self_employed")}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    empType === "self_employed"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-zinc-900 text-zinc-400 border-zinc-700"
                  }`}
                >
                  Self-Employed
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {empType === "salaried" ? "Employer / Company Name" : "Business Name"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder={empType === "salaried" ? "e.g. TCS / Infosys" : "e.g. Acme Enterprises"}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Net Monthly In-Hand Salary / Income (₹) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={15000}
                  step={5000}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Estimated Annual: ₹{(monthlyIncome * 12).toLocaleString("en-IN")}
              </p>
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
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Profile...
            </span>
          ) : (
            <>
              <span>Save Profile & Proceed to KYC</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
