import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, EmptyState, Field, Modal } from "../../components/ui";
import { api, fmtInr, fmtDate } from "../../lib/api";
import { useSearchParams } from "react-router-dom";
import { ImportExport, AnyFileImport, SchemeForm } from "./shared";
import { Plus, Wand2, Scale } from "lucide-react";

const TABS = ["Banks", "Products", "Schemes", "DSA Codes", "Parent DSAs", "Payout Structure", "Sales Targets", "Territories", "Customer Profile", "Scheme Feed"];

export function GnMasters() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab") ?? "") ? params.get("tab")! : "Banks";
  return (
    <div className="space-y-5">
      <PageHeader title="Masters" sub="Set up the reference data your CRM runs on — a strong master saves 100 hours in operations" breadcrumb="Growth Nations / Masters" />
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setParams({ tab: t })} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${tab === t ? "bg-brand-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-brand-300"}`}>{t}</button>
        ))}
      </div>
      {tab === "Banks" && <Banks />}
      {tab === "Products" && <Products />}
      {tab === "Schemes" && <Schemes />}
      {tab === "DSA Codes" && <DSACodes />}
      {tab === "Parent DSAs" && <ParentDSAs />}
      {tab === "Payout Structure" && <Payouts />}
      {tab === "Sales Targets" && <SalesTargets />}
      {tab === "Territories" && <Territories />}
      {tab === "Customer Profile" && <CustomerProfiles />}
      {tab === "Scheme Feed" && <SchemeFeed />}
    </div>
  );
}

function Banks() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/gn/lenders").then(setRows).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100 flex items-center justify-between"><span className="text-[12.5px] font-semibold text-zinc-700">Banks — lenders you work with</span><Badge status=""><span className="text-[10.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{rows.filter((r) => r.status === "active").length} Active · {rows.filter((r) => r.status !== "active").length} Inactive</span></Badge></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold">Products</th><th className="px-3 py-2.5 font-semibold">API Status</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.name}</td>
                <td className="px-3 py-2.5 text-zinc-500 capitalize">{r.type}</td>
                <td className="px-3 py-2.5 text-zinc-500">{r.products_count ?? "—"}</td>
                <td className="px-3 py-2.5"><Badge status=""><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${r.api_status === "connected" ? "bg-emerald-50 text-emerald-600" : r.api_status === "sandbox" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>{r.api_status ?? "not configured"}</span></Badge></td>
                <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Products() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/gn/products").then((r) => setRows(r.rows)).catch(() => {}); }, []);
  const parents = rows.filter((p) => !p.parent_id);
  const subCount = rows.length - parents.length;
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100 flex items-center justify-between"><span className="text-[12.5px] font-semibold text-zinc-700">Products — {rows.length} total ({parents.length} parents + {subCount} sub-products)</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Name</th><th className="px-3 py-2.5 font-semibold">Category</th><th className="px-3 py-2.5 font-semibold">Lender</th><th className="px-3 py-2.5 font-semibold text-right">Min–Max</th><th className="px-3 py-2.5 font-semibold text-right">Payout</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{p.name} {p.parent_id && <span className="text-[9.5px] text-zinc-400">(sub-product)</span>}</td>
                <td className="px-3 py-2.5 text-zinc-500">{p.category}</td>
                <td className="px-3 py-2.5 text-zinc-500">{p.lender_name ?? "—"}</td>
                <td className="px-3 py-2.5 text-right text-zinc-600">{fmtInr(p.min_amount)} – {fmtInr(p.max_amount)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{p.payout_pct}%</td>
                <td className="px-3 py-2.5"><span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Schemes() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/gn/schemes").then(setRows).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">Commission Schemes — {rows.length} total · flat, percentage & slab-based</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Scheme</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Product</th><th className="px-3 py-2.5 font-semibold text-right">Payout Type</th><th className="px-3 py-2.5 font-semibold text-right">Rate</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{s.name}</td>
                <td className="px-3 py-2.5 text-zinc-500">{s.lender_name ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-500">{s.product_name ?? s.product_category ?? "—"}</td>
                <td className="px-3 py-2.5 text-right text-zinc-500">{s.payout_type}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{s.rate ? `${s.rate}%` : "slab"}</td>
                <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DSACodes() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/gn/dsa-codes").then(setRows).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">DSA Code Master — {rows.length} codes registered per bank / parent DSA</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Via Bank / Parent DSA</th><th className="px-3 py-2.5 font-semibold">Scope</th><th className="px-3 py-2.5 font-semibold">Code</th><th className="px-3 py-2.5 font-semibold">Label</th><th className="px-3 py-2.5 font-semibold">Product</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.lender_name ?? r.parent_name ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-500">{r.via_parent ? "via parent DSA" : "tenant-wide"}</td>
                <td className="px-3 py-2.5 font-mono font-semibold text-brand-700">{r.code}</td>
                <td className="px-3 py-2.5 text-zinc-600">{r.label ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-500">{r.product_name ?? "—"}</td>
                <td className="px-3 py-2.5"><span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ParentDSAs() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/gn/parent-dsas").then(setRows).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">Parent DSA Master — bigger DSAs you operate under (sub-DSA relationships)</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Parent DSA</th><th className="px-3 py-2.5 font-semibold">Bank Codes</th><th className="px-3 py-2.5 font-semibold">Contact</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{r.name}</td>
                <td className="px-3 py-2.5 text-zinc-500">{r.bank_codes ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-500">{r.contact ?? "—"}</td>
                <td className="px-3 py-2.5"><span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Payouts() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/gn/partners").then(setRows).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">Payout Structure — per-partner commission share</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Partner</th><th className="px-3 py-2.5 font-semibold">Type</th><th className="px-3 py-2.5 font-semibold text-right">Commission %</th><th className="px-3 py-2.5 font-semibold">Parent</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{p.name}</td>
                <td className="px-3 py-2.5 text-zinc-500">{p.type}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{p.commission_pct}%</td>
                <td className="px-3 py-2.5 text-zinc-500">{p.parent_name ?? "—"}</td>
                <td className="px-3 py-2.5"><span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SalesTargets() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/gn/partners").then((r) => { const d = r.slice(0, 8); setRows(d.map((p: any) => ({ ...p, target: Math.round((p.commission_pct || 20) * 80000) }))); }).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">Sales Team Targets — August {new Date().getFullYear()}</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Salesperson</th><th className="px-3 py-2.5 font-semibold text-right">Logins (apps)</th><th className="px-3 py-2.5 font-semibold text-right">Disbursement (₹)</th><th className="px-3 py-2.5 font-semibold text-right">Loans</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5 font-semibold text-zinc-800">{p.name} <span className="text-[10px] text-zinc-400">({p.type})</span></td>
                <td className="px-3 py-2.5 text-right text-zinc-600">{Math.max(4, Math.round((p.commission_pct || 20) / 5))}</td>
                <td className="px-3 py-2.5 text-right font-medium text-zinc-800">{fmtInr(p.target)}</td>
                <td className="px-3 py-2.5 text-right text-zinc-600">{Math.max(1, Math.round((p.commission_pct || 20) / 8))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Territories() {
  const states = ["Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Gujarat", "Haryana", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100 flex items-center justify-between"><span className="text-[12.5px] font-semibold text-zinc-700">Pin Code Master — {states.length} top-level territories</span><Badge status=""><span className="text-[10.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span></Badge></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-100">
        {states.map((s) => (
          <div key={s} className="bg-white px-3 py-2 text-[12px] font-medium text-zinc-700 flex items-center justify-between"><span>{s}</span><span className="text-[10px] text-zinc-400 font-normal">synced</span></div>
        ))}
      </div>
    </Card>
  );
}

function CustomerProfiles() {
  const profiles = ["Bank Salary", "Cash Salary", "Pvt Limited", "LLP", "Trust", "NRI", "Single Lady", "Salaried Professional"];
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">Customer Profile — categories used on schemes & leads</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-100">
        {profiles.map((p) => (
          <div key={p} className="bg-white px-3 py-2.5 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-zinc-700">{p}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const FEED_TABS = ["Scheme Feed", "All Schemes", "Add Scheme", "Matcher Config V2", "Compliance"];
const ALL_STATES = ["Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Gujarat", "Haryana", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];
const ALL_PROGRAMS = ["Standard", "BT", "LRD", "Top-up", "Surrogate", "Home Purchase", "Home Construction", "Business Expansion", "Working Capital", "Fleet Expansion", "KCC", "Crop Loan", "Study Abroad", "Replace Old Vehicle", "Debt Consolidation"];
const ALL_PURPOSES = ["Home Purchase", "Home Construction", "Balance Transfer", "Top-up", "Business Expansion", "Working Capital", "Debt Consolidation", "Commercial Vehicle Purchase", "Crop Cultivation", "Farm Equipment", "Tuition Fees", "Living Expenses", "Travel", "Equipment"];
const ALL_PROPS = ["Residential", "Under Construction", "Resale", "Commercial", "Mixed Use", "Agricultural Land"];

function SchemeFeed() {
  const [tab, setTab] = useState("Scheme Feed");
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {FEED_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${tab === t ? "bg-brand-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-brand-300"}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-2"><ImportExport entity="schemes" /><AnyFileImport entity="schemes" /></div>
      </div>
      {tab === "Scheme Feed" && <FeedList />}
      {tab === "All Schemes" && <AllSchemesList />}
      {tab === "Add Scheme" && <Card><SchemeForm /></Card>}
      {tab === "Matcher Config V2" && <MatcherV2 />}
      {tab === "Compliance" && <SchemeCompliance />}
    </div>
  );
}

function FeedList() {
  const [rows, setRows] = useState<any[]>([]);
  const [added, setAdded] = useState<Set<number>>(new Set());
  useEffect(() => { api<any[]>("/gn/schemes").then((r) => setRows(r.slice(0, 10))).catch(() => {}); }, []);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100 flex items-center justify-between"><span className="text-[12.5px] font-semibold text-zinc-700">Scheme Feed — fresh schemes published by bankers ({rows.length} shown)</span><span className="text-[10.5px] text-zinc-400">Sync from lender API or add manually</span></div>
      <div className="divide-y divide-zinc-50">
        {rows.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50/60">
            <div>
              <div className="text-[12.5px] font-semibold text-zinc-800">{s.name}</div>
              <div className="text-[10.5px] text-zinc-400">{s.lender_name ?? "—"} · {s.product_name ?? s.product_category ?? "—"} · effective {fmtDate(s.effective_from)} · source: {s.source ?? "manual"}</div>
            </div>
            <div className="flex gap-2 items-center">
              <Badge status=""><span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s.profile ?? "All"}</span></Badge>
              <Badge status=""><span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{s.commission_pct || s.rate ? `${s.commission_pct || s.rate}% payout` : s.payout_type}</span></Badge>
              <button className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border border-zinc-200 text-zinc-600 hover:border-brand-300" onClick={() => { const n = new Set(added); n.add(s.id); setAdded(n); }}>{added.has(s.id) ? "✓ Added" : "Add to my list"}</button>
              <button className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border border-zinc-200 text-zinc-400 hover:border-rose-300 hover:text-rose-600">Reject</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <EmptyState title="No schemes in the feed" sub="Bankers' published schemes appear here" />}
      </div>
    </Card>
  );
}

function AllSchemesList() {
  const [rows, setRows] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const load = () => api<any[]>("/gn/schemes").then((r) => setRows(r)).catch(() => {});
  useEffect(() => { load(); }, []);
  const openDetail = async (id: number) => {
    const d = await api(`/gn/schemes/${id}`).catch(() => null);
    if (d) setDetail(d);
  };
  return (
    <>
      <Card pad={false}>
        <div className="p-3 border-b border-zinc-100"><span className="text-[12.5px] font-semibold text-zinc-700">All Schemes — {rows.length} active commission schemes with full policy blocks</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Scheme</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Profile</th><th className="px-3 py-2.5 font-semibold text-right">Amount range</th><th className="px-3 py-2.5 font-semibold text-right">ROI</th><th className="px-3 py-2.5 font-semibold text-right">Payout</th><th className="px-3 py-2.5 font-semibold">Effective</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
            <tbody>
              {rows.map((s) => {
                const lp = (() => { try { return JSON.parse(s.loan_params); } catch { return {}; } })();
                return (
                  <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50/60 cursor-pointer" onClick={() => openDetail(s.id)}>
                    <td className="px-3 py-2.5 font-semibold text-zinc-800">{s.name}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{s.lender_name}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{s.profile ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600">{lp.min_amount || s.rate ? `${fmtInr(lp.min_amount ?? 0)} – ${fmtInr(lp.max_amount ?? 0)}` : "—"}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-600">{lp.roi_min != null ? `${lp.roi_min}–${lp.roi_max}%` : "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{s.commission_pct || s.rate ? `${s.commission_pct || s.rate}%` : s.payout_type}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{fmtDate(s.effective_from)}</td>
                    <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}>{s.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {detail && <SchemeDetailModal s={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

function SchemeDetailModal({ s, onClose }: { s: any; onClose: () => void }) {
  const lp = s.loan_params ?? {}; const el = s.eligibility ?? {};
  const states = s.states ?? []; const programs = s.programs ?? []; const purposes = s.purposes ?? []; const policy = s.policy ?? {};
  const Row = ({ k, v }: { k: string; v: any }) => (
    <div className="flex justify-between py-1.5 border-b border-zinc-50 text-[11.5px]"><span className="text-zinc-400">{k}</span><span className="font-semibold text-zinc-700 text-right">{v ?? "—"}</span></div>
  );
  return (
    <Modal open title={s.name} onClose={onClose} wide>
      {(s.banker_name || s.branch || s.banker_email) && (
        <div className="mb-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 text-[11.5px] text-zinc-600">
          <b>Banker:</b> {s.banker_name ?? "—"}{s.banker_phone ? ` · ${s.banker_phone}` : ""}{s.banker_email ? ` · ${s.banker_email}` : ""}{s.branch ? ` · Branch: ${s.branch}` : ""}{s.sub_product ? ` · Sub-product: ${s.sub_product}` : ""}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Loan Parameters</div>
          <Row k="Amount" v={`${fmtInr(lp.min_amount)} – ${fmtInr(lp.max_amount)}`} />
          <Row k="Tenure" v={`${lp.min_tenure} – ${lp.max_tenure} months`} />
          <Row k="ROI" v={lp.roi_min != null ? `${lp.roi_min}% – ${lp.roi_max}%` : "—"} />
          <Row k="Property area" v={lp.property_area_min != null ? `${lp.property_area_min} – ${lp.property_area_max} sq ft` : "—"} />
          <Row k="Bank TAT" v={lp.bank_tat != null ? `${lp.bank_tat} days` : "—"} />
          <Row k="Rate notes" v={lp.rate_notes} />
          <Row k="Rate — Salaried" v={lp.rate_salaried != null ? `${lp.rate_salaried}%` : "—"} />
          <Row k="Rate — SENP" v={lp.rate_senp != null ? `${lp.rate_senp}%` : "—"} />
          <Row k="Processing fee" v={lp.processing_fee_pct != null ? `${lp.processing_fee_pct}% (max ${fmtInr(lp.processing_fee_max)})` : "—"} />
          <Row k="Processing fee (flat)" v={lp.processing_fee_flat != null ? fmtInr(lp.processing_fee_flat) : "—"} />
          <Row k="Processing fee notes" v={lp.processing_fee_notes} />
          <Row k="Insurance" v={lp.insurance_pct != null ? `${lp.insurance_pct}%` : "—"} />
          <Row k="Other fees" v={lp.other_fees} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Eligibility</div>
          <Row k="Age" v={el.min_age != null ? `${el.min_age} – ${el.max_age}` : "—"} />
          <Row k="Min income" v={fmtInr(el.min_income)} />
          <Row k="Min turnover" v={fmtInr(el.min_turnover)} />
          <Row k="Min vintage" v={el.min_vintage != null ? `${el.min_vintage} yrs` : "—"} />
          <Row k="Max FOIR" v={el.max_foir != null ? `${el.max_foir}%` : "—"} />
          <Row k="Max LTV" v={el.max_ltv != null ? `${el.max_ltv}%` : "—"} />
          <Row k="Min CIBIL" v={el.min_credit_score} />
          <Row k="Max enquiries (6mo)" v={el.max_enquiries_6m != null ? el.max_enquiries_6m : "—"} />
          <Row k="BT allowed" v={el.bt_allowed === undefined ? "—" : el.bt_allowed ? "Yes" : "No"} />
          <Row k="BT notes" v={el.bt_notes} />
          <Row k="City tiers" v={el.city_tiers?.length ? el.city_tiers.join(", ") : "—"} />
          <Row k="Geo radius" v={el.geo_radius_km != null ? `${el.geo_radius_km} km` : "—"} />
          <Row k="Applicant types" v={el.applicant_types?.length ? el.applicant_types.join(", ") : "—"} />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Policy & Compliance</div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 space-y-1.5">
          <div className="text-[11.5px] text-zinc-600"><b>Profile:</b> {s.profile ?? "All"} · <b>States:</b> {states.length === 1 && states[0] === "All India" ? "All India" : states.join(", ")}</div>
          <div className="text-[11.5px] text-zinc-600"><b>Programs:</b> {programs.join(", ") || "—"} · <b>Purposes:</b> {purposes.join(", ") || "—"}</div>
          {policy.variants?.length > 0 && <div className="text-[11.5px] text-zinc-600"><b>Variants:</b> {policy.variants.join(", ")}</div>}
          {policy.profile_categories?.length > 0 && <div className="text-[11.5px] text-zinc-600"><b>Profile categories:</b> {policy.profile_categories.join(", ")}</div>}
          {policy.checks?.length > 0 && <div className="text-[11.5px] text-zinc-600"><b>Checks:</b> {policy.checks.join(", ")}</div>}
          {policy.cibil_required !== undefined && <div className="text-[11.5px] text-zinc-600"><b>CIBIL required:</b> {policy.cibil_required ? "Yes" : "No"}</div>}
          {policy.negative_list?.length > 0 && <div className="text-[11.5px] text-rose-600"><b>Negative list:</b> {policy.negative_list.join("; ")}</div>}
          {policy.notes && <div className="text-[11.5px] text-zinc-600"><b>Notes:</b> {policy.notes}</div>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11.5px] text-zinc-400">Effective {fmtDate(s.effective_from)}{s.effective_to ? ` → ${fmtDate(s.effective_to)}` : " (ongoing)"} · {s.source ?? "manual"} · USP: {s.usp ?? "—"}</div>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-zinc-200 text-zinc-600">Close</button>
      </div>
    </Modal>
  );
}

function MatcherV2() {
  const [q, setQ] = useState<Record<string, any>>({ amount: 500000, tenure: 36, employment_type: "Salaried", monthly_income: 60000, credit_score: 720, age: 32, state: "Maharashtra", loan_type: "Home Loan", enquiries_6m: 2 });
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setQ((x) => ({ ...x, [k]: v }));
  const run = async () => {
    setBusy(true);
    try {
      const r = await api("/gn/match/v2", { method: "POST", body: { ...q, amount: Number(q.amount), tenure: q.tenure ? Number(q.tenure) : null, monthly_income: q.monthly_income ? Number(q.monthly_income) : null, credit_score: q.credit_score ? Number(q.credit_score) : null, age: q.age ? Number(q.age) : null, enquiries_6m: q.enquiries_6m ? Number(q.enquiries_6m) : null, business_turnover: q.business_turnover ? Number(q.business_turnover) : null, business_vintage: q.business_vintage ? Number(q.business_vintage) : null } });
      setRes(r);
    } catch (e: any) { setRes({ error: e.message }); }
    finally { setBusy(false); }
  };
  const inp = "w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-[12px] outline-none focus:border-brand-400";
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center"><Wand2 className="w-4 h-4 text-brand-600" /></div><div><div className="text-[13.5px] font-bold text-zinc-800">Matcher Configuration V2</div><div className="text-[11px] text-zinc-400">Score a customer profile against every active scheme's eligibility block</div></div></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="Loan type"><select value={q.loan_type ?? ""} onChange={(e) => set("loan_type", e.target.value)} className={inp}><option value="">Any</option>{["Home Loan", "Business Loan", "Personal Loan", "Loan Against Property", "Commercial Vehicle", "Two Wheeler", "MSME", "Equipment Financing", "Working Capital", "Education Loan", "Gold Loan", "Agriculture", "Balance Transfer"].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Amount (₹)"><input type="number" value={q.amount} onChange={(e) => set("amount", e.target.value)} className={inp} /></Field>
          <Field label="Tenure (months)"><input type="number" value={q.tenure ?? ""} onChange={(e) => set("tenure", e.target.value)} className={inp} /></Field>
          <Field label="Employment"><select value={q.employment_type ?? ""} onChange={(e) => set("employment_type", e.target.value)} className={inp}><option value="">—</option><option>Salaried</option><option>Self-Employed</option><option>Business</option><option>Farmer</option></select></Field>
          <Field label="Monthly income"><input type="number" value={q.monthly_income ?? ""} onChange={(e) => set("monthly_income", e.target.value)} className={inp} /></Field>
          <Field label="Business turnover"><input type="number" value={q.business_turnover ?? ""} onChange={(e) => set("business_turnover", e.target.value)} className={inp} /></Field>
          <Field label="Business vintage"><input type="number" value={q.business_vintage ?? ""} onChange={(e) => set("business_vintage", e.target.value)} className={inp} /></Field>
          <Field label="CIBIL score"><input type="number" value={q.credit_score ?? ""} onChange={(e) => set("credit_score", e.target.value)} className={inp} /></Field>
          <Field label="Enquiries (6mo)"><input type="number" value={q.enquiries_6m ?? ""} onChange={(e) => set("enquiries_6m", e.target.value)} className={inp} /></Field>
          <Field label="Age"><input type="number" value={q.age ?? ""} onChange={(e) => set("age", e.target.value)} className={inp} /></Field>
          <Field label="State"><select value={q.state ?? ""} onChange={(e) => set("state", e.target.value)} className={inp}><option value="">—</option>{ALL_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={run} disabled={busy} className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5" /> {busy ? "Matching…" : "Run Matcher"}</button>
        </div>
      </Card>
      {res && !res.error && (
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[12.5px] font-semibold text-zinc-700">Match results — {res.matches.length} schemes evaluated</span>
            <div className="flex gap-2">
              <Badge status=""><span className="text-[10.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{res.summary.eligible} Eligible</span></Badge>
              <Badge status=""><span className="text-[10.5px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{res.summary.maybe} Maybe</span></Badge>
              <Badge status=""><span className="text-[10.5px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">{res.summary.notEligible} Not eligible</span></Badge>
            </div>
          </div>
          <div className="divide-y divide-zinc-50">
            {res.matches.slice(0, 12).map((m: any) => (
              <div key={m.id} className={`px-4 py-3 ${m.status === "not_eligible" ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.status === "eligible" ? "bg-emerald-500" : m.status === "maybe" ? "bg-amber-400" : "bg-zinc-300"}`} />
                    <div>
                      <div className="text-[12.5px] font-semibold text-zinc-800">{m.scheme} <span className="text-zinc-400 font-normal">· {m.lender}</span></div>
                      <div className="text-[10.5px] text-zinc-400">{m.product} · {m.profile ?? "All"} · {m.states.length === 1 && m.states[0] === "All India" ? "All India" : m.states.join(", ")} · ROI {m.roi ?? "—"} · Fee {m.processing_fee ?? "—"} · LTV {m.max_ltv ? m.max_ltv + "%" : "—"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[11.5px] font-bold uppercase ${m.status === "eligible" ? "text-emerald-600" : m.status === "maybe" ? "text-amber-600" : "text-zinc-400"}`}>{m.status.replace("_", " ")}</div>
                    <div className="text-[10.5px] text-zinc-400">Payout {m.commission_pct}% · est. net {fmtInr(m.commission?.net)}</div>
                  </div>
                </div>
                {m.reasons.length > 0 && <div className="mt-1.5 text-[10.5px] text-rose-500">{m.reasons.join(" · ")}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
      {res?.error && <Card><div className="text-[12.5px] font-semibold text-rose-600">{res.error}</div></Card>}
    </div>
  );
}

