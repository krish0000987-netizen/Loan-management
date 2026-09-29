import React, { useState, useEffect } from "react";
import { ApplyLayout } from "./ApplyLayout";
import { MobileScreen } from "./screens/MobileScreen";
import { OtpScreen } from "./screens/OtpScreen";
import { ConsentScreen } from "./screens/ConsentScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { KycScreen } from "./screens/KycScreen";
import { DocumentsScreen } from "./screens/DocumentsScreen";
import { CreditScreen } from "./screens/CreditScreen";
import { OffersScreen } from "./screens/OffersScreen";
import { ConfirmScreen } from "./screens/ConfirmScreen";
import { AgreementScreen } from "./screens/AgreementScreen";
import { EsignScreen } from "./screens/EsignScreen";
import { DisbursementScreen } from "./screens/DisbursementScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { getJourneyToken, clearJourneyToken, journeyApi } from "../../lib/api";
import type { JourneyData, JourneyStep } from "./types";

export function ApplyRoot() {
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [currentStep, setCurrentStep] = useState<JourneyStep>("mobile");
  const [initialDemoOtp, setInitialDemoOtp] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Resume journey on load if token present in localStorage
  useEffect(() => {
    async function resume() {
      const token = getJourneyToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await journeyApi<{
          id: number;
          status: string;
          current_step: string;
          completed_steps: string[];
          mobile: string;
          masked_mobile: string;
          amount: number;
          tenure: number;
          purpose?: string;
          customer_id?: number;
          customer_name?: string;
          customer_pan?: string;
          application_id?: number;
          application_no?: string;
          selected_lender_id?: number;
          profile?: any;
          offers?: any[];
          credit_score?: number;
          disbursement?: any;
        }>("/origination/journey");

        if (res && res.id) {
          const jData: JourneyData = {
            id: res.id,
            journey_id: res.id,
            token,
            mobile: res.mobile,
            masked_mobile: res.masked_mobile,
            status: res.status,
            current_step: res.current_step,
            completed_steps: res.completed_steps || [],
            amount: res.amount,
            tenure: res.tenure,
            purpose: res.purpose,
            customer_id: res.customer_id,
            customer_name: res.customer_name,
            customer_pan: res.customer_pan,
            application_id: res.application_id,
            application_no: res.application_no,
            selected_lender_id: res.selected_lender_id,
            profile: res.profile,
            offers: res.offers,
            credit_score: res.credit_score,
            disbursement: res.disbursement
          };

          setJourney(jData);

          // Map server status/step to frontend step
          if (res.status === "DISBURSED") {
            setCurrentStep("dashboard");
          } else {
            const mappedStep = (res.current_step as JourneyStep) || "mobile";
            setCurrentStep(mappedStep);
          }
        }
      } catch (err) {
        console.warn("Could not resume previous journey:", err);
        clearJourneyToken();
      } finally {
        setLoading(false);
      }
    }

    resume();
  }, []);

  const handleReset = () => {
    clearJourneyToken();
    setJourney(null);
    setCurrentStep("mobile");
    setInitialDemoOtp(undefined);
  };

  const handleMobileSuccess = (data: JourneyData, demoOtp?: string) => {
    setJourney(data);
    setInitialDemoOtp(demoOtp);
    setCurrentStep("otp");
  };

  const handleOtpSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("consent");
  };

  const handleConsentSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("profile");
  };

  const handleProfileSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("kyc");
  };

  const handleKycSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("documents");
  };

  const handleDocumentsSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("credit");
  };

  const handleCreditSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("offers");
  };

  const handleOffersSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("confirm");
  };

  const handleConfirmSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("agreement");
  };

  const handleAgreementSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("esign");
  };

  const handleEsignSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("disbursement");
  };

  const handleDisbursementSuccess = (updated: JourneyData) => {
    setJourney(updated);
    setCurrentStep("success");
  };

  return (
    <ApplyLayout
      journey={journey}
      currentStep={currentStep}
      onReset={handleReset}
      loading={loading}
    >
      {currentStep === "mobile" && (
        <MobileScreen onSuccess={handleMobileSuccess} />
      )}

      {currentStep === "otp" && journey && (
        <OtpScreen
          journey={journey}
          initialDemoOtp={initialDemoOtp}
          onSuccess={handleOtpSuccess}
          onBack={() => setCurrentStep("mobile")}
        />
      )}

      {currentStep === "consent" && journey && (
        <ConsentScreen journey={journey} onSuccess={handleConsentSuccess} />
      )}

      {currentStep === "profile" && journey && (
        <ProfileScreen journey={journey} onSuccess={handleProfileSuccess} />
      )}

      {currentStep === "kyc" && journey && (
        <KycScreen journey={journey} onSuccess={handleKycSuccess} />
      )}

      {currentStep === "documents" && journey && (
        <DocumentsScreen journey={journey} onSuccess={handleDocumentsSuccess} />
      )}

      {currentStep === "credit" && journey && (
        <CreditScreen journey={journey} onSuccess={handleCreditSuccess} />
      )}

      {currentStep === "offers" && journey && (
        <OffersScreen journey={journey} onSuccess={handleOffersSuccess} />
      )}

      {currentStep === "confirm" && journey && (
        <ConfirmScreen journey={journey} onSuccess={handleConfirmSuccess} />
      )}

      {currentStep === "agreement" && journey && (
        <AgreementScreen journey={journey} onSuccess={handleAgreementSuccess} />
      )}

      {currentStep === "esign" && journey && (
        <EsignScreen journey={journey} onSuccess={handleEsignSuccess} />
      )}

      {currentStep === "disbursement" && journey && (
        <DisbursementScreen journey={journey} onSuccess={handleDisbursementSuccess} />
      )}

      {currentStep === "success" && journey && (
        <SuccessScreen
          journey={journey}
          onViewDashboard={() => setCurrentStep("dashboard")}
        />
      )}

      {currentStep === "dashboard" && journey && (
        <DashboardScreen
          journey={journey}
          onNewApplication={handleReset}
        />
      )}
    </ApplyLayout>
  );
}

export default ApplyRoot;
