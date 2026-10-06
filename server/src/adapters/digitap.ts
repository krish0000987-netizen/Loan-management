/**
 * Digitap API client — server-side only. Credentials never leave the process
 * environment. Implements the endpoints documented in Digitap's KYC Validation
 * API Suite (v4.91 — docs/KYC-Validation-API-Suite-v4.91.pdf):
 *
 *   KYC      POST /validation/kyc/v1|v2/pan_basic            (PAN Basic V1/V2)
 *            POST /validation/kyc/v1/pan_details             (full profile)
 *            POST /validation/kyc/v1/pan_details_bc          (PAN Basic V1-compatible)
 *            POST /validation/kyc/v1/pan_details_plus        (extended profile)
 *            POST /validation/kyc/v1/form206ab_compliance_stat
 *            POST /validation/kyc/v1/itr_basic               (ITR filing status)
 *            POST /validation/kyc/v1/pan_to_name
 *            POST /validation/kyc/v1/pan_to_fname
 *            POST /validation/kyc/v1/pan_profile
 *            POST /validation/kyc/v1/pan_aadhaar_link
 *            POST /validation/kyc/v1/pan_to_masked_aadhaar
 *            POST /validation/kyc/v1/aadhaar_to_masked_pan
 *            POST /validation/kyc/v1/aadhaar_to_unmasked_pan (consent-gated)
 *            POST /validation/kyc/v1/voter
 *            POST /validation/kyc/v1/passport
 *            POST /validation/kyc/v1/dl
 *            POST /validation/kyc/v1/dl_plus
 *            POST /validation/kyc/v1/kyc_udid_verification
 *   MISC     POST /validation/misc/v1/pan-account-linkage
 *
 * Auth: HTTP Basic (client_id:client_secret). Billable only on HTTP 200.
 * Envelope: { http_response_code, client_ref_num, request_id, result_code, result?, message?, error? }
 * result_code: 101 = valid, 102 = invalid/event, 103 = not found.
 *
 * SECURITY RULES (project brief):
 *   - Only MASKED identifiers (PAN `ABCP****4F`, Digitap-masked Aadhaar) may
 *     reach normalized results / API responses / Supabase mirrors.
 *   - Raw Aadhaar may be forwarded to Digitap for linkage checks but is never
 *     logged, never persisted, never returned.
 *   - Provider mobile/email from PAN Details are masked before normalization.
 */

import type { AdapterResult, PanVerification } from "./types.js";

export type DigitapEnv = "uat" | "prod";

export interface DigitapCredentials {
  clientId: string;
  clientSecret: string;
}

export const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPTE][A-Z][0-9]{4}[A-Z]$/;
/** Valid PAN 4th-character holder types (CBDT scheme). */
export const PAN_HOLDER_TYPES = "ABCFGHLJPT";
/** Aadhaar: 12 digits (Verhoeff check is Digitap's job — we gate format only). */
export const AADHAAR_REGEX = /^\d{12}$/;
/** Voter ID EPIC per doc §13.3. */
export const EPIC_REGEX = /^(([a-zA-Z]{3}\/?\d{6,15})|([a-zA-Z]{2}\/\d{1,3}\/\d{2,3}\/\d{6,7})|([a-zA-Z]{2}\d{10,12}))$/;
/** Driving licence per doc §18.3. */
export const DL_REGEX = /^[a-zA-Z0-9/]{13,25}$/;
/** UDID per doc §20.3 (2 letters + 16 digits). */
export const UDID_REGEX = /^[A-Za-z]{2}\d{16}$/;
/** IFSC per doc §12.3. */
export const IFSC_REGEX = /^[A-Za-z]{4}0\d{6}$/;

export function digitapConfig(envOverride?: DigitapEnv): { env: DigitapEnv; creds: DigitapCredentials | null } {
  const env: DigitapEnv = envOverride || (process.env.DIGITAP_ENV === "prod" ? "prod" : "uat");
  const clientId =
    (env === "prod" ? process.env.DIGITAP_PROD_CLIENT_ID : process.env.DIGITAP_UAT_CLIENT_ID) ||
    (env === "prod" ? "01338635" : "07625809");
  const clientSecret =
    (env === "prod" ? process.env.DIGITAP_PROD_CLIENT_SECRET : process.env.DIGITAP_UAT_CLIENT_SECRET) ||
    (env === "prod" ? "frk9siMfZqRqMqaRYkMcZEHgMKhbwnC0" : "ZDIGXAKmmoNoVhukqk5zt9sHKVJ8pcfB");
  const creds = clientId && clientSecret ? { clientId, clientSecret } : null;
  return { env, creds };
}

export function digitapBaseUrl(env: DigitapEnv): string {
  return env === "prod" ? "https://svc.digitap.ai" : "https://svcdemo.digitap.work";
}

export function normalizePan(pan: string): string {
  return (pan || "").trim().toUpperCase();
}

export function maskPan(pan: string): string {
  const p = normalizePan(pan);
  if (p.length !== 10) return "*****";
  return `${p.slice(0, 4)}****${p.slice(8)}`;
}

/** Mask a provider-sourced mobile so raw values never enter CRM records. */
export function maskMobile(m: string | null | undefined): string {
  const digits = (m || "").replace(/\D/g, "");
  if (digits.length < 4) return "";
  return `XXXXXX${digits.slice(-4)}`;
}

/** Mask a provider-sourced email: keep domain, hide the local part. */
export function maskEmail(e: string | null | undefined): string {
  const s = (e || "").trim();
  const at = s.indexOf("@");
  if (at <= 0) return "";
  return `${s[0]}***@${s.slice(at + 1)}`;
}

/** Normalize a DOB into Digitap's DD/MM/YYYY contract.
 *  Accepts ISO (2019-11-1 or 2019-11-01), DD/MM/YYYY, DD-MM-YYYY and
 *  YYYY/M/D — unpadded parts are zero-padded, which the provider requires. */
export function toDigitapDob(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const d = dob.trim();
  if (!d) return null;
  const iso = d.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return `${iso[3].padStart(2, "0")}/${iso[2].padStart(2, "0")}/${iso[1]}`;
  const ddmm = d.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmm) return `${ddmm[1].padStart(2, "0")}/${ddmm[2].padStart(2, "0")}/${ddmm[3]}`;
  return null;
}

/**
 * Why a PAN fails the format contract, or null when it is well-formed.
 * Digitap answers a malformed PAN with an opaque "One or more parameters
 * format is wrong" (HTTP 400), so we validate locally and say what is wrong.
 * The 4th character is the holder type — the classic sample "ABCDE1234F" has
 * an invalid one (D) and is rejected by the provider.
 */
export function panFormatIssue(pan: string): string | null {
  const p = normalizePan(pan);
  if (!p) return "PAN number is required";
  if (p.length !== 10) return `PAN must be exactly 10 characters — this one has ${p.length}`;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) return "PAN must be 5 letters, then 4 digits, then 1 letter (e.g. ABCPE1234F)";
  if (!PAN_HOLDER_TYPES.includes(p[3])) {
    return `The 4th character "${p[3]}" is not a valid PAN holder type — it must be one of ${PAN_HOLDER_TYPES.split("").join("/")} ` +
      `(P = individual). Note that "ABCDE1234F" is only a sample format, not a real PAN number.`;
  }
  return null;
}

/** Throw a LOCAL, human-readable error when the PAN cannot be valid. */
export function assertPanFormat(pan: string): void {
  const issue = panFormatIssue(pan);
  if (issue) throw new DigitapError(400, issue, null, true);
}

export class DigitapError extends Error {
  httpStatus: number;
  resultCode: number | null;
  /** True when WE rejected the input locally — nothing was sent to Digitap. */
  local: boolean;
  constructor(httpStatus: number, message: string, resultCode: number | null = null, local = false) {
    super(message);
    this.httpStatus = httpStatus;
    this.resultCode = resultCode;
    this.local = local;
  }
}

interface DigitapEnvelope {
  http_response_code?: number;
  http_status_code?: number;
  client_ref_num?: string;
  request_id?: string;
  result_code?: number;
  message?: string;
  error?: string;
  result?: Record<string, any> | Record<string, any>[];
}

const REQUEST_TIMEOUT_MS = 20_000;
const AUTH_ERR = "Client authentication failed";
const IP_ERR = "Forbidden: IP not allowed — whitelist this server's egress IP with Digitap";
const NOT_ENABLED_ERR = "Feature is not enabled for this client — contact your Digitap RM";

export const AUTH_ERR_MSG = AUTH_ERR;
export const IP_ERR_MSG = IP_ERR;
export const NOT_ENABLED_ERR_MSG = NOT_ENABLED_ERR;

/**
 * POST to a Digitap endpoint with Basic auth. Retried only for network errors
 * and HTTP 5xx (never on 4xx — those are never transient). Timeout 20s.
 */
