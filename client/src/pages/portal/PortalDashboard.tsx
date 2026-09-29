import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { Card, Badge, Stat, PageHeader } from "../../components/ui";

export default function PortalDashboard() {
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api("/portal/summary").then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <div className="py-16 text-center text-[13px] text-zinc-400">Loading your account…</div>;

  const { customer, loans, applications, next_due, docs_pending, notifications, totals } = data;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${customer.name.split(" ")[0]}`}
        sub={`Customer ${customer.customer_no} · KYC ${customer.kyc_status}`}
        actions={<button className="btn btn-primary" onClick={() => nav("/portal/apply")}>Apply for a loan</button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Active loans" value={totals.active_loans} tone="brand" />
        <Stat label="Outstanding balance" value={fmtInr(totals.outstanding)} tone="brand" />
        <Stat label="Next EMI due" value={next_due ? fmtInr(next_due.total - next_due.paid_amount) : "—"} sub={next_due ? fmtDate(next_due.due_date) : "No dues"} tone="amber" />
        <Stat label="Documents pending" value={docs_pending} tone={docs_pending > 0 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-zinc-900">My loans</h3>
            <button className="text-[11px] text-brand-600 font-medium cursor-pointer" onClick={() => nav("/portal/loans")}>View all</button>
          </div>
          <div className="space-y-2">
            {loans.slice(0, 4).map((l: any) => (
              <button key={l.id} className="w-full text-left rounded-md border border-zinc-100 hover:border-zinc-300 px-3 py-2.5 cursor-pointer" onClick={() => nav(`/portal/loans/${l.id}`)}>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-zinc-800">{l.loan_no}</span>
                  <Badge status={l.status} />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11.5px] text-zinc-500">
                  <span>{l.product_name}</span>
                  <span className="num font-medium text-zinc-700">{fmtInr(l.outstanding)} outstanding</span>
                </div>
              </button>
            ))}
            {!loans.length && <div className="text-[12px] text-zinc-400 py-6 text-center">No loans yet.</div>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-zinc-900">Applications</h3>
            <button className="text-[11px] text-brand-600 font-medium cursor-pointer" onClick={() => nav("/portal/applications")}>View all</button>
          </div>
          <div className="space-y-2">
            {applications.slice(0, 4).map((a: any) => (
              <button key={a.id} className="w-full text-left rounded-md border border-zinc-100 hover:border-zinc-300 px-3 py-2.5 cursor-pointer" onClick={() => nav(`/portal/applications/${a.id}`)}>
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-zinc-800">{a.application_no}</span>
                  <Badge status={a.stage} />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11.5px] text-zinc-500">
                  <span>{a.product_name}</span>
                  <span className="num font-medium text-zinc-700">{fmtInr(a.requested_amount)}</span>
                </div>
              </button>
            ))}
            {!applications.length && <div className="text-[12px] text-zinc-400 py-6 text-center">No applications yet — apply today.</div>}
          </div>
        </Card>

        <Card>
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-2">Notifications</h3>
          <div className="space-y-2.5">
            {notifications.slice(0, 6).map((n: any) => (
              <div key={n.id} className="text-[11.5px]">
                <div className="text-zinc-700 font-medium">{n.title}</div>
                <div className="text-zinc-500 mt-0.5">{n.body}</div>
              </div>
            ))}
            {!notifications.length && <div className="text-[12px] text-zinc-400">No notifications.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
