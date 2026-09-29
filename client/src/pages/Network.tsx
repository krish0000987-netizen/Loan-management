import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtInr } from "../lib/api";
import { PageHeader, Card, CardTitle, Badge, DataTable, type Column, Stat } from "../components/ui";

export default function Network() {
  const nav = useNavigate();
  const [reports, setReports] = useState<any>(null);
  const [users, setUsers] = useState<any>({ rows: [] });

  useEffect(() => {
    api("/reports").then(setReports);
    api("/admin/users").then(setUsers);
  }, []);

  const dsaCols: Column<any>[] = [
    { key: "dsa", header: "DSA partner", render: (r) => <span className="font-medium">{r.dsa}</span> },
    { key: "leads", header: "Leads", align: "right", render: (r) => <span className="num">{r.leads}</span> },
    { key: "converted", header: "Converted", align: "right", render: (r) => <span className="num">{r.converted}</span> },
    { key: "applications", header: "Applications", align: "right", render: (r) => <span className="num">{r.applications}</span> },
    { key: "approved", header: "Approved", align: "right", render: (r) => <span className="num text-emerald-600">{r.approved}</span> },
    { key: "conv_rate", header: "Conversion", align: "right", render: (r) => <span className="num">{r.leads ? `${Math.round((r.converted / r.leads) * 100)}%` : "—"}</span> }
  ];

  const branchCols: Column<any>[] = [
    { key: "branch", header: "Branch", render: (r) => (
      <div><div className="font-medium">{r.branch}</div><div className="text-[10.5px] text-zinc-400">{r.city}</div></div>
    )},
    { key: "loans", header: "Loans", align: "right", render: (r) => <span className="num">{r.loans}</span> },
    { key: "outstanding", header: "Outstanding", align: "right", render: (r) => <span className="num">{fmtInr(r.outstanding)}</span> },
    { key: "applications", header: "Applications", align: "right", render: (r) => <span className="num">{r.applications}</span> },
    { key: "approved", header: "Approved", align: "right", render: (r) => <span className="num text-emerald-600">{r.approved}</span> },
    { key: "approval_rate", header: "Approval rate", align: "right", render: (r) => {
      const rate = r.applications ? Math.round((r.approved / r.applications) * 100) : 0;
      return <span className="num">{rate}%</span>;
    }}
  ];

  const dsaUsers = (users.rows || []).filter((u: any) => u.role === "dsa");
  const fieldUsers = (users.rows || []).filter((u: any) => u.role === "field_executive");
  const agents = (users.rows || []).filter((u: any) => u.role === "collection_agent");

  return (
    <div>
      <PageHeader title="Network & partners" sub="DSA channel, field sales and branch footprint" breadcrumb="Platform / Network" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="DSA partners" value={dsaUsers.length} />
        <Stat label="Field executives" value={fieldUsers.length} />
        <Stat label="Collection agents" value={agents.length} />
        <Stat label="Branches" value={reports?.branchPerformance?.length ?? 0} />
      </div>

      <div className="space-y-4">
        <Card>
          <CardTitle title="DSA partner performance" sub="Lead intake, conversion and approvals by partner" />
          <DataTable columns={dsaCols} rows={reports?.dsaPerformance || []} total={reports?.dsaPerformance?.length ?? 0} exportName="dsa-performance" />
        </Card>
        <Card>
          <CardTitle title="Branch footprint" sub="Loans, applications and approvals per branch" />
          <DataTable columns={branchCols} rows={reports?.branchPerformance || []} total={reports?.branchPerformance?.length ?? 0} exportName="branches" />
        </Card>
        <Card>
          <CardTitle title="Channel users" sub={`${dsaUsers.length} DSAs · ${fieldUsers.length} field · ${agents.length} agents on the platform`} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["dsa", "field_executive", "collection_agent"].map((role) => (
              <div key={role} className="rounded-lg border border-zinc-100 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">{role.replace(/_/g, " ")}s</div>
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {(users.rows || []).filter((u: any) => u.role === role).slice(0, 40).map((u: any) => (
                    <div key={u.id} className="text-[11.5px] text-zinc-600 flex justify-between">
                      <span>{u.name}</span>
                      <span className="text-zinc-400">{u.branch_name || "HQ"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
