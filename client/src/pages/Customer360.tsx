import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Landmark, ShieldCheck } from "lucide-react";
import { api, fmtInr, fmtDate, timeAgo, badgeFor, statusLabel } from "../lib/api";
import { Card, CardTitle, Badge, KV, Tabs, PageHeader, Progress, type Column, DataTable } from "../components/ui";

export default function Customer360() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => { api(`/customers/${id}`).then(setData); }, [id]);
  if (!data) return null;
  const c = data.customer;

  const exposurePct = c.credit_score ? (c.credit_score / 900) * 100 : 0;

  const loanCols: Column<any>[] = [
    { key: "loan_no", header: "Loan", render: (r) => <span className="font-medium">{r.loan_no}</span> },
    { key: "principal", header: "Principal", align: "right", render: (r) => <span className="num">{fmtInr(r.principal)}</span> },
    { key: "outstanding", header: "Outstanding", align: "right", render: (r) => <span className="num">{fmtInr(r.outstanding)}</span> },
    { key: "dpd", header: "DPD", align: "right", render: (r) => <span className={`num font-semibold ${r.dpd > 0 ? "text-rose-600" : "text-emerald-600"}`}>{r.dpd}</span> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "open", header: "", render: (r) => <button className="btn btn-secondary btn-sm" onClick={() => nav(`/loans/${r.id}`)}>Open</button> }
  ];
  const appCols: Column<any>[] = [
    { key: "app_no", header: "Application", render: (r) => <span className="font-medium">{r.application_no}</span> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num">{fmtInr(r.requested_amount)}</span> },
    { key: "stage", header: "Stage", render: (r) => <Badge status={r.stage} /> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "created", header: "Created", render: (r) => fmtDate(r.created_at) },
    { key: "open", header: "", render: (r) => <button className="btn btn-secondary btn-sm" onClick={() => nav(`/applications/${r.id}`)}>Open</button> }
  ];

  return (
    <div>
      <PageHeader
        title={c.name}
        sub={`${c.customer_no} · ${c.mobile || ""} · ${c.email || ""}`}
        breadcrumb={`CRM / Customers / ${c.customer_no}`}
        actions={<button className="btn btn-secondary" onClick={() => nav("/customers")}><ArrowLeft size={13} /> Customers</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center"><ShieldCheck size={16} /></div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-zinc-400 font-medium">KYC status</div>
            <Badge status={c.kyc_status} />
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center"><Landmark size={16} /></div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-zinc-400 font-medium">Total exposure</div>
            <div className="text-[16px] font-semibold num">{fmtInr(data.exposure)}</div>
          </div>
        </Card>
        <Card>
          <div className="text-[10.5px] uppercase tracking-wide text-zinc-400 font-medium mb-1">Credit score</div>
          <div className={`text-[16px] font-semibold num ${c.credit_score >= 750 ? "text-emerald-600" : c.credit_score >= 650 ? "text-amber-600" : "text-rose-600"}`}>{c.credit_score ?? "—"}</div>
          <Progress value={exposurePct} tone={c.credit_score >= 750 ? "green" : c.credit_score >= 650 ? "amber" : "red"} />
        </Card>
        <Card>
          <div className="text-[10.5px] uppercase tracking-wide text-zinc-400 font-medium mb-1">Risk class</div>
          <div className="text-[16px] font-semibold capitalize">{c.risk_class}</div>
          <div className="text-[11px] text-zinc-400">{c.fraud_flag ? "Fraud flag raised" : "No fraud flags"}</div>
        </Card>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { key: "overview", label: "Overview" },
          { key: "financial", label: "Financial" },
          { key: "documents", label: "Documents", count: data.documents?.length },
          { key: "lending", label: "Lending", count: data.loans?.length },
          { key: "communication", label: "Communication", count: data.communications?.length }
        ]}
      />

      {tab === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card>
            <CardTitle title="Identity" />
            <KV k="Full name" v={c.name} />
            <KV k="DOB" v={fmtDate(c.dob)} />
            <KV k="Gender" v={c.gender || "—"} />
            <KV k="PAN" v={c.pan || "—"} mono />
            <KV k="Address" v={<span className="text-[11.5px] leading-snug block max-w-[180px]">{c.address_line1 || "—"}</span>} />
            <KV k="City / State" v={c.city ? `${c.city}, ${c.state}` : "—"} />
            <KV k="Pincode" v={c.pincode || "—"} />
          </Card>
          <Card>
            <CardTitle title="Employment & income" />
            <KV k="Employment type" v={<span className="capitalize">{c.employment_type || "—"}</span>} />
            <KV k="Business name" v={c.business_name || "—"} />
            <KV k="Monthly income" v={fmtInr(c.monthly_income)} mono />
            <KV k="Annual income" v={fmtInr(c.annual_income)} mono />
            <KV k="Business turnover" v={fmtInr(c.business_turnover)} mono />
          </Card>
          <Card>
            <CardTitle title="Credit snapshot" sub="Latest bureau view" />
            {data.bureau ? (
              <>
                <KV k="Provider" v={<span className="text-[11px]">{data.bureau.provider} <Badge status="sandbox">SANDBOX</Badge></span>} />
                <KV k="Score" v={<span className={`font-semibold ${data.bureau.score >= 750 ? "text-emerald-600" : data.bureau.score >= 650 ? "text-amber-600" : "text-rose-600"}`}>{data.bureau.score}</span>} mono />
                <KV k="Band" v={data.bureau.score_band} />
                <KV k="Active accounts" v={data.bureau.active_accounts} mono />
                <KV k="Outstanding" v={fmtInr(data.bureau.total_outstanding)} mono />
                <KV k="Utilization" v={`${data.bureau.credit_utilization}%`} mono />
                <KV k="Max DPD" v={data.bureau.dpd_max} mono />
              </>
            ) : <div className="text-[12px] text-zinc-400 py-4">No bureau report fetched yet.</div>}
            {data.bureau?.is_mock && <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">Mock adapter data — not a live bureau fetch</div>}
          </Card>
        </div>
      )}

      {tab === "financial" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data.bank ? (
            <Card>
              <CardTitle title="Bank statement analysis" sub={`${data.bank.provider} · ${data.bank.months_analyzed} months · SANDBOX`} />
              <KV k="Monthly income" v={fmtInr(data.bank.monthly_income)} mono />
              <KV k="Monthly expenses" v={fmtInr(data.bank.monthly_expense)} mono />
              <KV k="Average balance" v={fmtInr(data.bank.avg_balance)} mono />
              <KV k="EMI obligations" v={fmtInr(data.bank.emi_obligations)} mono />
              <KV k="Banking surplus" v={<span className={data.bank.banking_surplus > 0 ? "text-emerald-600" : "text-rose-600"}>{fmtInr(data.bank.banking_surplus)}</span>} mono />
              <KV k="Cheque bounces" v={<span className={data.bank.bounce_count > 2 ? "text-rose-600" : ""}>{data.bank.bounce_count}</span>} mono />
              <KV k="Cash deposits" v={fmtInr(data.bank.cash_deposits)} mono />
              <KV k="Annual turnover" v={fmtInr(data.bank.turnover)} mono />
              <KV k="Risk" v={<Badge status={data.bank.risk} />} />
            </Card>
          ) : <Card><CardTitle title="Bank analysis" /><div className="text-[12px] text-zinc-400">No bank analysis yet.</div></Card>}
          <div className="space-y-4">
            <Card>
              <CardTitle title="Consents" sub="Centralized consent ledger" />
              {data.consents?.length ? data.consents.map((c2: any) => (
                <div key={c2.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div>
                    <div className="text-[12px] font-medium capitalize text-zinc-700">{c2.type}</div>
                    <div className="text-[10.5px] text-zinc-400">{c2.purpose} · {c2.channel}</div>
                  </div>
                  <Badge status={c2.status} />
                </div>
              )) : <div className="text-[12px] text-zinc-400">No consents recorded.</div>}
            </Card>
            <Card>
              <CardTitle title="Recent payments" />
              {data.payments?.length ? data.payments.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div>
                    <div className="text-[12px] font-medium text-zinc-700">{p.receipt_no}</div>
                    <div className="text-[10.5px] text-zinc-400 capitalize">{p.mode} · {fmtDate(p.received_at)}</div>
                  </div>
                  <div className="num text-[12.5px] font-semibold">{fmtInr(p.amount)}</div>
                </div>
              )) : <div className="text-[12px] text-zinc-400">No payments yet.</div>}
            </Card>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <Card>
          <CardTitle title="Document vault" sub="KYC, financial & business documents with verification state" />
          <div className="divide-y divide-zinc-50">
            {data.documents?.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5">
                <FileText size={15} className="text-zinc-300" />
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-zinc-800 capitalize">{d.category.replace(/_/g, " ")}</div>
                  <div className="text-[10.5px] text-zinc-400">{d.name} · v{d.version}{d.ocr_confidence ? ` · OCR confidence ${d.ocr_confidence}%` : ""}</div>
                </div>
                <Badge status={d.status} />
                {d.verified_at && <span className="text-[10.5px] text-zinc-400">{fmtDate(d.verified_at)}</span>}
              </div>
            ))}
            {!data.documents?.length && <div className="text-[12px] text-zinc-400 py-4">No documents uploaded.</div>}
          </div>
        </Card>
      )}

      {tab === "lending" && (
        <div className="space-y-4">
          <Card><DataTable columns={loanCols} rows={data.loans || []} exportName="customer-loans" /></Card>
          <Card><DataTable columns={appCols} rows={data.applications || []} exportName="customer-applications" /></Card>
        </div>
      )}

      {tab === "communication" && (
        <Card>
          <CardTitle title="Communication history" sub="Calls, WhatsApp and email across all leads" />
          <div className="space-y-3">
            {data.communications?.map((cm: any) => (
              <div key={cm.id} className="flex items-start gap-3 py-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${cm.kind === "call" ? "bg-brand-50 text-brand-700" : cm.kind === "whatsapp" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
                  {cm.kind === "call" ? "C" : cm.kind === "whatsapp" ? "W" : "E"}
                </span>
                <div className="flex-1">
                  <div className="text-[12px] text-zinc-700"><span className="font-medium capitalize">{cm.kind}</span> {cm.outcome && <span className="text-zinc-500">→ {cm.outcome}</span>}</div>
                  {cm.note && <div className="text-[11.5px] text-zinc-500 mt-0.5">{cm.note}</div>}
                  <div className="text-[10.5px] text-zinc-400 mt-0.5">{timeAgo(cm.created_at)}</div>
                </div>
              </div>
            ))}
            {!data.communications?.length && <div className="text-[12px] text-zinc-400 py-4">No communication yet.</div>}
          </div>
        </Card>
      )}
    </div>
  );
}