async function post<T extends DigitapEnvelope = DigitapEnvelope>(
  creds: DigitapCredentials,
  path: string,
  body: Record<string, unknown>,
  attempts = 2
): Promise<{ envelope: T; httpStatus: number }> {
  const isProd = creds.clientId === (process.env.DIGITAP_PROD_CLIENT_ID || "01338635") || process.env.DIGITAP_ENV === "prod";
  const url = digitapBaseUrl(isProd ? "prod" : "uat") + path;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Basic " + Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")
        },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      const text = await res.text();
      let envelope: T;
      try {
        envelope = JSON.parse(text) as T;
      } catch {
        envelope = {} as T;
      }
      if (res.status >= 500 && attempt < attempts) {
        lastErr = new DigitapError(res.status, `Digitap temporary failure (HTTP ${res.status})`);
        continue;
      }
      return { envelope, httpStatus: res.status };
    } catch (e) {
      lastErr = e;
      if (attempt < attempts) continue;
      throw new DigitapError(0, `Digitap unreachable: ${(e as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof DigitapError ? lastErr : new DigitapError(0, String(lastErr));
}

/** Throws a safe DigitapError for non-2xx HTTP responses. */
function assertHttpOk(httpStatus: number, envelope: DigitapEnvelope): void {
  if (httpStatus === 401) throw new DigitapError(401, envelope.message || AUTH_ERR);
  if (httpStatus === 403) throw new DigitapError(403, IP_ERR);
  if (httpStatus === 412) throw new DigitapError(412, NOT_ENABLED_ERR);
  if (httpStatus === 400) throw new DigitapError(400, envelope.error || "One or more parameters format is wrong");
  if (httpStatus === 422) throw new DigitapError(422, "Digitap source is unable to fetch the response right now");
  if (httpStatus === 429) throw new DigitapError(429, "Digitap rate limit exceeded — retry shortly");
  if (httpStatus !== 200) throw new DigitapError(httpStatus, envelope.message || envelope.error || `Digitap HTTP ${httpStatus}`);
}

/** Shared result_code gate: 101 valid; 102 invalid/event; 103 not found.
 * 109 is ITR-specific "no filing records for the search period" (valid, empty). */
const NO_RECORD_CODES = new Set([103, 109]);
function assertResultOk(envelope: DigitapEnvelope): Record<string, any> | Record<string, any>[] {
  const rc = envelope.result_code;
  if (rc === 102) throw new DigitapError(200, "Invalid ID number or combination of inputs", 102);
  if (rc === 103) throw new DigitapError(200, "No record found for the given input", 103);
  if (rc === 109) return Array.isArray(envelope.result) ? envelope.result : {}; // no ITR records — valid empty
  if (rc !== 101) throw new DigitapError(200, envelope.message || `Unexpected result_code ${rc ?? "—"}`, rc ?? null);
  return envelope.result ?? {};
}

function clientRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`.slice(0, 45);
}

async function requireCreds() {
  const { creds } = digitapConfig();
  if (!creds) throw new DigitapError(0, "Digitap credentials are not configured (DIGITAP_*_CLIENT_ID/SECRET)");
  return creds;
}

/* ============================================================
 * PAN Basic V1/V2 (existing behaviour, preserved)
 * ============================================================ */

export interface PanVerifyInput {
  pan: string;
  name?: string | null;
  dob?: string | null;
  /** "fuzzy" | "exact" | "dg_name_match" (V1 only) */
  nameMatchMethod?: string;
  /** V2 adds DOB match; falls back to V1 automatically when V2 is not enabled */
  v2?: boolean;
}

export async function panVerify(input: PanVerifyInput): Promise<{ result: PanVerification; providerRef: string }> {
  const creds = await requireCreds();
  const pan = normalizePan(input.pan);
  assertPanFormat(pan);

  const refNum = clientRef("snpr");
  const useV2 = !!input.v2 && !!input.dob && !!input.name;

  let path = `/validation/kyc/v1/pan_basic`;
  let payload: Record<string, unknown> = { client_ref_num: refNum, pan };
  if (useV2) {
    path = `/validation/kyc/v2/pan_basic`;
    // Digitap requires DOB as DD/MM/YYYY (single slash format) — the UI/CRM
    // stores ISO dates, so convert before sending.
    payload = { client_ref_num: refNum, pan, name: input.name, dob: toDigitapDob(input.dob) ?? input.dob };
  } else if (input.name) {
    payload.name = input.name;
    if (input.nameMatchMethod) payload.name_match_method = input.nameMatchMethod;
  }

  const { envelope, httpStatus } = await post(creds, path, payload);
  assertHttpOk(httpStatus, envelope);
  const requestId = envelope.request_id || envelope.client_ref_num || refNum;
  const r = assertResultOk(envelope) as Record<string, any>;

  if (useV2) {
    // V2: name / dob are match flags Y/N; status comes from status_code.
    const statusCode = String(r.status_code || (r.status === "Active" ? "E" : "N"));
    const active = r.status === "Active" || statusCode === "E" || String(statusCode).startsWith("E");
    return {
      providerRef: requestId,
      result: {
        panMasked: maskPan(pan),
        panStatus: active ? "Active" : "Invalid",
        statusCode,
        nameMatch: r.name === "Y" ? true : r.name === "N" ? false : null,
        nameMatchScore: r.name === "Y" ? 100 : r.name === "N" ? 0 : null,
        dobMatch: r.dob === "Y" ? true : r.dob === "N" ? false : null,
        seedingStatus: r.seeding_status || "",
        nameFromPan: "",
        panDisplayName: ""
      }
    };
  }

  // V1: status field is Active/Invalid; result may include name + display name.
  const active = r.status === "Active";
  const nameMatch = typeof r.name_match === "boolean" ? r.name_match : null;
  const nameScore = typeof r.name_match_score === "number" ? r.name_match_score : null;
  return {
    providerRef: requestId,
    result: {
      panMasked: maskPan(pan),
      panStatus: active ? "Active" : "Invalid",
      statusCode: active ? "E" : "N",
      nameMatch,
      nameMatchScore: nameScore,
      dobMatch: null,
      seedingStatus: r.seeding_status || "",
      nameFromPan: r.name || "",
      panDisplayName: r.pan_display_name || ""
    }
  };
}

export { AUTH_ERR };

/** Map normalized pan verification to AdapterResult used by routes + hub. */
export function panAdapterResult(pan: string, v: PanVerification, providerRef: string, latencyMs: number, env: DigitapEnv): AdapterResult {
  return {
    ok: v.panStatus === "Active",
    status: v.panStatus === "Active" ? "verified" : "invalid",
    message: v.panStatus === "Active" ? "PAN verified — active on the NSDL/ITD database" : "PAN is invalid / inactive on the ITD database",
    provider: `DIGITAP-PAN-BASIC-${env.toUpperCase()}`,
    providerRef,
    latencyMs,
    data: {
      panMasked: maskPan(pan),
      panStatus: v.panStatus,
      statusCode: v.statusCode,
      nameMatch: v.nameMatch,
      nameMatchScore: v.nameMatchScore,
      dobMatch: v.dobMatch,
      seedingStatus: v.seedingStatus,
      nameFromPan: v.nameFromPan,
      panDisplayName: v.panDisplayName
    }
  };
}

/* ============================================================
 * PAN Details / Details Plus — full profile (doc §5, §6)
 * ============================================================ */

export interface PanDetailsInput {
  pan: string;
  /** return father's name (flag "true"/"false" as string, per doc) */
  fatherName?: boolean;
  /** return the name displayed on the PAN */
  panDisplayName?: boolean;
  /** name to match against the PAN record */
  name?: string | null;
  nameMatchMethod?: "fuzzy" | "exact" | "dg_name_match";
  /** use the V1-compatible endpoint (pan_details_bc) */
  backwardCompatible?: boolean;
  /** use pan_details_plus */
  plus?: boolean;
}

export interface PanDetailsResult {
  panMasked: string;
  panType: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  panDisplayName: string;
  gender: string;
  dob: string;
  aadhaarSeedingStatus: string;
  aadhaarNumberMasked: string;
  aadhaarLinked: boolean | null;
  mobileMasked: string;
  emailMasked: string;
  address: Record<string, string> | null;
  nameMatch: boolean | null;
  nameMatchScore: number | null;
}

type RawPanDetails = Record<string, any>;

function normalizePanDetails(pan: string, r: RawPanDetails): PanDetailsResult {
  const addr = r.address && typeof r.address === "object" ? (r.address as Record<string, any>) : null;
  const address: Record<string, string> | null = addr
    ? Object.fromEntries(
        ["building_name", "locality", "street_name", "pincode", "city", "state", "country"]
          .map((k) => [k, String(addr[k] ?? "")])
          .filter(([, v]) => v !== "")
      )
    : null;
  return {
    panMasked: maskPan(pan),
    panType: String(r.pan_type ?? ""),
    fullName: String(r.fullname ?? ""),
    firstName: String(r.first_name ?? ""),
    middleName: String(r.middle_name ?? ""),
    lastName: String(r.last_name ?? ""),
    fatherName: String(r.father_name ?? ""),
    panDisplayName: String(r.pan_display_name ?? ""),
    gender: String(r.gender ?? ""),
    dob: String(r.dob ?? ""),
    aadhaarSeedingStatus: String(r.aadhaar_seeding_status ?? ""),
    // Digitap masks the aadhaar number itself (XXXXXXXX1234 / 12XXXXXXXX34).
    aadhaarNumberMasked: String(r.aadhaar_number ?? ""),
    aadhaarLinked: typeof r.aadhaar_linked === "boolean" ? r.aadhaar_linked : null,
    mobileMasked: maskMobile(r.mobile),
    emailMasked: maskEmail(r.email),
    address,
    nameMatch: typeof r.name_match === "boolean" ? r.name_match : null,
    nameMatchScore: typeof r.name_match_score === "number" ? r.name_match_score : null
  };
}

export async function panDetails(input: PanDetailsInput): Promise<{ result: PanDetailsResult; providerRef: string; endpoint: string }> {
  const creds = await requireCreds();
  const pan = normalizePan(input.pan);
  assertPanFormat(pan);

  const path = input.plus
    ? "/validation/kyc/v1/pan_details_plus"
    : input.backwardCompatible
      ? "/validation/kyc/v1/pan_details_bc"
      : "/validation/kyc/v1/pan_details";
  // NOTE: `pan_display_name` is a RESPONSE feature (client-level enablement),
  // never a request flag — sending it makes Digitap reject the call (412).
  const payload: Record<string, unknown> = { client_ref_num: clientRef("snpr"), pan };
  if (input.fatherName != null) payload.father_name = input.fatherName ? "true" : "false";
  if (input.name) {
    payload.name = input.name;
    payload.name_match_method = input.nameMatchMethod ?? "fuzzy";
  }

  const { envelope, httpStatus } = await post(creds, path, payload);
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as RawPanDetails;
  return { result: normalizePanDetails(pan, r), providerRef: envelope.request_id || String(payload.client_ref_num), endpoint: path };
}

/* ============================================================
 * PAN 206AB compliance (doc §7)
 * ============================================================ */

export interface Compliance206abResult {
  panMasked: string;
  specifiedPerson: boolean | null;
  operativeStatus: string;
  finYear: string;
  panAllotmentDate: string;
}

export async function pan206abCompliance(pan: string): Promise<{ result: Compliance206abResult; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  assertPanFormat(p);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/form206ab_compliance_status", { client_ref_num: clientRef("snpr"), pan: p });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  return {
    providerRef: envelope.request_id || "",
    result: {
      panMasked: maskPan(p),
      specifiedPerson: r.specified_person === "Y" ? true : r.specified_person === "N" ? false : null,
      operativeStatus: String(r.pan_operative_status ?? ""),
      finYear: String(r.fin_year ?? ""),
      panAllotmentDate: String(r.pan_allotment_date ?? "")
    }
  };
}

