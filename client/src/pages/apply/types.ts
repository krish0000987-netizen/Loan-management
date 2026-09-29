export interface JourneyProfile {
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
  monthly_income?: number;
  annual_income?: number;
  credit_score?: number;
}

export interface LenderOffer {
  lender_id: number;
  lender_name: string;
  scheme_id: number;
  scheme_name: string;
  product_name: string;
  max_amount: number;
  roi_pct: number;
  processing_fee_pct: number;
  estimated_emi: number;
  match_score: number;
  approval_probability: "high" | "medium" | "low";
  highlights: string[];
  selected?: boolean;
}

export interface JourneyData {
  id: number;
  journey_id: number;
  token: string;
  mobile: string;
  masked_mobile: string;
  status: string;
  current_step: string;
  completed_steps: string[];
  amount: number;
  tenure: number;
  purpose?: string;
  customer_id?: number;
  customer_name?: string;
  customer_pan?: string;
  application_id?: number;
  application_no?: string;
  selected_lender_id?: number;
  credit_score?: number;
  profile?: JourneyProfile;
  offers?: LenderOffer[];
  sanction?: any;
  disbursement?: {
    status: string;
    loan_no?: string;
    utr?: string;
    amount?: number;
    account_number?: string;
    ifsc?: string;
    beneficiary_name?: string;
    first_emi_date?: string;
  };
}

export type JourneyStep =
  | "mobile"
  | "otp"
  | "consent"
  | "profile"
  | "kyc"
  | "documents"
  | "credit"
  | "offers"
  | "confirm"
  | "underwriting"
  | "agreement"
  | "esign"
  | "disbursement"
  | "success"
  | "dashboard";