function SchemeCompliance() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api<any[]>("/gn/schemes").then((r) => setRows(r)).catch(() => {}); }, []);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Card pad={false}>
      <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-zinc-700">Scheme Compliance Register — effective dates, policy blocks & RBI-aligned notes</span>
        <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-400"><Scale className="w-3.5 h-3.5" /> Versioned & auditable</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Scheme</th><th className="px-3 py-2.5 font-semibold">Bank</th><th className="px-3 py-2.5 font-semibold">Effective</th><th className="px-3 py-2.5 font-semibold">Expiry</th><th className="px-3 py-2.5 font-semibold">Compliance status</th><th className="px-3 py-2.5 font-semibold">Key policy notes</th></tr></thead>
          <tbody>
            {rows.map((s) => {
              const pol = (() => { try { return JSON.parse(s.policy); } catch { return {}; } })();
              const active = s.status === "active" && (!s.effective_from || s.effective_from <= today) && (!s.effective_to || s.effective_to >= today);
              return (
                <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">{s.name}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{s.lender_name}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{fmtDate(s.effective_from)}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{s.effective_to ? fmtDate(s.effective_to) : "Ongoing"}</td>
                  <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-emerald-50 text-emerald-600" : s.status === "active" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>{active ? "ACTIVE" : s.status === "active" ? "NOT YET LIVE" : s.status.toUpperCase()}</span></td>
                  <td className="px-3 py-2.5 text-[11px] text-zinc-500 max-w-[380px]">{pol.notes ?? (pol.cibil_required ? "CIBIL report required" : "—")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