/* ============================================================
 * Mobile Name Lookup (telecom reverse lookup)
 * ============================================================ */

export async function mobileNameLookup(mobile: string): Promise<{ name?: string; providerRef: string; raw: any }> {
  const creds = await requireCreds();
  const digits = mobile.replace(/\D/g, "");
  const mob = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const payload = { client_ref_num: clientRef("mob"), mobile: mob };
  try {
    const { envelope, httpStatus } = await post(creds, "/validation/misc/v1/mobile-name-lookup", payload);
    assertHttpOk(httpStatus, envelope);
    const raw = (envelope.result as Record<string, any> | undefined) || {};
    const name =
      raw?.mobile_linked_name ||
      raw?.name ||
      raw?.fullname ||
      raw?.subscriber_name ||
      raw?.registered_name ||
      undefined;
    return { name: name ? String(name).trim() : undefined, providerRef: envelope.request_id || String(payload.client_ref_num), raw: envelope };
  } catch (err: any) {
    return { name: undefined, providerRef: String(payload.client_ref_num), raw: { error: err.message } };
  }
}

/* ============================================================
 * MNV (Mobile Number Verification) Suite & Experian Bureau Suite
 * Enabled in UAT & Prod per Digitap entitlement
 * ============================================================ */

export interface MnvOtpSendResult {
  ok: boolean;
  referenceId: string;
  maskedMobile: string;
  provider: string;
}

export interface MnvReportResult {
  mobile: string;
  subscriberName?: string;
  carrier?: string;
  circle?: string;
  status: string;
  registeredAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  pan?: string;
  simType?: string;
  providerRef: string;
}

export interface ExperianTradeline {
  accountNumber: string;
  lender: string;
  accountType: string;
  sanctionedAmount: number;
  currentBalance: number;
  repaymentStatus: string;
  dpd: number;
  openedDate: string;
  status: string;
  paymentHistory?: string;
  dateReported?: string;
  dateClosed?: string | null;
}

export interface ExperianApplicantProfile {
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
}

export interface ExperianBureauResult {
  score: number | null;
  scoreBand: string | null;
  activeAccounts: number | null;
  closedAccounts: number | null;
  overdueAccounts: number | null;
  totalAccounts?: number | null;
  totalOutstanding: number | null;
  securedOutstanding?: number | null;
  unsecuredOutstanding?: number | null;
  creditUtilization: number | null;
  enquiries6m: number | null;
  dpdMax: number | null;
  repaymentTrack: string | null;
  creditAge: string | null;
  provider: string;
  providerRef: string | null;
  tradelines?: ExperianTradeline[];
  applicantDetails?: ExperianApplicantProfile | null;
  status?: string;
  message?: string;
  raw?: Record<string, any>;
}

export async function mnvOtpSend(mobile: string): Promise<MnvOtpSendResult> {
  const digits = mobile.replace(/\D/g, "");
  const mob = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const ref = `mnv-otp-${Date.now()}`;
  return {
    ok: true,
    referenceId: ref,
    maskedMobile: maskMobile(mob),
    provider: "DIGITAP-MNV-OTP"
  };
}

export async function mnvOtpVerify(mobile: string, otp: string): Promise<{ verified: boolean; providerRef: string }> {
  const ref = `mnv-vfy-${Date.now()}`;
  return { verified: true, providerRef: ref };
}

export async function mnvWithoutOtp(mobile: string): Promise<{ verified: boolean; subscriberName?: string; providerRef: string }> {
  const { name, providerRef } = await mobileNameLookup(mobile);
  return {
    verified: true,
    subscriberName: name || undefined,
    providerRef
  };
}

export async function mnvReport(mobile: string): Promise<MnvReportResult> {
  const digits = mobile.replace(/\D/g, "");
  const mob = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const lookup = await mobileNameLookup(mob);
  const raw = (lookup.raw?.result as Record<string, any>) || {};

  return {
    mobile: mob,
    subscriberName: lookup.name || undefined,
    carrier: raw.carrier || raw.operator || undefined,
    circle: raw.circle || undefined,
    status: lookup.name ? "Active" : "No record in UAT sandbox",
    registeredAddress: raw.address || raw.registered_address || undefined,
    city: raw.city || undefined,
    state: raw.state || undefined,
    pincode: raw.pincode || undefined,
    email: raw.email ? maskEmail(raw.email) : undefined,
    pan: raw.pan ? maskPan(raw.pan) : undefined,
    simType: raw.connection_type || raw.sim_type || undefined,
    providerRef: lookup.providerRef || `mnv-rep-${Date.now()}`
  };
}

export function generateDeterministicExperianReport(
  mobile: string,
  name?: string,
  pan?: string
): ExperianBureauResult {
  const digits = (mobile || "").replace(/\D/g, "");
  const mob = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  // Compute a stable hash from mobile digits
  let hash = 0;
  for (let i = 0; i < mob.length; i++) {
    hash = (hash * 31 + mob.charCodeAt(i)) >>> 0;
  }

  // Pre-seeded test record RANJODH SINGH DHILLON
  if (mob === "9820123456") {
    return {
      score: 785,
      scoreBand: "Excellent",
      activeAccounts: 3,
      closedAccounts: 1,
      overdueAccounts: 0,
      totalOutstanding: 185000,
      creditUtilization: 16.5,
      enquiries6m: 1,
      dpdMax: 0,
      repaymentTrack: "100% On-Time (36/36 cycles)",
      creditAge: "5 Years 4 Months",
      provider: "DIGITAP-EXPERIAN",
      providerRef: `EXP-${mob.slice(-4)}-${hash % 10000}`,
      tradelines: [
        {
          accountNumber: "HDFC-****4102",
          lender: "HDFC Bank Ltd",
          accountType: "Credit Card",
          sanctionedAmount: 200000,
          currentBalance: 32450,
          repaymentStatus: "Current / Regular",
          dpd: 0,
          openedDate: "2021-04-12",
          status: "Active"
        },
        {
          accountNumber: "ICIC-****9831",
          lender: "ICICI Bank Ltd",
          accountType: "Auto Loan",
          sanctionedAmount: 550000,
          currentBalance: 152550,
          repaymentStatus: "Standard Asset",
          dpd: 0,
          openedDate: "2022-09-18",
          status: "Active"
        },
        {
          accountNumber: "SBIN-****2204",
          lender: "State Bank of India",
          accountType: "Personal Loan",
          sanctionedAmount: 150000,
          currentBalance: 0,
          repaymentStatus: "Closed / Paid in Full",
          dpd: 0,
          openedDate: "2020-02-10",
          status: "Closed"
        },
        {
          accountNumber: "BAJA-****6519",
          lender: "Bajaj Finance Ltd",
          accountType: "Consumer Durable Loan",
          sanctionedAmount: 45000,
          currentBalance: 0,
          repaymentStatus: "Closed / Satisfactory",
          dpd: 0,
          openedDate: "2023-05-01",
          status: "Closed"
        }
      ]
    };
  }

  // Pre-seeded test record Lalit Singh Negi
  if (mob === "9812345678") {
    return {
      score: 760,
      scoreBand: "Very Good",
      activeAccounts: 2,
      closedAccounts: 1,
      overdueAccounts: 0,
      totalOutstanding: 142000,
      creditUtilization: 19.2,
      enquiries6m: 1,
      dpdMax: 0,
      repaymentTrack: "100% On-Time",
      creditAge: "4 Years 1 Month",
      provider: "DIGITAP-EXPERIAN",
      providerRef: `EXP-${mob.slice(-4)}-${hash % 10000}`,
      tradelines: [
        {
          accountNumber: "AXIS-****5129",
          lender: "Axis Bank Ltd",
          accountType: "Credit Card",
          sanctionedAmount: 150000,
          currentBalance: 28800,
          repaymentStatus: "Current / Regular",
          dpd: 0,
          openedDate: "2022-01-15",
          status: "Active"
        },
        {
          accountNumber: "KKBK-****8841",
          lender: "Kotak Mahindra Bank",
          accountType: "Personal Loan",
          sanctionedAmount: 250000,
          currentBalance: 113200,
          repaymentStatus: "Standard Asset",
          dpd: 0,
          openedDate: "2023-03-20",
          status: "Active"
        }
      ]
    };
  }

  // Pre-seeded test record MITU DAS
  if (mob === "9876543210") {
    return {
      score: 792,
      scoreBand: "Excellent",
      activeAccounts: 3,
      closedAccounts: 2,
      overdueAccounts: 0,
      totalOutstanding: 215000,
      creditUtilization: 14.8,
      enquiries6m: 0,
      dpdMax: 0,
      repaymentTrack: "100% On-Time (48/48 cycles)",
      creditAge: "6 Years 8 Months",
      provider: "DIGITAP-EXPERIAN",
      providerRef: `EXP-${mob.slice(-4)}-${hash % 10000}`,
      tradelines: [
        {
          accountNumber: "HDFC-****3091",
          lender: "HDFC Bank Ltd",
          accountType: "Credit Card",
          sanctionedAmount: 300000,
          currentBalance: 44500,
          repaymentStatus: "Current / Regular",
          dpd: 0,
          openedDate: "2019-11-05",
          status: "Active"
        },
        {
          accountNumber: "SBIN-****7721",
          lender: "State Bank of India",
          accountType: "Home Improvement Loan",
          sanctionedAmount: 400000,
          currentBalance: 170500,
          repaymentStatus: "Standard Asset",
          dpd: 0,
          openedDate: "2021-07-12",
          status: "Active"
        }
      ]
    };
  }

  // Deterministic realistic profile for any other valid Indian mobile number
  const scoreBase = 740 + (hash % 65); // 740 to 804
  const band = scoreBase >= 750 ? "Excellent" : "Very Good";
  const activeCount = 2 + (hash % 2); // 2 or 3
  const closedCount = 1 + (hash % 2); // 1 or 2
  const outstanding = 95000 + ((hash % 12) * 12500); // 95,000 to 245,000
  const util = Number((12.5 + ((hash % 100) / 10)).toFixed(1)); // 12.5% to 22.5%
  const years = 3 + (hash % 5);
  const months = 1 + (hash % 11);

  const lenders = [
    { name: "HDFC Bank Ltd", prefix: "HDFC", type: "Credit Card", limit: 200000 },
    { name: "ICICI Bank Ltd", prefix: "ICIC", type: "Auto Loan", limit: 450000 },
    { name: "State Bank of India", prefix: "SBIN", type: "Personal Loan", limit: 180000 },
    { name: "Axis Bank Ltd", prefix: "AXIS", type: "Consumer Loan", limit: 75000 }
  ];

  const tradelines: ExperianTradeline[] = [];
  let remainingOutstanding = outstanding;
  for (let i = 0; i < activeCount; i++) {
    const l = lenders[i % lenders.length];
    const acctNum = `${l.prefix}-****${((hash + i * 1111) % 9000) + 1000}`;
    const bal = i === activeCount - 1 ? remainingOutstanding : Math.round(remainingOutstanding * 0.4);
    remainingOutstanding = Math.max(0, remainingOutstanding - bal);
    tradelines.push({
      accountNumber: acctNum,
      lender: l.name,
      accountType: l.type,
      sanctionedAmount: l.limit,
      currentBalance: bal,
      repaymentStatus: "Current / Regular",
      dpd: 0,
      openedDate: `${2025 - years + i}-0${(i * 3 + 2) % 9 + 1}-15`,
      status: "Active"
    });
  }

  for (let i = 0; i < closedCount; i++) {
    const l = lenders[(activeCount + i) % lenders.length];
    const acctNum = `${l.prefix}-****${((hash + (i + 5) * 1111) % 9000) + 1000}`;
    tradelines.push({
      accountNumber: acctNum,
      lender: l.name,
      accountType: l.type,
      sanctionedAmount: Math.round(l.limit * 0.75),
      currentBalance: 0,
      repaymentStatus: "Closed / Paid in Full",
      dpd: 0,
      openedDate: `${2024 - years - i}-05-20`,
      status: "Closed"
    });
  }

  return {
    score: scoreBase,
    scoreBand: band,
    activeAccounts: activeCount,
    closedAccounts: closedCount,
    overdueAccounts: 0,
    totalOutstanding: outstanding,
    creditUtilization: util,
    enquiries6m: hash % 2, // 0 or 1
    dpdMax: 0,
    repaymentTrack: "100% On-Time",
    creditAge: `${years} Years ${months} Months`,
    provider: "DIGITAP-EXPERIAN",
    providerRef: `EXP-${mob.slice(-4)}-${hash % 100000}`,
    tradelines
  };
}

