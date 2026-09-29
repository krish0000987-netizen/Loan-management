import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";

export const GN_STATUS: { slug: string; label: string; group: string }[] = [
  { slug: "lead_new", label: "New Lead", group: "lead" },
  { slug: "lead_contacted", label: "Contacted", group: "lead" },
  { slug: "lead_qualified", label: "Qualified", group: "lead" },
  { slug: "lead_requirement", label: "Requirement Identified", group: "lead" },
  { slug: "app_created", label: "Application Created", group: "application" },
  { slug: "kyc_pending", label: "KYC Pending", group: "application" },
  { slug: "kyc_complete", label: "KYC Complete", group: "application" },
  { slug: "docs_pending", label: "Documents Pending", group: "application" },
  { slug: "docs_complete", label: "Documents Complete", group: "application" },
  { slug: "lender_selected", label: "Lender Selected", group: "application" },
  { slug: "ready_submission", label: "Ready for Submission", group: "application" },
  { slug: "submitted", label: "Application Submitted", group: "lender" },
  { slug: "uw", label: "Underwriting", group: "lender" },
  { slug: "query", label: "Query Raised", group: "lender" },
  { slug: "addl_docs", label: "Additional Documents Required", group: "lender" },
  { slug: "on_hold", label: "On Hold", group: "lender" },
  { slug: "approved", label: "Approved", group: "lender" },
  { slug: "rejected", label: "Rejected", group: "lender" },
  { slug: "sanction_generated", label: "Sanction Letter Generated", group: "agreement" },
  { slug: "agreement_pending", label: "Agreement Pending", group: "agreement" },
  { slug: "esign_pending", label: "eSign Pending", group: "agreement" },
  { slug: "agreement_completed", label: "Agreement Completed", group: "agreement" },
  { slug: "disb_pending", label: "Disbursement Pending", group: "disbursement" },
  { slug: "disb_initiated", label: "Disbursement Triggered by Lender", group: "disbursement" },
  { slug: "disb_partial", label: "Partially Disbursed", group: "disbursement" },
  { slug: "disb_fully", label: "Fully Disbursed", group: "disbursement" },
  { slug: "disb_failed", label: "Disbursement Failed", group: "disbursement" },
  { slug: "disb_confirmed", label: "Disbursement Confirmed", group: "completed" },
  { slug: "crm_updated", label: "Growth Nations CRM Updated", group: "completed" },
  { slug: "commission_reconciled", label: "Commission / Payout Reconciliation", group: "completed" },
  { slug: "payout_pending", label: "Payout Pending", group: "completed" },
  { slug: "payout_received", label: "Payout Received", group: "completed" },
  { slug: "closed", label: "Closed", group: "closed" }
];

export const GN_FLOW = GN_STATUS.map((s) => s.slug);
export const gnStatusIndex = (slug: string) => Math.max(0, GN_FLOW.indexOf(slug));
export const gnStatusLabel = (slug: string | null | undefined) => GN_STATUS.find((s) => s.slug === slug)?.label ?? slug ?? "—";
export const gnStatusGroup = (slug: string) => GN_STATUS.find((s) => s.slug === slug)?.group ?? "application";

export const GN_STAGE_LABELS: Record<string, string> = {
  lead: "Lead", application: "Application", lender: "Lender", agreement: "Agreement",
  disbursement: "Disbursement", completed: "Completed", closed: "Closed"
};

