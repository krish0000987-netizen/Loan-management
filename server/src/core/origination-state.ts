/**
 * Server-authoritative state machine for SNIPER digital loan origination.
 * Every transition is validated, audited, and logged. React frontend NEVER directly sets state.
 */

import { run, q1 } from "../db/connection.js";
import { audit } from "./audit.js";

export const ORIGINATION_STATES = [
  "MOBILE_ENTERED",
  "OTP_PENDING",
  "OTP_VERIFIED",
  "CONSENT_PENDING",
  "CONSENT_COMPLETED",
  "PROFILE_PENDING",
  "PROFILE_COMPLETED",
  "KYC_PENDING",
  "KYC_IN_PROGRESS",
  "KYC_COMPLETED",
  "CREDIT_PENDING",
  "CREDIT_IN_PROGRESS",
  "CREDIT_COMPLETED",
  "LENDER_MATCHING",
  "LENDER_MATCHED",
  "OFFER_SELECTED",
  "APPLICATION_SUBMITTED",
  "UNDERWRITING",
  "APPROVED",
  "SANCTIONED",
  "AGREEMENT_PENDING",
  "ESIGN_PENDING",
  "ESIGN_COMPLETED",
  "DISBURSEMENT_PENDING",
  "DISBURSEMENT_PROCESSING",
  "DISBURSED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED"
] as const;

export type OriginationState = (typeof ORIGINATION_STATES)[number];

export const STEP_MAP: Record<OriginationState, string> = {
  MOBILE_ENTERED: "mobile",
  OTP_PENDING: "otp",
  OTP_VERIFIED: "consent",
  CONSENT_PENDING: "consent",
  CONSENT_COMPLETED: "profile",
  PROFILE_PENDING: "profile",
  PROFILE_COMPLETED: "kyc",
  KYC_PENDING: "kyc",
  KYC_IN_PROGRESS: "kyc",
  KYC_COMPLETED: "documents",
  CREDIT_PENDING: "credit",
  CREDIT_IN_PROGRESS: "credit",
  CREDIT_COMPLETED: "offers",
  LENDER_MATCHING: "offers",
  LENDER_MATCHED: "offers",
  OFFER_SELECTED: "confirm",
  APPLICATION_SUBMITTED: "underwriting",
  UNDERWRITING: "underwriting",
  APPROVED: "agreement",
  SANCTIONED: "agreement",
  AGREEMENT_PENDING: "agreement",
  ESIGN_PENDING: "esign",
  ESIGN_COMPLETED: "disbursement",
  DISBURSEMENT_PENDING: "disbursement",
  DISBURSEMENT_PROCESSING: "disbursement",
  DISBURSED: "success",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  EXPIRED: "expired"
};

/** Valid forward transitions allowed in the origination lifecycle */
const ALLOWED_TRANSITIONS: Record<OriginationState, OriginationState[]> = {
  MOBILE_ENTERED: ["OTP_PENDING", "EXPIRED", "CANCELLED"],
  OTP_PENDING: ["OTP_VERIFIED", "OTP_PENDING", "EXPIRED", "CANCELLED"],
  OTP_VERIFIED: ["CONSENT_PENDING", "CONSENT_COMPLETED", "PROFILE_PENDING", "EXPIRED", "CANCELLED"],
  CONSENT_PENDING: ["CONSENT_COMPLETED", "EXPIRED", "CANCELLED"],
  CONSENT_COMPLETED: ["PROFILE_PENDING", "PROFILE_COMPLETED", "CREDIT_PENDING", "CREDIT_COMPLETED", "EXPIRED", "CANCELLED"],
  PROFILE_PENDING: ["PROFILE_COMPLETED", "EXPIRED", "CANCELLED"],
  PROFILE_COMPLETED: ["CREDIT_PENDING", "CREDIT_IN_PROGRESS", "CREDIT_COMPLETED", "KYC_PENDING", "KYC_IN_PROGRESS", "KYC_COMPLETED", "EXPIRED", "CANCELLED"],
  KYC_PENDING: ["KYC_IN_PROGRESS", "KYC_COMPLETED", "CREDIT_PENDING", "CREDIT_COMPLETED", "REJECTED", "EXPIRED", "CANCELLED"],
  KYC_IN_PROGRESS: ["KYC_COMPLETED", "KYC_PENDING", "REJECTED", "EXPIRED", "CANCELLED"],
  KYC_COMPLETED: ["CREDIT_PENDING", "CREDIT_IN_PROGRESS", "CREDIT_COMPLETED", "LENDER_MATCHING", "EXPIRED", "CANCELLED"],
  CREDIT_PENDING: ["CREDIT_IN_PROGRESS", "CREDIT_COMPLETED", "REJECTED", "EXPIRED", "CANCELLED"],
  CREDIT_IN_PROGRESS: ["CREDIT_COMPLETED", "REJECTED", "EXPIRED", "CANCELLED"],
  CREDIT_COMPLETED: ["LENDER_MATCHING", "LENDER_MATCHED", "REJECTED", "EXPIRED", "CANCELLED"],
  LENDER_MATCHING: ["LENDER_MATCHED", "REJECTED", "EXPIRED", "CANCELLED"],
  LENDER_MATCHED: ["OFFER_SELECTED", "LENDER_MATCHING", "REJECTED", "EXPIRED", "CANCELLED"],
  OFFER_SELECTED: ["APPLICATION_SUBMITTED", "LENDER_MATCHED", "CANCELLED", "EXPIRED"],
  APPLICATION_SUBMITTED: ["UNDERWRITING", "APPROVED", "SANCTIONED", "AGREEMENT_PENDING", "REJECTED", "CANCELLED"],
  UNDERWRITING: ["APPROVED", "SANCTIONED", "AGREEMENT_PENDING", "REJECTED", "CANCELLED"],
  APPROVED: ["SANCTIONED", "AGREEMENT_PENDING", "ESIGN_PENDING", "REJECTED", "CANCELLED"],
  SANCTIONED: ["AGREEMENT_PENDING", "ESIGN_PENDING", "CANCELLED"],
  AGREEMENT_PENDING: ["ESIGN_PENDING", "ESIGN_COMPLETED", "CANCELLED"],
  ESIGN_PENDING: ["ESIGN_COMPLETED", "AGREEMENT_PENDING", "CANCELLED"],
  ESIGN_COMPLETED: ["DISBURSEMENT_PENDING", "DISBURSEMENT_PROCESSING", "DISBURSED", "CANCELLED"],
  DISBURSEMENT_PENDING: ["DISBURSEMENT_PROCESSING", "DISBURSED", "CANCELLED"],
  DISBURSEMENT_PROCESSING: ["DISBURSED", "DISBURSEMENT_PENDING", "CANCELLED"],
  DISBURSED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: ["MOBILE_ENTERED", "OTP_PENDING"]
};