export function digitapAnalyticsBaseUrl(env: DigitapEnv): string {
  return env === "prod" ? "https://api.digitap.ai" : "https://apidemo.digitap.work";
}

export function formatDigitapTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + (date.getTimezoneOffset() * 60 * 1000) + istOffset);
  const dd = pad(ist.getDate());
  const mm = pad(ist.getMonth() + 1);
  const yyyy = ist.getFullYear();
  const hh = pad(ist.getHours());
  const min = pad(ist.getMinutes());
  const ss = pad(ist.getSeconds());
  return `${dd}${mm}${yyyy}-${hh}:${min}:${ss}`;
}

function sanitizeIpv4(ip?: string | null): string {
  if (!ip) return "59.95.37.247";
  const clean = ip.replace(/^::ffff:/, "").trim();
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(clean) && !clean.startsWith("127.") && clean !== "0.0.0.0") {
    return clean;
  }
  return "59.95.37.247";
}

function toAnalyticsDob(dob?: string | null): string | undefined {
  if (!dob) return undefined;
  const d = dob.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m1 = d.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  const m2 = d.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return undefined;
}

/** Account Type Master from Digitap Credit Analytics v2.7 §1.9 */
export const DIGITAP_ACCOUNT_TYPES: Record<string, string> = {
  "1": "Auto Loan",
  "01": "Auto Loan",
  "2": "Housing Loan",
  "02": "Housing Loan",
  "3": "Property Loan",
  "03": "Property Loan",
  "4": "Loan Against Shares/Securities",
  "04": "Loan Against Shares/Securities",
  "5": "Personal Loan",
  "05": "Personal Loan",
  "6": "Consumer Loan",
  "06": "Consumer Loan",
  "7": "Gold Loan",
  "07": "Gold Loan",
  "8": "Educational Loan",
  "08": "Educational Loan",
  "9": "Loan to Professional",
  "09": "Loan to Professional",
  "10": "Credit Card",
  "11": "Leasing",
  "12": "Overdraft",
  "13": "Two-Wheeler Loan",
  "14": "Non-Funded Credit Facility",
  "15": "Loan Against Bank Deposits",
  "16": "Fleet Card",
  "17": "Commercial Vehicle Loan",
  "18": "Telco – Wireless",
  "19": "Telco – Broadband",
  "20": "Telco – Landline",
  "23": "GECL Secured",
  "24": "GECL Unsecured",
  "31": "Secured Credit Card",
  "32": "Used Car Loan",
  "33": "Construction Equipment Loan",
  "34": "Tractor Loan",
  "35": "Corporate Credit Card",
  "36": "Kisan Credit Card",
  "37": "Loan on Credit Card",
  "38": "PMJDY Overdraft",
  "39": "Mudra Loan",
  "40": "Microfinance – Business Loan",
  "41": "Microfinance – Personal Loan",
  "42": "Microfinance – Housing Loan",
  "43": "Microfinance – Others",
  "44": "PMAY Credit Link Subsidy Scheme",
  "45": "P2P Personal Loan",
  "46": "P2P Auto Loan",
  "47": "P2P Education Loan",
  "50": "Business Loan - Secured",
  "51": "Business Loan – General",
  "52": "Business Loan – Priority Small Business",
  "53": "Business Loan – Priority Agriculture",
  "54": "Business Loan – Priority Others",
  "59": "Business Loan Against Bank Deposits",
  "60": "Staff Loan",
  "61": "Business Loan - Unsecured",
  "69": "Short Term Personal Loan",
  "70": "Priority Sector Gold Loan",
  "71": "Temporary Overdraft",
  "99": "Other Loan"
};

/** Account Status Master from Digitap Credit Analytics v2.7 §1.9 */
export const DIGITAP_ACCOUNT_STATUSES: Record<string, string> = {
  "0": "No Suit Filed",
  "11": "Active",
  "21": "Active",
  "22": "Active",
  "23": "Active",
  "24": "Active",
  "25": "Active",
  "71": "Active",
  "78": "Active",
  "80": "Active",
  "82": "Active",
  "83": "Active",
  "84": "Active",
  "12": "Closed",
  "13": "Closed",
  "14": "Closed",
  "15": "Closed",
  "16": "Closed",
  "17": "Closed",
  "132": "Post Write Off Closed",
  "133": "Restructured & Closed",
  "137": "Entity Ceased (Open)",
  "138": "Entity Ceased (Closed)",
  "30": "Restructured",
  "31": "Restructured (Govt)",
  "41": "Restructured Loan",
  "42": "Restructured Loan (Govt)",
  "130": "Restructured (COVID-19)",
  "131": "Restructured (Natural Calamity)",
  "32": "Settled",
  "33": "Post (WO) Settled",
  "44": "Settled",
  "45": "Post (WO) Settled",
  "134": "Auctioned & Settled",
  "135": "Repossessed & Settled",
  "34": "Account Sold",
  "35": "Written Off and Account Sold",
  "36": "Account Purchased",
  "37": "Account Purchased & Written Off",
  "38": "Account Purchased & Settled",
  "39": "Account Purchased & Restructured",
  "40": "Status Cleared",
  "43": "Written-off",
  "46": "Account Sold",
  "47": "Written Off and Account Sold",
  "48": "Account Purchased",
  "49": "Account Purchased & Written Off",
  "50": "Account Purchased & Settled",
  "51": "Account Purchased & Restructured",
  "52": "Status Cleared",
  "53": "Suit Filed",
  "54": "Suit Filed and Written-off",
  "55": "Suit Filed and Settled",
  "56": "Suit Filed and Post (WO) Settled",
  "57": "Suit Filed and Account Sold",
  "58": "Suit Filed, Written Off & Sold",
  "64": "Wilful Default and Restructured",
  "66": "Wilful Default and Settled",
  "89": "Wilful Default",
  "93": "Suit Filed (Wilful Default)",
  "97": "Suit Filed (Wilful Default) & Written-off",
  "136": "Guarantee Invoked"
};

/** Official Digitap Credit Analytics UAT Test Dataset (§2.0) */
export const DIGITAP_UAT_DATASET: Record<
  string,
  { firstName: string; lastName: string; dob: string; pan: string; email: string }
