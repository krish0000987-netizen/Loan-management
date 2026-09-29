import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, PageHeader, Badge, Field, Modal } from "../../components/ui";
import { api, fmtDate } from "../../lib/api";
import { Users, FileText, KeyRound, Palette, Trash2, Landmark, CalendarDays, Clock, ShieldCheck, Plus, Copy, Eye, EyeOff, ArrowRight } from "lucide-react";

type Settings = Record<string, any>;

const TABS = ["Roles & Permissions", "Company / Invoice", "API Access", "Reseller", "Banks & Wallet", "Leave Types", "Holidays", "Office Timings", "Start Fresh"];

export function GnSettings() {
  const [tab, setTab] = useState("Roles & Permissions");
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" sub="Manage roles & permissions, company/invoice details, API access, HR policies and white-label controls — everything saves and takes effect immediately" breadcrumb="Growth Nations / Settings" />
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${tab === t ? "bg-brand-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-brand-300"}`}>{t}</button>
        ))}
      </div>
      {tab === "Roles & Permissions" && <RolesTab />}
      {tab === "Company / Invoice" && <CompanyTab />}
      {tab === "API Access" && <ApiTab />}
      {tab === "Reseller" && <ResellerTab />}
      {tab === "Banks & Wallet" && <BankTab />}
      {tab === "Leave Types" && <LeaveTypesTab />}
      {tab === "Holidays" && <HolidaysTab />}
      {tab === "Office Timings" && <TimingsTab />}
      {tab === "Start Fresh" && <StartFreshTab />}
    </div>
  );
}

function useSettings() {
  const [s, setS] = useState<Settings>({});
  const [saved, setSaved] = useState<string | null>(null);
  const load = () => api<Settings>("/gn/admin/settings").then(setS).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async (key: string, value: any) => {
    await api(`/gn/admin/settings`, { method: "POST", body: { key, value } });
    setSaved(`${key} saved`);
    setTimeout(() => setSaved(null), 2500);
    load();
  };
  return { s, saved, save, reload: load };
}

function SaveBar({ saved, onSave, dirty }: { saved: string | null; onSave: () => void; dirty: boolean }) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
      <span className="text-[11px] text-zinc-400">{saved ? `✓ ${saved}` : dirty ? "Unsaved changes" : "All changes are saved automatically to this tenant only"}</span>
      <button onClick={onSave} className="px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700">Save Changes</button>
    </div>
  );
}

function EditableCard({ title, sub, icon: Icon, children, footer }: { title: string; sub: string; icon: any; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center"><Icon className="w-4 h-4 text-brand-600" /></div>
        <div>
          <div className="text-[13.5px] font-bold text-zinc-800">{title}</div>
          <div className="text-[11px] text-zinc-400">{sub}</div>
        </div>
      </div>
      {children}
      {footer}
    </Card>
  );
}

/* ---------------- Roles & Permissions ---------------- */

function RolesTab() {
  const nav = useNavigate();
  const { s } = useSettings();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="md:col-span-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center"><Users className="w-5 h-5 text-brand-600" /></div>
            <div>
              <div className="text-[14px] font-bold text-zinc-800">Roles & Permissions</div>
              <div className="text-[11.5px] text-zinc-400">Admin can switch any function on or off for any role — staff & partner. Enforced on the API and dashboards instantly.</div>
            </div>
          </div>
          <button onClick={() => nav("/gn/roles")} className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1.5">Open Roles & Permissions <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
          <Stat label="Configured roles" value={(s.gn_roles_count ?? 0) + ""} />
          <Stat label="Modules" value="14" />
          <Stat label="Actions per module" value="6" />
          <Stat label="Enforcement" value="Live" tone="green" />
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-zinc-600" /></div>
          <div className="text-[13px] font-bold text-zinc-800">How it works</div>
        </div>
        <ul className="text-[11.5px] text-zinc-500 space-y-2 leading-relaxed">
          <li>• Every module (Leads → Settings) has <b>View / Create / Update / Delete / Manage / Use</b> toggles.</li>
          <li>• Scope can be <b>All Records</b> or <b>Own Only</b> per module.</li>
          <li>• Save applies to the API immediately — a revoked permission returns <code className="text-[10.5px] bg-zinc-100 px-1 rounded">403 Permission denied</code>.</li>
        </ul>
      </Card>
      <Card>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center"><Users className="w-4 h-4 text-zinc-600" /></div>
          <div className="text-[13px] font-bold text-zinc-800">Staff & Partner roles</div>
        </div>
        <ul className="text-[11.5px] text-zinc-500 space-y-2 leading-relaxed">
          <li>• <b>Staff roles</b> (admin, credit, collections, sales…) group by designation.</li>
          <li>• <b>Partner roles</b> (DSA, Master DSA, Connector…) group by partner type.</li>
          <li>• Use <b>Apply to Designation / Partner Type</b> to copy a permission set to every role in the same group.</li>
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone = "brand" }: { label: string; value: string; tone?: "brand" | "green" }) {
  return (
    <div className={`rounded-xl border px-3.5 py-2.5 ${tone === "green" ? "border-emerald-100 bg-emerald-50/40" : "border-brand-100 bg-brand-50/40"}`}>
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="text-[17px] font-bold text-zinc-800">{value}</div>
    </div>
  );
}

/* ---------------- Company / Invoice ---------------- */

function CompanyTab() {
  const { s, saved, save } = useSettings();
  const c = s.gn_company ?? {};
  const [f, setF] = useState<Record<string, any>>({});
  useEffect(() => { if (Object.keys(f).length === 0 && Object.keys(c).length) setF(c); }, [c]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="space-y-4">
      <EditableCard title="Company / Invoice" sub="Shown on payouts, invoices, receipts and statements" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Company name"><input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} className={inp} /></Field>
          <Field label="Legal name"><input value={f.legal_name ?? ""} onChange={(e) => set("legal_name", e.target.value)} className={inp} /></Field>
          <Field label="Website"><input value={f.website ?? ""} onChange={(e) => set("website", e.target.value)} className={inp} /></Field>
          <Field label="GSTIN"><input value={f.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} className={inp} /></Field>
          <Field label="PAN"><input value={f.pan ?? ""} onChange={(e) => set("pan", e.target.value)} className={inp} /></Field>
          <Field label="CIN"><input value={f.cin ?? ""} onChange={(e) => set("cin", e.target.value)} className={inp} /></Field>
          <Field label="Email"><input value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inp} /></Field>
          <Field label="Phone"><input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inp} /></Field>
          <Field label="Invoice prefix"><input value={f.invoice_prefix ?? ""} onChange={(e) => set("invoice_prefix", e.target.value)} className={inp} /></Field>
          <Field label="TDS section"><input value={f.tds_section ?? ""} onChange={(e) => set("tds_section", e.target.value)} className={inp} /></Field>
          <Field label="TDS %"><input type="number" value={f.tds_pct ?? 2} onChange={(e) => set("tds_pct", Number(e.target.value))} className={inp} /></Field>
          <Field label="GST %"><input type="number" value={f.gst_pct ?? 18} onChange={(e) => set("gst_pct", Number(e.target.value))} className={inp} /></Field>
          <Field label="Address"><input value={f.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inp} /></Field>
          <Field label="City"><input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} className={inp} /></Field>
          <Field label="State"><input value={f.state ?? ""} onChange={(e) => set("state", e.target.value)} className={inp} /></Field>
          <Field label="Pincode"><input value={f.pincode ?? ""} onChange={(e) => set("pincode", e.target.value)} className={inp} /></Field>
        </div>
        <SaveBar saved={saved} dirty={false} onSave={() => save("gn_company", f)} />
      </EditableCard>
    </div>
  );
}

const inp = "w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:border-brand-400";

/* ---------------- API Access ---------------- */

function ApiTab() {
  const [keys, setKeys] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [show, setShow] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => api<any[]>("/gn/admin/api-keys").then(setKeys).catch(() => {});
  useEffect(() => { load(); }, []);
  const gen = async () => {
    if (!label.trim()) return;
    const r = await api<{ key: string }>("/gn/admin/api-keys", { method: "POST", body: { label } });
    setFresh(r.key); setLabel(""); setMsg(`Key created — copy it now, it will never be shown again.`); load();
  };
  const revoke = async (id: number) => {
    await api(`/gn/admin/api-keys/${id}`, { method: "DELETE" });
    load();
  };
  return (
    <div className="space-y-4">
      <EditableCard title="API Access" sub="Keys used by lenders & verification providers to push webhooks and pull data" icon={KeyRound}>
        <div className="flex items-end gap-3">
          <Field label="Key label"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Production — Lender A" className={inp} /></Field>
          <button onClick={gen} className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Generate Key</button>
        </div>
        {msg && <div className="mt-2 text-[11.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{msg}</div>}
        {fresh && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wider">New key — copy now (shown once)</div>
            <div className="text-[13px] font-mono text-zinc-800 mt-1 break-all">{fresh}</div>
          </div>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-[10px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="py-2 font-semibold">Label</th><th className="py-2 font-semibold">Key</th><th className="py-2 font-semibold">Created</th><th className="py-2 font-semibold">Last used</th><th className="py-2 font-semibold">Status</th><th className="py-2 text-right font-semibold">Actions</th></tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-zinc-50">
                  <td className="py-2.5 font-semibold text-zinc-800">{k.label}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-1.5">
                      <code className="text-[11px] text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded">{show[k.id] ? k.key : "••••••••••••••••"}</code>
                      <button onClick={() => setShow((x) => ({ ...x, [k.id]: !x[k.id] }))}>{show[k.id] ? <EyeOff className="w-3 h-3 text-zinc-400" /> : <Eye className="w-3 h-3 text-zinc-400" />}</button>
                      <button onClick={() => { navigator.clipboard?.writeText(k.key ?? ""); }}><Copy className="w-3 h-3 text-zinc-400 hover:text-brand-600" /></button>
                    </span>
                  </td>
                  <td className="py-2.5 text-zinc-500">{fmtDate(k.created_at)}</td>
                  <td className="py-2.5 text-zinc-500">{k.last_used ? fmtDate(k.last_used) : "—"}</td>
                  <td className="py-2.5"><Badge status=""><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 capitalize">{k.status}</span></Badge></td>
                  <td className="py-2.5 text-right"><button onClick={() => revoke(k.id)} className="text-[11px] font-semibold text-rose-600 hover:underline">Revoke</button></td>
                </tr>
              ))}
              {!keys.length && <tr><td colSpan={6} className="py-6 text-center text-zinc-400 text-[12px]">No API keys yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[10.5px] text-zinc-400">Webhook receiver: <code className="bg-zinc-100 px-1.5 py-0.5 rounded">POST /api/gn/webhooks/lender/:id</code> — public, idempotent, audit-logged. Pass the key as <code className="bg-zinc-100 px-1.5 py-0.5 rounded">x-api-key</code> for private endpoints.</div>
      </EditableCard>
    </div>
  );
}

/* ---------------- Reseller ---------------- */

function ResellerTab() {
  const { s, saved, save } = useSettings();
  const r = s.gn_reseller ?? {};
  const [f, setF] = useState<Record<string, any>>({});
  useEffect(() => { if (Object.keys(f).length === 0 && Object.keys(r).length) setF(r); }, [r]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  return (
    <EditableCard title="Reseller / White-Label" sub="Brand the portal for a reseller or white-label partner" icon={Palette}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="White-label enabled">
          <button onClick={() => set("enabled", !f.enabled)} className={`w-12 h-6.5 rounded-full transition-colors relative ${f.enabled ? "bg-emerald-500" : "bg-zinc-200"}`} style={{ height: 26 }}>
            <span className={`absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white shadow transition-all ${f.enabled ? "left-6" : "left-0.5"}`} style={{ width: 22, height: 22 }} />
          </button>
        </Field>
        <Field label="Brand name"><input value={f.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} className={inp} /></Field>
        <Field label="Portal name"><input value={f.portal_name ?? ""} onChange={(e) => set("portal_name", e.target.value)} className={inp} /></Field>
        <Field label="Support email"><input value={f.support_email ?? ""} onChange={(e) => set("support_email", e.target.value)} className={inp} /></Field>
        <Field label="Custom domain"><input value={f.domain ?? ""} onChange={(e) => set("domain", e.target.value)} placeholder="partner.yourbrand.in" className={inp} /></Field>
        <Field label="Primary color"><input type="color" value={f.primary_color ?? "#2563eb"} onChange={(e) => set("primary_color", e.target.value)} className="w-full h-9 rounded-lg border border-zinc-200" /></Field>
      </div>
      <div className="mt-3 text-[10.5px] text-zinc-400">White-label applies to the partner/customer portal chrome, email templates, KFS and agreement letterheads. Data remains tenant-isolated.</div>
      <div className="mt-3"><SaveBar saved={saved} dirty={false} onSave={() => save("gn_reseller", f)} /></div>
    </EditableCard>
  );
}

/* ---------------- Banks & Wallet ---------------- */

function BankTab() {
  const { s, saved, save } = useSettings();
  const b = s.gn_bank ?? {};
  const [f, setF] = useState<Record<string, any>>({});
  useEffect(() => { if (Object.keys(f).length === 0 && Object.keys(b).length) setF(b); }, [b]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  return (
    <EditableCard title="Banks & Wallet" sub="Operating bank account used for payouts, settlements and wallet balance" icon={Landmark}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Account name"><input value={f.account_name ?? ""} onChange={(e) => set("account_name", e.target.value)} className={inp} /></Field>
        <Field label="Bank"><input value={f.bank ?? ""} onChange={(e) => set("bank", e.target.value)} className={inp} /></Field>
        <Field label="Account number"><input value={f.account_no ?? ""} onChange={(e) => set("account_no", e.target.value)} className={inp} /></Field>
        <Field label="IFSC"><input value={f.ifsc ?? ""} onChange={(e) => set("ifsc", e.target.value)} className={inp} /></Field>
        <Field label="UPI ID"><input value={f.upi ?? ""} onChange={(e) => set("upi", e.target.value)} className={inp} /></Field>
        <Field label="Settlement cycle (days)"><input type="number" value={f.settlement_cycle_days ?? 7} onChange={(e) => set("settlement_cycle_days", Number(e.target.value))} className={inp} /></Field>
      </div>
      <div className="mt-3"><SaveBar saved={saved} dirty={false} onSave={() => save("gn_bank", f)} /></div>
    </EditableCard>
  );
}

/* ---------------- Leave Types ---------------- */

function LeaveTypesTab() {
  const { s, saved, save } = useSettings();
  const rows = (s.gn_leave_types ?? []) as any[];
  const [draft, setDraft] = useState<Record<string, any>>({});
  const add = () => {
    if (!draft.name) return;
    const next = [...rows, { ...draft, code: draft.code ?? draft.name.slice(0, 2).toUpperCase(), paid: !!draft.paid, days: Number(draft.days) || 10, carry_forward: Number(draft.carry_forward) || 0, applicable_to: draft.applicable_to ?? "staff" }];
    save("gn_leave_types", next); setDraft({});
  };
  const remove = (i: number) => save("gn_leave_types", rows.filter((_, x) => x !== i));
  return (
    <EditableCard title="Leave Types" sub="Define paid/unpaid leave categories & balances shown in HR" icon={CalendarDays}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[10px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="py-2 font-semibold">Name</th><th className="py-2 font-semibold">Code</th><th className="py-2 font-semibold">Paid</th><th className="py-2 font-semibold text-right">Days</th><th className="py-2 font-semibold text-right">Carry fwd</th><th className="py-2 font-semibold">Applicable to</th><th className="py-2 text-right font-semibold">Action</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-zinc-50">
                <td className="py-2.5 font-semibold text-zinc-800">{r.name}</td>
                <td className="py-2.5"><Badge status=""><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">{r.code}</span></Badge></td>
                <td className="py-2.5"><span className={`text-[10.5px] font-bold ${r.paid ? "text-emerald-600" : "text-zinc-400"}`}>{r.paid ? "Paid" : "Unpaid"}</span></td>
                <td className="py-2.5 text-right font-semibold">{r.days}</td>
                <td className="py-2.5 text-right text-zinc-500">{r.carry_forward}</td>
                <td className="py-2.5 text-zinc-500 capitalize">{r.applicable_to}</td>
                <td className="py-2.5 text-right"><button onClick={() => remove(i)} className="text-[11px] font-semibold text-rose-600 hover:underline">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2">
        <input value={draft.name ?? ""} onChange={(e) => setDraft((x) => ({ ...x, name: e.target.value }))} placeholder="Leave name" className={inp} />
        <input value={draft.code ?? ""} onChange={(e) => setDraft((x) => ({ ...x, code: e.target.value.toUpperCase() }))} placeholder="Code" className={inp} />
        <input type="number" value={draft.days ?? ""} onChange={(e) => setDraft((x) => ({ ...x, days: e.target.value }))} placeholder="Days" className={inp} />
        <input type="number" value={draft.carry_forward ?? ""} onChange={(e) => setDraft((x) => ({ ...x, carry_forward: e.target.value }))} placeholder="Carry fwd" className={inp} />
        <select value={draft.applicable_to ?? "staff"} onChange={(e) => setDraft((x) => ({ ...x, applicable_to: e.target.value }))} className={inp}>
          <option value="staff">Staff</option><option value="field">Field</option><option value="manager">Manager</option><option value="all">All</option>
        </select>
        <button onClick={add} className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
      </div>
      <div className="mt-3 text-[10.5px] text-zinc-400">{saved ? `✓ ${saved}` : "Leave types apply to leave requests raised in HR"}</div>
    </EditableCard>
  );
}

/* ---------------- Holidays ---------------- */

function HolidaysTab() {
  const { s, saved, save } = useSettings();
  const rows = (s.gn_holidays ?? []) as any[];
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const add = () => {
    if (!name || !date) return;
    save("gn_holidays", [...rows, { name, date }]); setName(""); setDate("");
  };
  const remove = (i: number) => save("gn_holidays", rows.filter((_, x) => x !== i));
  return (
    <EditableCard title="Holidays" sub="Public holidays & off days — used for SLA countdowns and attendance" icon={CalendarDays}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 flex items-center justify-between">
            <div><div className="text-[12px] font-semibold text-zinc-700">{r.name}</div><div className="text-[10.5px] text-zinc-400">{fmtDate(r.date)}</div></div>
            <button onClick={() => remove(i)} className="text-rose-500 hover:text-rose-700 text-[12px]">×</button>
          </div>
        ))}
        {!rows.length && <div className="text-[12px] text-zinc-400 col-span-4 py-4 text-center">No holidays configured</div>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Holiday name" className={inp + " flex-1 min-w-[180px]"} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
        <button onClick={add} className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Holiday</button>
      </div>
      <div className="mt-3 text-[10.5px] text-zinc-400">{saved ? `✓ ${saved}` : "Holidays pause SLA clocks for in-flight applications"}</div>
    </EditableCard>
  );
}

/* ---------------- Office Timings ---------------- */

function TimingsTab() {
  const { s, saved, save } = useSettings();
  const t = s.gn_office_timings ?? {};
  const [f, setF] = useState<Record<string, any>>({});
  useEffect(() => { if (Object.keys(f).length === 0 && Object.keys(t).length) setF(t); }, [t]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  const DAYS = [["1", "Mon"], ["2", "Tue"], ["3", "Wed"], ["4", "Thu"], ["5", "Fri"], ["6", "Sat"], ["0", "Sun"]] as const;
  const toggleDay = (d: string) => {
    const cur: number[] = Array.isArray(f.workdays) ? f.workdays : [1, 2, 3, 4, 5, 6];
    set("workdays", cur.includes(Number(d)) ? cur.filter((x) => x !== Number(d)) : [...cur, Number(d)]);
  };
  return (
    <EditableCard title="Office Timings" sub="Working hours, shifts & attendance rules" icon={Clock}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Field label="Start"><input type="time" value={f.start ?? "09:30"} onChange={(e) => set("start", e.target.value)} className={inp} /></Field>
        <Field label="End"><input type="time" value={f.end ?? "18:30"} onChange={(e) => set("end", e.target.value)} className={inp} /></Field>
        <Field label="Lunch start"><input type="time" value={f.lunch_start ?? "13:30"} onChange={(e) => set("lunch_start", e.target.value)} className={inp} /></Field>
        <Field label="Lunch end"><input type="time" value={f.lunch_end ?? "14:00"} onChange={(e) => set("lunch_end", e.target.value)} className={inp} /></Field>
        <Field label="Grace (min)"><input type="number" value={f.grace_minutes ?? 15} onChange={(e) => set("grace_minutes", Number(e.target.value))} className={inp} /></Field>
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-semibold text-zinc-600 mb-1.5">Working days</div>
        <div className="flex gap-2">
          {DAYS.map(([d, l]) => (
            <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold ${(f.workdays ?? []).includes(Number(d)) ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-500"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="mt-3"><SaveBar saved={saved} dirty={false} onSave={() => save("gn_office_timings", f)} /></div>
    </EditableCard>
  );
}

/* ---------------- Start Fresh ---------------- */

function StartFreshTab() {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const reset = async () => {
    setBusy(true);
    try {
      const r = await api<{ cleared: Record<string, number> }>("/gn/admin/start-fresh", { method: "POST" });
      setResult(r.cleared); setConfirm(false);
    } finally { setBusy(false); }
  };
  return (
    <EditableCard title="Start Fresh" sub="Reset your data — careful, cannot be undone" icon={Trash2}>
      {!result ? (
        <>
          <div className="text-[12px] text-zinc-500 leading-relaxed">This clears all <b>Growth Nations transactional data</b> — applications, leads, commissions, payouts, fees, expenses, tasks, HR records, campaigns and documents. Masters (banks, products, schemes, partners, roles & settings) are <b>kept</b> so you can start collecting data immediately.</div>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="mt-3 px-4 py-2 rounded-lg text-[12px] font-semibold bg-rose-600 text-white hover:bg-rose-700">Reset demo data…</button>
          ) : (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <div className="text-[12px] font-semibold text-rose-700">Are you sure? This permanently deletes transactional records.</div>
              <div className="flex gap-2 mt-2">
                <button onClick={reset} disabled={busy} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-rose-600 text-white">{busy ? "Resetting…" : "Yes, reset everything"}</button>
                <button onClick={() => setConfirm(false)} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border border-zinc-200 text-zinc-600">Cancel</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="text-[13px] font-bold text-emerald-700 mb-2">✓ Reset complete — {Object.values(result).reduce((a, b) => a + b, 0)} records cleared</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(result).filter(([, n]) => n > 0).map(([k, n]) => (
              <div key={k} className="rounded-lg border border-zinc-100 px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-zinc-400">{k.replace("gn_", "")}</div><div className="text-[15px] font-bold text-zinc-800">{n}</div></div>
            ))}
          </div>
          <button onClick={() => setResult(null)} className="mt-3 text-[12px] font-semibold text-brand-600 hover:underline">Back to Start Fresh</button>
        </div>
      )}
    </EditableCard>
  );
}
