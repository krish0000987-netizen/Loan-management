import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader, Badge, EmptyState } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { gnBadge, gnStatusLabel } from "../../lib/gn";
import { ProcessFlow, ImportExport } from "./shared";

const SANCTION_STATUSES = ["approved", "sanction_generated", "agreement_pending", "esign_pending", "agreement_completed"];

export function GnSanction() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    Promise.all(SANCTION_STATUSES.map((s) => api(`/gn/applications?status=${s}&limit=50`).then((r) => r.rows))).then((groups) => {
      const all: any[] = []; for (const g of groups) all.push(...g);
      setRows(all.sort((a, b) => (b.sanctioned_at ?? b.created_at).localeCompare(a.sanctioned_at ?? a.created_at)));
    }).catch(() => {});
  }, []);
  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-5">
      <PageHeader title="Sanction Loan" sub="Approved files moving to sanction letter, agreement and eSign" breadcrumb="Growth Nations / CRM / Sanction" actions={<div className="flex items-center gap-2"><ImportExport entity="applications" /></div>} />
      <ProcessFlow status="sanction_generated" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Approved", approved], ["Sanction Letter", rows.filter((r) => r.status === "sanction_generated").length], ["Agreement Pending", rows.filter((r) => r.status === "agreement_pending").length], ["eSign Pending", rows.filter((r) => r.status === "esign_pending").length]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-zinc-200 px-4 py-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{l}</div><div className="text-[19px] font-bold text-zinc-800 mt-0.5">{v}</div></div>
        ))}
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Ref</th><th className="px-3 py-2.5 font-semibold">Borrower</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Product</th>
                <th className="px-3 py-2.5 font-semibold text-right">Amount</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Sanctioned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-brand-700">{r.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{r.lender_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.product_name ?? "—"}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800 text-right">{fmtInr(r.amount)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={gnBadge(r.status)}>{gnStatusLabel(r.status)}</span></Badge></td>
                  <td className="px-3 py-2.5 text-zinc-400">{fmtDate(r.sanctioned_at ?? r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="No sanctioned loans" sub="Approved files will appear here" />}
        </div>
      </Card>
      <div className="text-[11px] text-zinc-400">Manage each file in the <Link to="/gn/applications" className="text-brand-600 font-semibold">Loan Applications</Link> workspace — advance through sanction letter → agreement → eSign.</div>
    </div>
  );
}