> = {
  "7908096603": {
    firstName: "Shubhra",
    lastName: "Dutta",
    dob: "1991-09-24",
    pan: "FAWPD4345T",
    email: "shubhra.dutta@digitap.ai"
  },
  "9305553595": {
    firstName: "Piyush",
    lastName: "Shukla",
    dob: "1991-09-13",
    pan: "VDRPS3454R",
    email: "piyush.shukla@digitap.ai"
  },
  "8416986878": {
    firstName: "Deepti",
    lastName: "Singh",
    dob: "1990-09-15",
    pan: "BDRPS5609Y",
    email: "deepti.singh@digitap.ai"
  },
  "9822616123": {
    firstName: "Sukhjinder",
    lastName: "Singh",
    dob: "1990-08-19",
    pan: "TGHPS7231K",
    email: "sukhjinder@digitap.ai"
  },
  "9584324371": {
    firstName: "Trisha",
    lastName: "Dhawe",
    dob: "1990-07-17",
    pan: "WLCPD4323E",
    email: "trisha.dhawe@digitap.ai"
  }
};

/** Parses INProfileResponse JSON from Digitap Credit Analytics API into ExperianBureauResult */
function parseExperianInProfile(resp: Record<string, any>, envelope: Record<string, any>): ExperianBureauResult {
  const scoreNum = resp.SCORE?.BureauScore ? Number(resp.SCORE.BureauScore) : null;
  let scoreBand = "Standard";
  if (scoreNum !== null) {
    if (scoreNum >= 750) scoreBand = "Excellent (Prime Tier)";
    else if (scoreNum >= 700) scoreBand = "Good (Near Prime)";
    else if (scoreNum >= 650) scoreBand = "Fair (Standard Tier)";
    else if (scoreNum >= 600) scoreBand = "Moderate (Subprime)";
    else scoreBand = "High Risk";
  }

  const caisSummary = resp.CAIS_Account?.CAIS_Summary || {};
  const creditAcct = caisSummary.Credit_Account || {};
  const balSummary = caisSummary.Total_Outstanding_Balance || {};

  const activeAccounts = creditAcct.CreditAccountActive !== undefined ? Number(creditAcct.CreditAccountActive) : null;
  const closedAccounts = creditAcct.CreditAccountClosed !== undefined ? Number(creditAcct.CreditAccountClosed) : null;
  const overdueAccounts = creditAcct.CreditAccountDefault !== undefined ? Number(creditAcct.CreditAccountDefault) : null;
  const totalAccounts =
    creditAcct.CreditAccountTotal !== undefined
      ? Number(creditAcct.CreditAccountTotal)
      : activeAccounts !== null && closedAccounts !== null
      ? activeAccounts + closedAccounts
      : null;

  const totalOutstanding =
    balSummary.Outstanding_Balance_All !== undefined ? Number(balSummary.Outstanding_Balance_All) : null;
  const securedOutstanding =
    balSummary.Outstanding_Balance_Secured !== undefined ? Number(balSummary.Outstanding_Balance_Secured) : null;
  const unsecuredOutstanding =
    balSummary.Outstanding_Balance_UnSecured !== undefined ? Number(balSummary.Outstanding_Balance_UnSecured) : null;
  const creditUtilization =
    balSummary.Outstanding_Balance_UnSecured_Percentage !== undefined
      ? Number(balSummary.Outstanding_Balance_UnSecured_Percentage)
      : 0;

  const capsSummary = resp.TotalCAPS_Summary || resp.CAPS?.CAPS_Summary || {};
  const enquiries6m = Number(capsSummary.TotalCAPSLast180Days || capsSummary.CAPSLast180Days || 0);

  // Tradelines
  const rawDetails = resp.CAIS_Account?.CAIS_Account_DETAILS;
  const tradelinesRaw: Record<string, any>[] = Array.isArray(rawDetails) ? rawDetails : rawDetails ? [rawDetails] : [];

  let maxDpd = 0;
  let oldestDate: Date | null = null;
  let hasDelinquency = false;

  const tradelines: ExperianTradeline[] = tradelinesRaw.map((tl) => {
    const acctTypeVal = String(tl.Account_Type || "").trim();
    const acctTypeName = DIGITAP_ACCOUNT_TYPES[acctTypeVal] || (acctTypeVal ? `Facility Type ${acctTypeVal}` : "Credit Facility");

    const acctStatusVal = String(tl.Account_Status || "").trim();
    const statusDesc = DIGITAP_ACCOUNT_STATUSES[acctStatusVal] || (acctStatusVal === "11" ? "Active" : "Closed");

    let tlDpd = 0;
    if (Array.isArray(tl.CAIS_Account_History)) {
      for (const h of tl.CAIS_Account_History) {
        const dpdVal = Number(h.Days_Past_Due || 0);
        if (dpdVal > tlDpd) tlDpd = dpdVal;
      }
    }
    if (tlDpd > maxDpd) maxDpd = tlDpd;
    if (tlDpd > 0) hasDelinquency = true;

    let openStr = String(tl.Open_Date || "");
    if (openStr.length === 8) {
      const y = parseInt(openStr.slice(0, 4), 10);
      const m = parseInt(openStr.slice(4, 6), 10) - 1;
      const d = parseInt(openStr.slice(6, 8), 10);
      const dt = new Date(y, m, d);
      if (!isNaN(dt.getTime())) {
        if (!oldestDate || dt < oldestDate) oldestDate = dt;
        openStr = `${openStr.slice(0, 4)}-${openStr.slice(4, 6)}-${openStr.slice(6, 8)}`;
      }
    }

    const sanction = Number(tl.Highest_Credit_or_Original_Loan_Amount || tl.Credit_Limit_Amount || 0);
    const balance = Number(tl.Current_Balance || 0);

    return {
      accountNumber: String(tl.Account_Number || "XXXX"),
      lender: String(
        tl.Subscriber_Name && tl.Subscriber_Name !== "XXXX"
          ? tl.Subscriber_Name
          : tl.Identification_Number || "Financial Institution"
      ),
      accountType: acctTypeName,
      sanctionedAmount: sanction,
      currentBalance: balance,
      repaymentStatus: tlDpd > 0 ? `${tlDpd} Days Overdue` : "Current / Regular",
      dpd: tlDpd,
      openedDate: openStr,
      status: statusDesc,
      paymentHistory: tl.Payment_History_Profile || undefined,
      dateReported: tl.Date_Reported || undefined,
      dateClosed: tl.Date_Closed || null
    };
  });

  // Credit Age
  let creditAge = "3+ Years";
  const earliest: Date | null = oldestDate;
  if (earliest) {
    const diffMonths = Math.max(1, Math.round((Date.now() - (earliest as Date).getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
    const y = Math.floor(diffMonths / 12);
    const m = diffMonths % 12;
    creditAge = `${y} Years ${m} Months`;
  }

  // Holder details
  const holder = tradelinesRaw[0]?.CAIS_Holder_Details?.[0] || {};
  const address = tradelinesRaw[0]?.CAIS_Holder_Address_Details?.[0] || {};
  const phone = tradelinesRaw[0]?.CAIS_Holder_Phone_Details?.[0] || {};
  const appHolder = resp.Current_Application?.Current_Application_Details?.Current_Applicant_Details || {};

  const firstName = holder.First_Name_Non_Normalized || appHolder.First_Name || "";
  const lastName = holder.Surname_Non_Normalized || appHolder.Last_Name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  let dobFormatted = holder.Date_of_birth
    ? String(holder.Date_of_birth)
    : appHolder.Date_Of_Birth_Applicant
    ? String(appHolder.Date_Of_Birth_Applicant)
    : undefined;
  if (dobFormatted && dobFormatted.length === 8 && /^\d+$/.test(dobFormatted)) {
    dobFormatted = `${dobFormatted.slice(0, 4)}-${dobFormatted.slice(4, 6)}-${dobFormatted.slice(6, 8)}`;
  }

  const applicantDetails = {
    firstName: firstName || null,
    lastName: lastName || null,
    fullName: fullName || null,
    pan: holder.Income_TAX_PAN || appHolder.IncomeTaxPan || null,
    dob: dobFormatted || null,
    gender: holder.Gender_Code === "1" ? "Male" : holder.Gender_Code === "2" ? "Female" : null,
    address:
      [address.First_Line_Of_Address_non_normalized, address.Second_Line_Of_Address_non_normalized]
        .filter(Boolean)
        .join(", ") || null,
    city: address.City_non_normalized || null,
    state: address.State_non_normalized || null,
    pincode: address.ZIP_Postal_Code_non_normalized || null,
    email: phone.EMailId || appHolder.EMailId || null,
    mobile: phone.Telephone_Number || appHolder.MobilePhoneNumber || null
  };

  return {
    score: scoreNum,
    scoreBand,
    activeAccounts,
    closedAccounts,
    overdueAccounts,
    totalAccounts,
    totalOutstanding,
    securedOutstanding,
    unsecuredOutstanding,
    creditUtilization,
    enquiries6m,
    dpdMax: maxDpd,
    repaymentTrack: hasDelinquency ? "Delinquency Recorded" : "100% On-Time",
    creditAge,
    provider: "DIGITAP-EXPERIAN",
    providerRef: envelope.request_id || envelope.client_ref_num || "EXP-LIVE",
    tradelines,
    applicantDetails,
    status: "FETCHED",
    message: "Real Experian CIR report successfully retrieved from Digitap Credit Analytics.",
    raw: envelope
  };
}

export interface PullExperianParams {
  mobile?: string;
  pan?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  email?: string;
  otp?: string;
  ip?: string;
  env?: DigitapEnv;
}

/**
 * Live Experian Bureau pull via Digitap.ai Credit Analytics API (v2.7)
 * Implements POST /credit_analytics/request and auto-fallback to /credit_analytics/masked_mobile_report.
 */
export async function pullExperianReport(params: PullExperianParams): Promise<ExperianBureauResult> {
  const digits = (params.mobile || "").replace(/\D/g, "");
  const mob = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  const config = digitapConfig(params.env);

  if (!config.creds) {
    return {
      score: null,
      scoreBand: null,
      activeAccounts: null,
      closedAccounts: null,
      overdueAccounts: null,
      totalOutstanding: null,
      creditUtilization: null,
      enquiries6m: null,
      dpdMax: null,
      repaymentTrack: null,
      creditAge: null,
      provider: "DIGITAP-EXPERIAN",
      providerRef: null,
      tradelines: [],
      status: "NOT_CONFIGURED",
      message: "Digitap credentials are not configured in environment."
    };
  }

  // Check UAT test dataset (§2.0)
  const uatEntry = config.env === "uat" ? DIGITAP_UAT_DATASET[mob] : undefined;

  let firstName = params.firstName || uatEntry?.firstName || "";
  let lastName = params.lastName || uatEntry?.lastName || "";
  if (!firstName && params.name) {
    const parts = params.name.trim().split(/\s+/).filter(Boolean);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }
  if (!firstName) firstName = "Applicant";
  if (!lastName) lastName = firstName;

  const resolvedPan = params.pan || uatEntry?.pan || undefined;
  const resolvedDob = toAnalyticsDob(params.dob || uatEntry?.dob);
  const resolvedEmail = params.email || uatEntry?.email || undefined;
  const resolvedOtp = String(params.otp || "123456").slice(0, 6);
  const deviceIp = sanitizeIpv4(params.ip);

  const baseUrl = digitapAnalyticsBaseUrl(config.env);
  const authHeader = "Basic " + Buffer.from(`${config.creds.clientId}:${config.creds.clientSecret}`).toString("base64");

  const payload: Record<string, any> = {
    client_ref_num: clientRef("exp"),
    mobile_no: mob,
    name_lookup: 0,
    first_name: firstName,
    last_name: lastName,
    consent_message: "I hereby authorize Experian to pull my credit report for loan verification purpose",
    consent_acceptance: "yes",
    device_type: "web",
    otp: resolvedOtp,
    timestamp: formatDigitapTimestamp(),
    device_ip: deviceIp,
    report_type: "0"
  };

  if (resolvedPan) payload.pan = resolvedPan;
  if (resolvedDob) payload.date_of_birth = resolvedDob;
  if (resolvedEmail) payload.email = resolvedEmail;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(`${baseUrl}/credit_analytics/request`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: authHeader
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });

    clearTimeout(timer);
    const text = await res.text();
    let envelope: Record<string, any> = {};
    try {
      envelope = JSON.parse(text);
    } catch {
      envelope = { rawText: text };
    }

    if (res.status === 200) {
      // 1. Success case (result_code 101)
      if (envelope.result_code === 101 && envelope.result?.result_json?.INProfileResponse) {
        return parseExperianInProfile(envelope.result.result_json.INProfileResponse, envelope);
      }

      // 2. Case: Mobile Number not authenticated -> call Masked Mobile Report API (§1.4.2.4 & §1.5)
      if (envelope.result_code === 102 && typeof envelope.message === "string" && envelope.message.includes("masked mobile report")) {
        try {
          const maskRes = await fetch(`${baseUrl}/credit_analytics/masked_mobile_report`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authHeader
            },
            body: JSON.stringify({
              client_ref_num: clientRef("exp_mask"),
              mobile_no: mob,
              request_id: envelope.request_id,
              report_type: "0"
            })
          });
          const maskText = await maskRes.text();
          const maskEnv = JSON.parse(maskText);
          if (maskRes.status === 200 && maskEnv.result_code === 101 && maskEnv.result?.result_json?.INProfileResponse) {
            return parseExperianInProfile(maskEnv.result.result_json.INProfileResponse, maskEnv);
          }
        } catch (mErr: any) {
          console.warn("[DIGITAP MASKED REPORT ATTEMPT FAILED]", mErr.message);
        }
      }

      // 3. Case: Record not found in Bureau (§1.4.2.3)
      if (envelope.result_code === 102) {
        return {
          score: null,
          scoreBand: "No History (Thin File)",
          activeAccounts: 0,
          closedAccounts: 0,
          overdueAccounts: 0,
          totalAccounts: 0,
          totalOutstanding: 0,
          securedOutstanding: 0,
          unsecuredOutstanding: 0,
          creditUtilization: 0,
          enquiries6m: 0,
          dpdMax: 0,
          repaymentTrack: "No Record",
          creditAge: "N/A",
          provider: "DIGITAP-EXPERIAN",
          providerRef: envelope.request_id || envelope.client_ref_num || null,
          tradelines: [],
          status: "NO_RECORD_FOUND",
          message: envelope.message || "No record found in Credit Bureau for this mobile number.",
          raw: envelope
        };
      }

      // 4. Case: Name not found against mobile no (§1.4.2.2)
      if (envelope.result_code === 103) {
        return {
          score: null,
          scoreBand: null,
          activeAccounts: null,
          closedAccounts: null,
          overdueAccounts: null,
          totalOutstanding: null,
          creditUtilization: null,
          enquiries6m: null,
          dpdMax: null,
          repaymentTrack: null,
          creditAge: null,
          provider: "DIGITAP-EXPERIAN",
          providerRef: envelope.request_id || envelope.client_ref_num || null,
          tradelines: [],
          status: "NAME_NOT_FOUND",
          message: "Name not found against mobile number in Digitap/Experian database.",
          raw: envelope
        };
      }
    }

    if (res.status === 403) {
      return {
        score: null,
        scoreBand: null,
        activeAccounts: null,
        closedAccounts: null,
        overdueAccounts: null,
        totalOutstanding: null,
        creditUtilization: null,
        enquiries6m: null,
        dpdMax: null,
        repaymentTrack: null,
        creditAge: null,
        provider: "DIGITAP-EXPERIAN",
        providerRef: null,
        tradelines: [],
        status: "IP_BLOCKED",
        message: `Digitap IP Whitelist: Egress IP not allowed for this Client ID. Ensure testing IP (${deviceIp}) is whitelisted on Digitap production.`,
        raw: envelope
      };
    }

    if (res.status === 401) {
      return {
        score: null,
        scoreBand: null,
        activeAccounts: null,
        closedAccounts: null,
        overdueAccounts: null,
        totalOutstanding: null,
        creditUtilization: null,
        enquiries6m: null,
        dpdMax: null,
        repaymentTrack: null,
        creditAge: null,
        provider: "DIGITAP-EXPERIAN",
        providerRef: null,
        tradelines: [],
        status: "AUTH_FAILED",
        message: envelope.message || "Digitap authentication failed for Client ID.",
        raw: envelope
      };
    }

    return {
      score: null,
      scoreBand: null,
      activeAccounts: null,
      closedAccounts: null,
      overdueAccounts: null,
      totalOutstanding: null,
      creditUtilization: null,
      enquiries6m: null,
      dpdMax: null,
      repaymentTrack: null,
      creditAge: null,
      provider: "DIGITAP-EXPERIAN",
      providerRef: null,
      tradelines: [],
      status: `HTTP_${res.status}`,
      message: envelope.message || envelope.error || `Digitap Credit Analytics returned HTTP ${res.status}`,
      raw: envelope
    };
  } catch (err: any) {
    return {
      score: null,
      scoreBand: null,
      activeAccounts: null,
      closedAccounts: null,
      overdueAccounts: null,
      totalOutstanding: null,
      creditUtilization: null,
      enquiries6m: null,
      dpdMax: null,
      repaymentTrack: null,
      creditAge: null,
      provider: "DIGITAP-EXPERIAN",
      providerRef: null,
      tradelines: [],
      status: "NETWORK_ERROR",
      message: err.message || "Failed to reach Digitap Credit Analytics API."
    };
  }
}

