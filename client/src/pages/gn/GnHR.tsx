import { useEffect, useState } from "react";
import { Card, CardTitle, PageHeader, Badge, Tabs, Field, Modal, Stat } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ImportExport } from "./shared";

const LEAVE_BADGE: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700"
};

export function GnHR() {
  const { user } = useAuth();
  const myName = user?.name ?? "Employee";
  const myRole = user?.role ?? "—";
  const [tab, setTab] = useState("my_attendance");
  const [team, setTeam] = useState<any[]>([]);
  const [leave, setLeave] = useState<any[]>([]);
  const [att, setAtt] = useState<any>({ rows: [], summary: [] });
  const [payroll, setPayroll] = useState<any[]>([]);
  const [recruits, setRecruits] = useState<any[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);

  const load = () => {
    api("/gn/team").then(setTeam).catch(() => {});
    api("/gn/hr/leave").then(setLeave).catch(() => {});
    api("/gn/hr/attendance").then(setAtt).catch(() => {});
    api("/gn/hr/payroll").then(setPayroll).catch(() => {});
    api("/gn/hr/recruitment").then(setRecruits).catch(() => {});
  };
  useEffect(load, []);

  const attend = (att.summary || []).reduce((m: any, s: any) => { m[s.status] = s.n; return m; }, {});

  return (
    <div className="space-y-5">
      <PageHeader title="HR & Workforce" sub="Employees, attendance, leave, payroll and recruitment" breadcrumb="Growth Nations / HR" actions={
        <div className="flex items-center gap-2"><ImportExport entity="leave" /><button className="btn btn-primary text-[12px]" onClick={() => setLeaveOpen(true)}>+ Leave Request</button></div>
      } />
      <Tabs items={[
        { key: "my_attendance", label: "My Attendance" },
        { key: "team", label: "Team", count: team.length },
        { key: "attendance", label: "Attendance", count: att.rows.length },
        { key: "leave", label: "Leave", count: leave.length },
        { key: "salary", label: "Salary Slips", count: payroll.length },
        { key: "payroll", label: "Payroll", count: payroll.length },
        { key: "recruitment", label: "Recruitment", count: recruits.length }
      ]} active={tab} onChange={setTab} />

      {tab === "my_attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardTitle title="Today" sub={`${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`} />
            <div className="mt-3 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[18px] font-bold text-emerald-600">{myName.slice(0, 1)}</div>
              <div>
                <div className="text-[13px] font-semibold text-zinc-800">{myName}</div>
                <div className="text-[11.5px] text-zinc-400">{myRole}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-zinc-100 py-2.5"><div className="text-[9.5px] uppercase text-zinc-400">Check-in</div><div className="text-[13px] font-bold text-zinc-800">09:{String(10 + Math.floor(Math.random() * 40)).padStart(2, "0")}</div></div>
              <div className="rounded-lg border border-zinc-100 py-2.5"><div className="text-[9.5px] uppercase text-zinc-400">Check-out</div><div className="text-[13px] font-bold text-zinc-800">Pending</div></div>
            </div>
            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-[11.5px] text-emerald-700 font-medium">● Marked present</div>
          </Card>
          <Card className="lg:col-span-2">
            <CardTitle title="My Leave Balance" sub="This month" />
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["Casual", 5], ["Sick", 4], ["Privileged", 8], ["Unpaid", 0]].map(([l, v]) => (
                <div key={l as string} className="rounded-lg border border-zinc-100 px-3 py-2.5"><div className="text-[9.5px] uppercase text-zinc-400">{l} leave</div><div className="text-[18px] font-bold text-zinc-800">{v}<span className="text-[11px] text-zinc-400 font-normal"> / 12</span></div></div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "salary" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">Salary Slips — {payroll.length} generated this month</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Employee</th><th className="px-3 py-2.5 font-semibold">Month</th><th className="px-3 py-2.5 font-semibold text-right">Basic</th><th className="px-3 py-2.5 font-semibold text-right">HRA</th><th className="px-3 py-2.5 font-semibold text-right">Allowance</th><th className="px-3 py-2.5 font-semibold text-right">Gross</th><th className="px-3 py-2.5 font-semibold text-right">TDS</th><th className="px-3 py-2.5 font-semibold text-right">Net Pay</th><th className="px-3 py-2.5 font-semibold">Status</th>
              </tr></thead>
              <tbody>
                {payroll.map((p: any) => (
                  <tr key={p.id} className="border-b border-zinc-50">
                    <td className="px-3 py-2.5 font-medium text-zinc-800">{p.user_name}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{p.month}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600">{fmtInr(p.basic)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600">{fmtInr(p.hra)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600">{fmtInr(p.allowance)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-zinc-800">{fmtInr(p.gross)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600">{fmtInr(p.tds)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{fmtInr(p.net)}</td>
                    <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">{p.status}</span></Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "team" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Employee</th><th className="px-3 py-2.5 font-semibold">Role</th><th className="px-3 py-2.5 font-semibold">Phone</th><th className="px-3 py-2.5 font-semibold">Applications</th><th className="px-3 py-2.5 font-semibold">Disbursed</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {team.map((u) => (
                <tr key={u.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{u.name}<div className="text-[10.5px] text-zinc-400">{u.email}</div></td>
                  <td className="px-3 py-2.5 text-zinc-600">{u.role}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{u.phone ?? "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{u.applications}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{fmtInr(u.disbursed)}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">{u.active ? "Active" : "Inactive"}</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Records" value={att.rows.length} />
            <Stat label="Present" value={attend.present ?? 0} tone="green" />
            <Stat label="Leave" value={attend.leave ?? 0} tone="amber" />
            <Stat label="Half Day" value={attend.half_day ?? 0} />
          </div>
          <Card pad={false}>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Date</th><th className="px-3 py-2.5 font-semibold">Employee</th><th className="px-3 py-2.5 font-semibold">Check-in</th><th className="px-3 py-2.5 font-semibold">Check-out</th><th className="px-3 py-2.5 font-semibold">Status</th>
              </tr></thead>
              <tbody>
                {att.rows.slice(0, 60).map((a: any) => (
                  <tr key={a.id} className="border-b border-zinc-50">
                    <td className="px-3 py-2.5 text-zinc-600">{fmtDate(a.date)}</td>
                    <td className="px-3 py-2.5 font-medium text-zinc-800">{a.user_name}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{a.check_in ?? "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{a.check_out ?? "—"}</td>
                    <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-zinc-200 bg-zinc-50 text-zinc-600">{a.status}</span></Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "leave" && (
        <Card pad={false}>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Employee</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">From</th><th className="px-3 py-2.5 font-semibold">To</th><th className="px-3 py-2.5 font-semibold">Days</th><th className="px-3 py-2.5 font-semibold">Reason</th><th className="px-3 py-2.5 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {leave.map((l: any) => (
                <tr key={l.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{l.user_name}</td>
                  <td className="px-3 py-2.5 text-zinc-600 capitalize">{l.leave_type}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{l.from_date}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{l.to_date}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{l.days}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{l.reason ?? "—"}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${LEAVE_BADGE[l.status]}`}>{l.status}</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "payroll" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn btn-secondary text-[12px]" onClick={async () => { await api("/gn/hr/payroll/generate", { method: "POST", body: { month: new Date().toISOString().slice(0, 7) } }); load(); }}>Generate Month Payroll</button>
          </div>
          <Card pad={false}>
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
                <th className="px-3 py-2.5 font-semibold">Month</th><th className="px-3 py-2.5 font-semibold">Employee</th><th className="px-3 py-2.5 font-semibold">Role</th><th className="px-3 py-2.5 font-semibold">Basic</th><th className="px-3 py-2.5 font-semibold">HRA</th><th className="px-3 py-2.5 font-semibold">Gross</th><th className="px-3 py-2.5 font-semibold">TDS</th><th className="px-3 py-2.5 font-semibold">Net</th>
              </tr></thead>
              <tbody>
                {payroll.map((p: any) => (
                  <tr key={p.id} className="border-b border-zinc-50">
                    <td className="px-3 py-2.5 text-zinc-600">{p.month}</td>
                    <td className="px-3 py-2.5 font-medium text-zinc-800">{p.user_name}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{p.role}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{fmtInr(p.basic)}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{fmtInr(p.hra)}</td>
                    <td className="px-3 py-2.5 font-semibold text-zinc-800">{fmtInr(p.gross)}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{fmtInr(p.tds)}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-600">{fmtInr(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "recruitment" && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex justify-end"><button className="btn btn-secondary text-[12px]" onClick={() => setCandOpen(true)}>+ Add Candidate</button></div>
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="px-3 py-2.5 font-semibold">Candidate</th><th className="px-3 py-2.5 font-semibold">Position</th><th className="px-3 py-2.5 font-semibold">Source</th><th className="px-3 py-2.5 font-semibold">Stage</th>
            </tr></thead>
            <tbody>
              {recruits.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 font-medium text-zinc-800">{c.name}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.position}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{c.source}</td>
                  <td className="px-3 py-2.5"><Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border border-sky-200 bg-sky-50 text-sky-700">{c.stage}</span></Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <LeaveModal open={leaveOpen} onClose={() => setLeaveOpen(false)} team={team} onDone={() => { setLeaveOpen(false); load(); }} />
      <CandModal open={candOpen} onClose={() => setCandOpen(false)} onDone={() => { setCandOpen(false); load(); }} />
    </div>
  );
}

function LeaveModal({ open, onClose, team, onDone }: any) {
  const [f, setF] = useState<any>({ user_id: "", leave_type: "casual", from_date: "", to_date: "", days: 1, reason: "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/hr/leave", { method: "POST", body: { ...f, user_id: Number(f.user_id), days: Number(f.days) } }); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Leave Request">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Employee"><select className="input text-[12.5px]" value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value })}><option value="">Select…</option>{team.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Type"><select className="input text-[12.5px]" value={f.leave_type} onChange={(e) => setF({ ...f, leave_type: e.target.value })}>{["casual", "sick", "privileged", "unpaid"].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="From"><input className="input text-[12.5px]" type="date" value={f.from_date} onChange={(e) => setF({ ...f, from_date: e.target.value })} /></Field>
        <Field label="To"><input className="input text-[12.5px]" type="date" value={f.to_date} onChange={(e) => setF({ ...f, to_date: e.target.value })} /></Field>
        <Field label="Days"><input className="input text-[12.5px]" type="number" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></Field>
        <Field label="Reason"><input className="input text-[12.5px]" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.user_id || !f.from_date} onClick={save}>{busy ? "Saving…" : "Submit"}</button>
      </div>
    </Modal>
  );
}

function CandModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ name: "", position: "", phone: "", source: "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/hr/recruitment", { method: "POST", body: f }); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Candidate">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input className="input text-[12.5px]" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Position"><input className="input text-[12.5px]" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} /></Field>
        <Field label="Phone"><input className="input text-[12.5px]" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Source"><input className="input text-[12.5px]" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.name} onClick={save}>{busy ? "Saving…" : "Add Candidate"}</button>
      </div>
    </Modal>
  );
}
