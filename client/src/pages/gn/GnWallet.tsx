import { Card, CardTitle, PageHeader } from "../../components/ui";
import { Link } from "react-router-dom";
import { ImportExport } from "./shared";

const API_USAGE = [
  { api: "Credit Report V1", hits: 4, cost: 210, ok: 3, failed: 1 },
  { api: "PAN Verification", hits: 2, cost: 33, ok: 2, failed: 0 },
  { api: "GSTIN Verification", hits: 1, cost: 18, ok: 1, failed: 0 }
];

export function GnWallet() {
  const totalHits = API_USAGE.reduce((s, a) => s + a.hits, 0);
  const spent = API_USAGE.reduce((s, a) => s + a.cost, 0);
  const balance = 30000 - spent;

  return (
    <div className="space-y-5">
      <PageHeader title="Wallet" sub="Monitor balance and feature-wise deductions — verification APIs are billed per hit" breadcrumb="Growth Nations / Wallet"
        actions={<div className="flex items-center gap-2"><ImportExport entity="commissions" /><Link to="/gn/apis" className="btn btn-primary text-[12px]">Explore APIs</Link></div>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white px-6 py-5 lg:col-span-1">
          <div className="text-[11px] uppercase tracking-wider opacity-70">Available Wallet Balance</div>
          <div className="text-[30px] font-bold mt-1">₹{balance.toLocaleString("en-IN")}</div>
          <div className="text-[11px] opacity-70 mt-0.5">across 3 credit types</div>
          <Link to="/gn/apis" className="inline-block bg-white text-zinc-900 text-[11.5px] font-bold px-3.5 py-1.5 rounded-lg mt-4 hover:bg-zinc-100">Recharge Now</Link>
        </div>
        <Card>
          <CardTitle title="Verification Wallet" sub="Funds IFSC, Penny Drop, BSA, AA, ITR & other verification APIs" />
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-lg border border-zinc-100 px-3 py-2"><div className="text-[9.5px] uppercase text-zinc-400">Balance left</div><b className="text-[15px]">₹{balance.toLocaleString("en-IN")}</b></div>
            <div className="rounded-lg border border-zinc-100 px-3 py-2"><div className="text-[9.5px] uppercase text-zinc-400">Total hits</div><b className="text-[15px]">{totalHits}</b></div>
            <div className="rounded-lg border border-zinc-100 px-3 py-2"><div className="text-[9.5px] uppercase text-zinc-400">Spent (MTD)</div><b className="text-[15px]">₹{spent.toLocaleString("en-IN")}</b></div>
            <div className="rounded-lg border border-zinc-100 px-3 py-2"><div className="text-[9.5px] uppercase text-zinc-400">Successful</div><b className="text-[15px] text-emerald-600">6/7</b></div>
          </div>
        </Card>
        <Card>
          <CardTitle title="Usage by API" sub="Billed from wallet per hit" />
          <div className="mt-3 space-y-2.5">
            {API_USAGE.map((a) => (
              <div key={a.api} className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-zinc-700">{a.api}</span>
                <span className="text-zinc-400">{a.hits} hits · <b className="text-zinc-700">₹{a.cost}</b></span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-[12px]">
            <span className="text-zinc-500">Failed / refunded</span>
            <span className="font-semibold text-rose-600">1/7 · auto-refunded ₹5</span>
          </div>
        </Card>
      </div>
      <div className="text-[10.5px] text-zinc-400">Demo wallet — configured values only. Real billing requires a verification API provider credential (Sandbox mode by default).</div>
      <Card pad={false}>
        <div className="p-3 border-b border-zinc-100"><span className="text-[12px] font-semibold text-zinc-700">Usage History</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100"><th className="px-3 py-2.5 font-semibold">Date</th><th className="px-3 py-2.5 font-semibold">API</th><th className="px-3 py-2.5 font-semibold">Input</th><th className="px-3 py-2.5 font-semibold text-right">Cost</th><th className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
            <tbody>
              {[
                ["12 Aug", "Credit Report V1", "PAN: ABCDE1234F", 65, "ok"], ["11 Aug", "PAN Verification", "PAN: ABCDE1234F", 16.5, "ok"], ["11 Aug", "GSTIN Verification", "GSTIN: 22AAAAA0000A1Z5", 18, "ok"], ["10 Aug", "Credit Report V1", "PAN: ZXY9876543Q", 65, "failed"], ["10 Aug", "Credit Report V1", "PAN: LMNO123456R", 40, "ok"]
              ].map((r, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="px-3 py-2.5 text-zinc-500">{r[0]}</td><td className="px-3 py-2.5 font-medium text-zinc-700">{r[1]}</td><td className="px-3 py-2.5 text-zinc-400">{r[2]}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-zinc-800">₹{r[3]}</td>
                  <td className="px-3 py-2.5"><span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${r[4] === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{r[4] === "ok" ? "SUCCESSFUL" : "FAILED / REFUNDED"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