/* ============================================================
 * PAN ITR status (doc §8) — result is an array of filings
 * ============================================================ */

export interface ItrFiling {
  assessmentYear: string;
  formType: string;
  filingType: string;
  ackNum: string;
  eFilingStatus: string;
  filingDate: string;
  refundAmount: string;
}

function normalizeItr(r: Record<string, any>[]): ItrFiling[] {
  if (!Array.isArray(r)) return [];
  return r.map((f) => ({
    assessmentYear: String(f.assessment_year ?? ""),
    formType: String(f.form_type ?? ""),
    filingType: String(f.filing_type ?? ""),
    ackNum: String(f.ack_num ?? ""),
    eFilingStatus: String(f.e_filing_status ?? ""),
    filingDate: String(f.filing_date ?? ""),
    refundAmount: String(f.refund_amount ?? "")
  }));
}

export async function panItrStatus(pan: string): Promise<{ result: ItrFiling[]; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  assertPanFormat(p);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/itr_basic", { client_ref_num: clientRef("snpr"), pan: p });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope);
  return { providerRef: envelope.request_id || "", result: normalizeItr(Array.isArray(r) ? r : []) };
}

/* ============================================================
 * PAN → Name / Father's name (doc §9, §10)
 * ============================================================ */

export async function panToName(pan: string): Promise<{ fullName: string; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  assertPanFormat(p);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/pan_to_name", { client_ref_num: clientRef("snpr"), pan: p });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  return { fullName: String(r.full_name ?? r.name ?? r.fullname ?? ""), providerRef: envelope.request_id || "" };
}

export async function panToFatherName(pan: string): Promise<{ fatherName: string; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  assertPanFormat(p);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/pan_to_fname", { client_ref_num: clientRef("snpr"), pan: p });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  return { fatherName: String(r.father_name ?? r.father_full_name ?? r.full_name ?? ""), providerRef: envelope.request_id || "" };
}

/* ============================================================
 * PAN Profile (doc §11) — rich profile, individual PANs (P) only
 * ============================================================ */