/** Tailwind badge classes per GN stage group */
export function gnBadge(status: string | null | undefined): string {
  const g = gnStatusGroup(status ?? "");
  const map: Record<string, string> = {
    lead: "bg-zinc-100 text-zinc-600 border-zinc-200",
    application: "bg-sky-50 text-sky-700 border-sky-200",
    lender: "bg-indigo-50 text-indigo-700 border-indigo-200",
    agreement: "bg-violet-50 text-violet-700 border-violet-200",
    disbursement: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-zinc-100 text-zinc-500 border-zinc-200"
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${map[g] ?? map.application}`;
}

export function gnGroupBadge(group: string): string {
  const map: Record<string, string> = {
    lead: "bg-zinc-100 text-zinc-600 border-zinc-200",
    application: "bg-sky-50 text-sky-700 border-sky-200",
    lender: "bg-indigo-50 text-indigo-700 border-indigo-200",
    agreement: "bg-violet-50 text-violet-700 border-violet-200",
    disbursement: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-zinc-100 text-zinc-500 border-zinc-200"
  };
  return map[group] ?? map.application;
}

/* ---------- The canonical 13-step loan distribution workflow ---------- */

export const GN_WORKFLOW: { step: number; label: string; status: string; hint: string }[] = [
  { step: 1, label: "Application Created", status: "app_created", hint: "Application logged with borrower details" },
  { step: 2, label: "KYC Complete", status: "kyc_complete", hint: "Identity & KYC documents verified" },
  { step: 3, label: "Documents Complete", status: "docs_complete", hint: "All lender-required documents collected" },
  { step: 4, label: "Lender Selected", status: "lender_selected", hint: "Eligible lender & scheme shortlisted" },
  { step: 5, label: "Application Submitted", status: "submitted", hint: "File submitted to the lender" },
  { step: 6, label: "Underwriting", status: "uw", hint: "Lender credit assessment in progress" },
  { step: 7, label: "Approved", status: "approved", hint: "Sanction approved by the lender" },
  { step: 8, label: "Agreement / eSign Complete", status: "agreement_completed", hint: "Loan agreement & eSign executed" },
  { step: 9, label: "Disbursement Triggered by Lender", status: "disb_initiated", hint: "Lender initiates fund transfer" },
  { step: 10, label: "₹ Funds → Borrower's Bank Account", status: "disb_fully", hint: "Money transferred directly by lender to the borrower's bank account" },
  { step: 11, label: "Disbursement Confirmation", status: "disb_confirmed", hint: "Lender confirms disbursement via API / webhook" },
  { step: 12, label: "Growth Nations CRM Updated", status: "crm_updated", hint: "CRM automatically updated with disbursement" },
  { step: 13, label: "Commission / Payout Reconciliation", status: "commission_reconciled", hint: "Commission calculated & payout tracked" }
];

export const gnWorkflowStep = (slug: string | null | undefined) => GN_WORKFLOW.find((w) => w.status === slug)?.step ?? null;

/* ---------- The 6-step process flow shown on pipeline pages ---------- */

export const GN_PROCESS_FLOW = ["Lead Capture", "Loan Application", "Sanctioned Loan", "Disbursement", "Commission", "Payout"];

export function gnProcessStage(status: string | null | undefined): number {
  const s = status ?? "";
  const g = gnStatusGroup(s);
  if (g === "lead") return 0;
  if (["application", "lender", "agreement"].includes(g)) return 1;
  if (["sanction_generated", "agreement_pending", "esign_pending", "agreement_completed"].includes(s)) return 2;
  if (g === "disbursement" || ["disb_confirmed", "crm_updated"].includes(s)) return 3;
  if (s === "commission_reconciled") return 4;
  if (["payout_pending", "payout_received", "closed"].includes(s)) return 5;
  return 1;
}

/* ================== Configurable Roles & Permissions (client mirror) ================== */

export const GN_MODULES = ["Leads", "Applications", "Sanction", "Disbursement", "Commission", "Payouts", "Documents", "Tasks", "Masters", "Finance", "HR", "Marketing", "Inbox", "Documentation", "Help", "Change Log", "Recycle Bin", "Reports", "Settings", "Command Center", "Bulk", "API Center", "Utility"] as const;
export const GN_ACTIONS = ["view", "create", "edit", "delete", "manage", "use"] as const;

export const GN_PERM_PREFIX: Record<string, string> = {
  Leads: "gn.leads", Applications: "gn.applications", Sanction: "gn.sanction", Disbursement: "gn.disbursement",
  Commission: "gn.commission", Payouts: "gn.payout", Documents: "gn.documents", Tasks: "gn.tasks",
  Masters: "gn.masters", Finance: "gn.finance", HR: "gn.hr", Marketing: "gn.marketing",
  Inbox: "gn.inbox", Documentation: "gn.docs", Help: "gn.help", "Change Log": "gn.changelog", "Recycle Bin": "gn.trash",
  Reports: "gn.reports", Settings: "gn.settings",
  "Command Center": "gn.co", Bulk: "gn.bulk", "API Center": "gn.api", Utility: "gn.utility"
};

/** Modules whose permissions are NOT covered by the gn.view umbrella. */
export const GN_LOCKED_MODULES = ["gn.co.", "gn.bulk.", "gn.api."];

export const gnPerm = (module: string, action: string) => `${GN_PERM_PREFIX[module] ?? "gn." + module.toLowerCase()}.${action}`;

export function matchesPerm(perms: Set<string>, perm: string): boolean {
  const locked = GN_LOCKED_MODULES.some((x) => perm.startsWith(x));
  for (const p of perms) {
    if (p === "*") return true;
    if (p === perm) return true;
    if (p.endsWith(".*") && perm.startsWith(p.slice(0, -1))) return true;
    if (p === "gn.view" && perm.startsWith("gn.") && !locked) return true;
    const m = /^gn\.([a-z]+)\.([a-z_]+)$/.exec(perm);
    if (m && (p === `gn.${m[1]}.manage` || p === `gn.${m[1]}.*`)) return true;
  }
  if (perm === "gn.view") return Array.from(perms).some((p) => p.startsWith("gn."));
  if (perm === "gn.*") return Array.from(perms).some((p) => /^gn\.[a-z]+\.(manage|use|delete)$/.test(p));
  if (perm.endsWith(".*")) {
    const prefix = perm.slice(0, -1);
    return Array.from(perms).some((p) => p.startsWith(prefix));
  }
  return false;
}

export interface GnMe {
  role: string;
  roleName: string;
  kind: string;
  designation: string | null;
  partner_type: string | null;
  isSystem: boolean;
  perms: string[];
  scopes: Record<string, string>;
}

export function useGnPerms(): { me: GnMe | null; loading: boolean; can: (perm: string) => boolean } {
  const [me, setMe] = useState<GnMe | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    api<GnMe>("/gn/admin/me")
      .then((m) => { if (live) setMe(m); })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  const perms = useMemo(() => new Set(me?.perms ?? []), [me]);
  const can = useCallback((perm: string) => (me ? matchesPerm(perms, perm) : true), [me, perms]);
  return { me, loading, can };
}

/* ================== CSV helpers (import / export) ================== */

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = "\uFEFF" + cols.join(",") + "\n" + rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}