export interface TransitionOptions {
  journeyId: number;
  tenantId: number;
  nextState: OriginationState;
  actor?: string;
  actorType?: "customer" | "system" | "lender" | "underwriter";
  requestId?: string;
  ip?: string;
  userAgent?: string;
  providerRef?: string;
  metadata?: Record<string, unknown>;
}

export function canTransition(currentState: OriginationState, nextState: OriginationState): boolean {
  if (currentState === nextState) return true;
  const allowed = ALLOWED_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
}

export async function transitionJourney(opts: TransitionOptions): Promise<{
  success: boolean;
  oldState: OriginationState;
  newState: OriginationState;
  currentStep: string;
}> {
  const journey = await q1<{
    id: number;
    tenant_id: number;
    status: OriginationState;
    current_step: string;
    application_id: number | null;
  }>("SELECT id, tenant_id, status, current_step, application_id FROM origination_journeys WHERE id = ? AND tenant_id = ?", [opts.journeyId, opts.tenantId]);

  if (!journey) {
    throw new Error(`Journey ${opts.journeyId} not found`);
  }

  const oldState = journey.status;
  const nextState = opts.nextState;

  if (!canTransition(oldState, nextState)) {
    throw new Error(`Invalid state transition from ${oldState} to ${nextState}`);
  }

  const currentStep = STEP_MAP[nextState] || journey.current_step;

  await run(
    "UPDATE origination_journeys SET status = ?, current_step = ?, updated_at = datetime('now') WHERE id = ?",
    [nextState, currentStep, journey.id]
  );

  // If connected to a canonical application, synchronize stage where appropriate
  if (journey.application_id) {
    const stageSyncMap: Partial<Record<OriginationState, string>> = {
      APPLICATION_SUBMITTED: "underwriting",
      UNDERWRITING: "underwriting",
      APPROVED: "approval",
      SANCTIONED: "sanction",
      AGREEMENT_PENDING: "agreement",
      ESIGN_PENDING: "esign",
      ESIGN_COMPLETED: "disbursement",
      DISBURSEMENT_PENDING: "disbursement",
      DISBURSED: "disbursement"
    };
    const appStage = stageSyncMap[nextState];
    if (appStage) {
      await run("UPDATE applications SET stage = ?, updated_at = datetime('now') WHERE id = ?", [appStage, journey.application_id]);
    }
  }

  await audit({
    tenantId: opts.tenantId,
    action: "journey.state_transition",
    entityType: "origination_journey",
    entityId: journey.id,
    before: { status: oldState, step: journey.current_step },
    after: {
      status: nextState,
      step: currentStep,
      actor: opts.actor ?? "system",
      actorType: opts.actorType ?? "customer",
      requestId: opts.requestId,
      providerRef: opts.providerRef,
      metadata: opts.metadata
    },
    ip: opts.ip,
    device: opts.userAgent
  });

  return {
    success: true,
    oldState,
    newState: nextState,
    currentStep
  };
}