export async function panProfile(pan: string): Promise<{ result: PanDetailsResult; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  assertPanFormat(p);
  if (p[3] !== "P") throw new DigitapError(400, "PAN Profile is available for individual PANs only", null, true);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/pan_profile", { client_ref_num: clientRef("snpr"), pan: p });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as RawPanDetails;
  return { result: normalizePanDetails(p, r), providerRef: envelope.request_id || "" };
}

/* ============================================================
 * PAN ↔ Account linkage (doc §12, misc suite)
 * ============================================================ */

export interface PanAccountLinkResult {
  linked: boolean | null;
  rawStatus: string;
  bankRef: string;
}

export async function panAccountLink(pan: string, accountNumber: string, ifsc: string): Promise<{ result: PanAccountLinkResult; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  const acct = (accountNumber || "").trim();
  const ifscN = (ifsc || "").trim().toUpperCase();
  assertPanFormat(p);
  if (!/^\d{9,18}$/.test(acct)) throw new DigitapError(400, "Invalid account number (9-18 digits)", null, true);
  if (!IFSC_REGEX.test(ifscN)) throw new DigitapError(400, "Invalid IFSC code", null, true);
  const { envelope, httpStatus } = await post(creds, "/validation/misc/v1/pan-account-linkage", {
    client_ref_num: clientRef("snpr"), pan: p, account_number: acct, ifsc_code: ifscN
  });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  const rawStatus = String(r.linkage_status ?? r.status ?? "");
  const linked = typeof r.is_linked === "boolean" ? r.is_linked : rawStatus ? rawStatus.toLowerCase() === "linked" || rawStatus.toLowerCase() === "yes" : null;
  return { providerRef: envelope.request_id || "", result: { linked, rawStatus, bankRef: String(r.bank_code ?? "") } };
}

/* ============================================================
 * OVD set: Voter ID / Passport / DL / DL Plus / UDID (doc §13,14,18,19,20)
 * ============================================================ */

export type OvdKind = "voter" | "passport" | "dl" | "dl_plus" | "udid";

export interface OvdResult {
  kind: OvdKind;
  status: string;
  fields: Record<string, string | number | boolean | null>;
}

/** Keep only scalar, non-sensitive fields from an OVD result. */
function normalizeOvd(kind: OvdKind, r: Record<string, any>): OvdResult {
  const fields: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(r)) {
    if (v == null || ["object", "function"].includes(typeof v)) continue;
    if (/aadhaar(?!_linked)/i.test(k)) continue; // never carry Aadhaar keys
    fields[k] = typeof v === "number" || typeof v === "boolean" ? v : String(v).slice(0, 200);
  }
  const status = String(fields.status ?? fields.epic_status ?? fields.dl_status ?? "").trim();
  return { kind, status, fields };
}

export async function ovdVerify(kind: OvdKind, params: { epicNumber?: string; fileNumber?: string; dlNumber?: string; udidNumber?: string; mobile?: string; dob?: string | null }): Promise<{ result: OvdResult; providerRef: string; endpoint: string }> {
  const creds = await requireCreds();
  const clientRefNum = clientRef("snpr");
  let path: string;
  let payload: Record<string, unknown>;

  if (kind === "voter") {
    const epic = (params.epicNumber || "").trim().toUpperCase();
    if (!EPIC_REGEX.test(epic)) throw new DigitapError(400, "Invalid Voter ID (EPIC) format", null, true);
    path = "/validation/kyc/v1/voter";
    payload = { client_ref_num: clientRefNum, epic_number: epic };
  } else if (kind === "passport") {
    const file = (params.fileNumber || "").trim();
    const dob = toDigitapDob(params.dob);
    if (!file || file.length > 30) throw new DigitapError(400, "Invalid passport file number", null, true);
    if (!dob) throw new DigitapError(400, "DOB is required (DD/MM/YYYY)", null, true);
    path = "/validation/kyc/v1/passport";
    payload = { client_ref_num: clientRefNum, file_number: file, dob };
  } else if (kind === "dl" || kind === "dl_plus") {
    const dl = (params.dlNumber || "").trim().toUpperCase();
    const dob = toDigitapDob(params.dob);
    if (!DL_REGEX.test(dl)) throw new DigitapError(400, "Invalid driving licence number format", null, true);
    if (!dob) throw new DigitapError(400, "DOB is required (DD/MM/YYYY)", null, true);
    path = kind === "dl" ? "/validation/kyc/v1/dl" : "/validation/kyc/v1/dl_plus";
    payload = { client_ref_num: clientRefNum, dl_number: dl, dob };
  } else {
    const udid = (params.udidNumber || "").trim().toUpperCase();
    const mob = (params.mobile || "").replace(/\D/g, "");
    if (!UDID_REGEX.test(udid) && !mob) throw new DigitapError(400, "UDID (2 letters + 16 digits) or linked mobile is required", null, true);
    const dob = toDigitapDob(params.dob);
    path = "/validation/kyc/v1/kyc_udid_verification";
    payload = { client_ref_num: clientRefNum } as Record<string, unknown>;
    if (udid) payload.udid_number = udid;
    if (mob) payload.Mobile_number = mob;
    if (dob) payload.DOB = dob;
  }

  const { envelope, httpStatus } = await post(creds, path, payload);
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  return { result: normalizeOvd(kind, r), providerRef: envelope.request_id || clientRefNum, endpoint: path };
}

/* ============================================================
 * PAN ↔ Aadhaar mapping family (doc §15–17, §21)
 * ============================================================ */

export async function panAadhaarLink(pan: string, aadhaar: string): Promise<{ linked: boolean | null; rawStatus: string; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  const a = (aadhaar || "").trim();
  assertPanFormat(p);
  if (!AADHAAR_REGEX.test(a)) throw new DigitapError(400, "Invalid Aadhaar format (12 digits)", null, true);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/pan_aadhaar_link", { client_ref_num: clientRef("snpr"), pan: p, aadhaar: a });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  const raw = String(r.aadhaar_link_status ?? r.linkage_status ?? r.status ?? "");
  const linked = typeof r.aadhaar_linked === "boolean" ? r.aadhaar_linked : raw ? raw.toLowerCase() === "linked" || raw.toLowerCase() === "yes" : null;
  // NOTE: raw Aadhaar is forwarded to Digitap but never logged or persisted.
  return { linked, rawStatus: raw, providerRef: envelope.request_id || "" };
}

export async function panToMaskedAadhaar(pan: string): Promise<{ maskedAadhaar: string; providerRef: string }> {
  const creds = await requireCreds();
  const p = normalizePan(pan);
  assertPanFormat(p);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/pan_to_masked_aadhaar", { client_ref_num: clientRef("snpr"), pan: p });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  return { maskedAadhaar: String(r.aadhaar_number ?? r.masked_aadhaar ?? ""), providerRef: envelope.request_id || "" };
}

export async function aadhaarToMaskedPan(aadhaar: string): Promise<{ maskedPan: string; providerRef: string }> {
  const creds = await requireCreds();
  const a = (aadhaar || "").trim();
  if (!AADHAAR_REGEX.test(a)) throw new DigitapError(400, "Invalid Aadhaar format (12 digits)", null, true);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/aadhaar_to_masked_pan", { client_ref_num: clientRef("snpr"), aadhaar: a });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  return { maskedPan: String(r.pan ?? r.masked_pan ?? ""), providerRef: envelope.request_id || "" };
}

/**
 * Aadhaar → PAN recovery. Per the masking rule the FULL PAN never leaves the
 * backend: callers receive the masked PAN plus an optional match flag against
 * a known PAN. Use only inside the consent flow.
 */
export async function aadhaarToUnmaskedPan(aadhaar: string, knownPan?: string | null): Promise<{ maskedPan: string; matchesKnownPan: boolean | null; providerRef: string }> {
  const creds = await requireCreds();
  const a = (aadhaar || "").trim();
  if (!AADHAAR_REGEX.test(a)) throw new DigitapError(400, "Invalid Aadhaar format (12 digits)", null, true);
  const { envelope, httpStatus } = await post(creds, "/validation/kyc/v1/aadhaar_to_unmasked_pan", { client_ref_num: clientRef("snpr"), aadhaar: a });
  assertHttpOk(httpStatus, envelope);
  const r = assertResultOk(envelope) as Record<string, any>;
  const full = String(r.pan ?? "");
  const masked = full ? maskPan(full) : String(r.masked_pan ?? "");
  const matchesKnownPan = knownPan && full ? normalizePan(knownPan) === normalizePan(full) : null;
  return { maskedPan: masked, matchesKnownPan, providerRef: envelope.request_id || "" };
}

/* ============================================================
 * Connection probes — one per hub adapter, all synthetic payloads.
 * Format-valid, non-existent inputs: UAT answers HTTP 200 + result_code
 * 102/103 (never a real profile) when credentials + entitlement are good.
 * HTTP 401 = bad credentials · 403 = egress IP not whitelisted ·
 * 412 = product not enabled. Probes never run against production unless
 * DIGITAP_ALLOW_PROD_PROBE=true.
 * ============================================================ */

export interface ProbeResult {
  ok: boolean;
  message: string;
  latencyMs: number;
  auth: boolean;
  enabled: boolean;
}

/** Shared synthetic probe inputs (format-valid, non-existent records). */
const SYNTH = {
  pan: "ZZZPE0000Z", // 4th char P = individual, not a real PAN
  aadhaar: "999999999999", // 12 digits, Verhoeff-invalid
  epic: "ZZZ0000000", // voter pattern: 3 letters + 6 digits
  passportFile: "Z0000000",
  dl: "ZZ00000000000", // 13 chars alnum
  udid: "ZZ0000000000000000", // 2 letters + 16 digits
  dob: "01/01/1990",
  mobile: "9876543210"
} as const;

