export type ModuleType = 
  | 'crm'
  | 'los'
  | 'lms'
  | 'credit'
  | 'bre'
  | 'underwriting'
  | 'collections'
  | 'payments'
  | 'reconciliation'
  | 'customer_portal'
  | 'dsa_portal'
  | 'field_sales'
  | 'compliance'
  | 'risk'
  | 'analytics'
  | 'ai'
  | 'white_label'
  | 'multi_tenant';

export interface ApplicationRecord {
  id: string;
  applicantName: string;
  loanType: string;
  amount: number;
  tenureMonths: number;
  creditScore: number;
  foir: number;
  dscr: number;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  breStatus: 'PASSED' | 'FAILED' | 'REVIEW';
  underwritingStatus: 'APPROVED' | 'IN_REVIEW' | 'REJECTED' | 'CONDITIONAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  stage: string;
  createdAt: string;
}

export interface UnreconciledPayment {
  id: string;
  utr: string;
  amount: number;
  channel: string;
  date: string;
  candidateLoanId: string;
  candidateBorrower: string;
  confidenceScore: number;
  status: 'PENDING' | 'MATCHED' | 'EXCEPTIONAL' | 'REJECTED';
}

export interface BreRule {
  id: string;
  name: string;
  category: string;
  conditionStr: string;
  minCreditScore: number;
  maxFoir: number;
  minIncome: number;
  maxDpdDays: number;
  actionIfPass: string;
  status: 'ACTIVE' | 'DRAFT' | 'PAUSED';
}

export interface CollectionItem {
  id: string;
  borrowerName: string;
  loanId: string;
  outstandingAmount: number;
  emiAmount: number;
  dpdDays: number;
  ptpDate: string;
  ptpAmount: number;
  bucket: '0-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD';
  lastAction: string;
  status: 'ACTIVE' | 'PTP_KEPT' | 'PTP_BROKEN' | 'FIELD_ASSIGNED';
}

export interface IntegrationPartner {
  id: string;
  name: string;
  category: 'Bureau' | 'Banking/AA' | 'KYC/eKYC' | 'Payments' | 'eSign' | 'Communication';
  status: 'READY' | 'CONNECTED' | 'SANDBOX';
  description: string;
  iconName: string;
}

export interface WhiteLabelBrand {
  id: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  subdomain: string;
  logoText: string;
  kfsHeader: string;
  portalTitle: string;
}

export interface IndustryModel {
  id: string;
  title: string;
  subtitle: string;
  avgTicketSize: string;
  keyFeatures: string[];
  description: string;
  badge: string;
}