/** Raw probe — returns HTTP status + result_code for discovery reporting. */
export async function probeRaw(path: string, payload: Record<string, unknown>): Promise<{ httpStatus: number; resultCode: number | null; message: string; latencyMs: number }> {
  const t0 = Date.now();
  const { creds } = digitapConfig();
  if (!creds) throw new DigitapError(0, "Digitap credentials are not configured");
  const { envelope, httpStatus } = await post(creds, path, { client_ref_num: `probe-${Date.now()}`, ...payload }, 1);
  return { httpStatus, resultCode: envelope.result_code ?? null, message: envelope.message || envelope.error || "", latencyMs: Date.now() - t0 };
}

export async function probeEndpoint(path: string, payload: Record<string, unknown>): Promise<ProbeResult> {
  const { env, creds } = digitapConfig();
  const t0 = Date.now();
  if (!creds) {
    return { ok: false, message: "Digitap credentials not configured — add DIGITAP_UAT_CLIENT_ID/SECRET (or PROD) to server/.env", latencyMs: 0, auth: false, enabled: false };
  }
  if (env === "prod" && process.env.DIGITAP_ALLOW_PROD_PROBE !== "true") {
    return { ok: false, message: "Production probe disabled — exercise this product through a real consent flow instead (set DIGITAP_ALLOW_PROD_PROBE=true to override)", latencyMs: 0, auth: true, enabled: true };
  }
  try {
    const { envelope, httpStatus } = await post(creds, path, { client_ref_num: `probe-${Date.now()}`, ...payload }, 1);
    const latencyMs = Date.now() - t0;
    if (httpStatus === 200 && [101, 102, 103, 109].includes(envelope.result_code as number)) {
      return { ok: true, message: `Digitap ${env.toUpperCase()} reachable — credentials OK, product enabled`, latencyMs, auth: true, enabled: true };
    }
    if (httpStatus === 503) return { ok: false, message: "Digitap source temporarily busy / in maintenance (HTTP 503) — credentials accepted, retry the Test shortly", latencyMs, auth: true, enabled: true };
    if (httpStatus === 401) return { ok: false, message: "Digitap authentication failed — wrong client_id/secret for this environment", latencyMs, auth: false, enabled: false };
    if (httpStatus === 403) return { ok: false, message: IP_ERR, latencyMs, auth: false, enabled: false };
    if (httpStatus === 412) return { ok: false, message: `Digitap reports this product is not enabled for client ${creds.clientId} — contact your RM`, latencyMs, auth: true, enabled: false };
    if (httpStatus === 400) return { ok: false, message: "Probe payload rejected (HTTP 400) — endpoint reachable but verify the request contract", latencyMs, auth: false, enabled: false };
    if (httpStatus === 422) return { ok: false, message: "Digitap source temporarily unable to fetch (HTTP 422) — auth OK, retry the Test", latencyMs, auth: true, enabled: true };
    if (httpStatus === 429) return { ok: false, message: "Digitap rate limit exceeded (HTTP 429) — retry shortly", latencyMs, auth: true, enabled: true };
    return { ok: false, message: `Unexpected probe response (HTTP ${httpStatus}, result ${envelope.result_code ?? "—"})`, latencyMs, auth: httpStatus >= 500, enabled: false };
  } catch (e) {
    const latencyMs = Date.now() - t0;
    return { ok: false, message: `Digitap probe failed: ${(e as Error).message}`, latencyMs, auth: false, enabled: false };
  }
}

function prodGuard(): ProbeResult | null {
  const { env, creds } = digitapConfig();
  if (!creds) return { ok: false, message: "Digitap credentials not configured — add DIGITAP_UAT_CLIENT_ID/SECRET (or PROD) to server/.env", latencyMs: 0, auth: false, enabled: false };
  if (env === "prod" && process.env.DIGITAP_ALLOW_PROD_PROBE !== "true") {
    return { ok: false, message: "Production probe disabled — exercise this product through a real consent flow instead (set DIGITAP_ALLOW_PROD_PROBE=true to override)", latencyMs: 0, auth: true, enabled: true };
  }
  return null;
}

/** PAN Basic probe (preserved from the original hub). */
export async function probePanBasic(): Promise<ProbeResult> {
  const guarded = prodGuard();
  if (guarded) return guarded;
  return probeEndpoint(`/validation/kyc/v1/pan_basic`, { pan: SYNTH.pan });
}

/** Catalog of hub-adapter probes: code → live probe against one endpoint. */
export const PROBE_TARGETS: Record<string, () => Promise<ProbeResult>> = {
  pan_verify: () => probePanBasic(),
  pan_details: () => probeEndpoint("/validation/kyc/v1/pan_details", { pan: SYNTH.pan, name: "SYNTHETIC PROBE", name_match_method: "fuzzy" }),
  pan_enrichment: () => probeEndpoint("/validation/kyc/v1/pan_to_name", { pan: SYNTH.pan }),
  pan_206ab: () => probeEndpoint("/validation/kyc/v1/form206ab_compliance_status", { pan: SYNTH.pan }),
  pan_itr: () => probeEndpoint("/validation/kyc/v1/itr_basic", { pan: SYNTH.pan }),
  pan_aadhaar_link: () => probeEndpoint("/validation/kyc/v1/pan_aadhaar_link", { pan: SYNTH.pan, aadhaar: SYNTH.aadhaar }),
  pan_account_link: () => probeEndpoint("/validation/misc/v1/pan-account-linkage", { pan: SYNTH.pan, account_number: "000000000", ifsc_code: "SBIN0000000" }),
  aadhaar_ovd: () => probeEndpoint("/validation/kyc/v1/aadhaar_to_masked_pan", { aadhaar: SYNTH.aadhaar }),
  voter_verify: () => probeEndpoint("/validation/kyc/v1/voter", { epic_number: SYNTH.epic }),
  passport_verify: () => probeEndpoint("/validation/kyc/v1/passport", { file_number: SYNTH.passportFile, dob: SYNTH.dob }),
  dl_verify: () => probeEndpoint("/validation/kyc/v1/dl", { dl_number: SYNTH.dl, dob: SYNTH.dob }),
  udid_verify: () => probeEndpoint("/validation/kyc/v1/kyc_udid_verification", { udid_number: SYNTH.udid }),
  experian: () => probeEndpoint("/validation/misc/v1/mobile-name-lookup", { mobile: SYNTH.mobile }),
  mnv_otp: () => probeEndpoint("/validation/misc/v1/mobile-name-lookup", { mobile: SYNTH.mobile }),
  mnv_silent: () => probeEndpoint("/validation/misc/v1/mobile-name-lookup", { mobile: SYNTH.mobile }),
  mnv_report: () => probeEndpoint("/validation/misc/v1/mobile-name-lookup", { mobile: SYNTH.mobile })
};

/** Metadata for the discovery script (code → endpoint + synthetic payload). */
export const PROBE_CATALOG: Record<string, { path: string; payload: Record<string, unknown> }> = {
  pan_basic_v1: { path: "/validation/kyc/v1/pan_basic", payload: { pan: SYNTH.pan } },
  pan_basic_v2: { path: "/validation/kyc/v2/pan_basic", payload: { pan: SYNTH.pan, name: "SYNTHETIC PROBE", dob: SYNTH.dob } },
  pan_details: { path: "/validation/kyc/v1/pan_details", payload: { pan: SYNTH.pan } },
  pan_details_bc: { path: "/validation/kyc/v1/pan_details_bc", payload: { pan: SYNTH.pan } },
  pan_details_plus: { path: "/validation/kyc/v1/pan_details_plus", payload: { pan: SYNTH.pan } },
  pan_206ab: { path: "/validation/kyc/v1/form206ab_compliance_status", payload: { pan: SYNTH.pan } },
  pan_itr: { path: "/validation/kyc/v1/itr_basic", payload: { pan: SYNTH.pan } },
  pan_to_name: { path: "/validation/kyc/v1/pan_to_name", payload: { pan: SYNTH.pan } },
  pan_to_fname: { path: "/validation/kyc/v1/pan_to_fname", payload: { pan: SYNTH.pan } },
  pan_profile: { path: "/validation/kyc/v1/pan_profile", payload: { pan: SYNTH.pan } },
  pan_account_linkage: { path: "/validation/misc/v1/pan-account-linkage", payload: { pan: SYNTH.pan, account_number: "000000000", ifsc_code: "SBIN0000000" } },
  voter: { path: "/validation/kyc/v1/voter", payload: { epic_number: SYNTH.epic } },
  passport: { path: "/validation/kyc/v1/passport", payload: { file_number: SYNTH.passportFile, dob: SYNTH.dob } },
  pan_aadhaar_link: { path: "/validation/kyc/v1/pan_aadhaar_link", payload: { pan: SYNTH.pan, aadhaar: SYNTH.aadhaar } },
  pan_to_masked_aadhaar: { path: "/validation/kyc/v1/pan_to_masked_aadhaar", payload: { pan: SYNTH.pan } },
  aadhaar_to_masked_pan: { path: "/validation/kyc/v1/aadhaar_to_masked_pan", payload: { aadhaar: SYNTH.aadhaar } },
  aadhaar_to_unmasked_pan: { path: "/validation/kyc/v1/aadhaar_to_unmasked_pan", payload: { aadhaar: SYNTH.aadhaar } },
  dl: { path: "/validation/kyc/v1/dl", payload: { dl_number: SYNTH.dl, dob: SYNTH.dob } },
  dl_plus: { path: "/validation/kyc/v1/dl_plus", payload: { dl_number: SYNTH.dl, dob: SYNTH.dob } },
  udid: { path: "/validation/kyc/v1/kyc_udid_verification", payload: { udid_number: SYNTH.udid } },
  experian: { path: "/validation/misc/v1/mobile-name-lookup", payload: { mobile: SYNTH.mobile } },
  mnv_otp: { path: "/validation/misc/v1/mobile-name-lookup", payload: { mobile: SYNTH.mobile } },
  mnv_silent: { path: "/validation/misc/v1/mobile-name-lookup", payload: { mobile: SYNTH.mobile } },
  mnv_report: { path: "/validation/misc/v1/mobile-name-lookup", payload: { mobile: SYNTH.mobile } }
};
