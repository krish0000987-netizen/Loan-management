import { useState } from "react";
import { Card, CardTitle, PageHeader, Field } from "../../components/ui";

function emi(P: number, annual: number, months: number): number {
  if (P <= 0 || months <= 0) return 0;
  const r = annual / 1200;
  if (r === 0) return P / months;
  return Math.round((P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

export function GnTools() {
  const [amount, setAmount] = useState(2500000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(240);
  const [income, setIncome] = useState(120000);
  const [obligations, setObligations] = useState(25000);
  const [foorCap, setFoorCap] = useState(50);

  const e = emi(amount, rate, tenure);
  const total = e * tenure;
  const interest = total - amount;
  const eligible = Math.max(0, Math.round(((income * (foorCap / 100)) - obligations) * (Math.pow(1 + rate / 1200, tenure) - 1) / (rate / 1200 * Math.pow(1 + rate / 1200, tenure))));

  return (
    <div className="space-y-5">
      <PageHeader title="Financial Tools" sub="EMI, eligibility and ROI calculators — share calculations with customers via WhatsApp" breadcrumb="Growth Nations / Utility / Tools" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle title="EMI Calculator" sub="Reducing balance" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Loan Amount (₹)"><input className="input text-[12.5px]" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
            <Field label="Interest Rate (% p.a.)"><input className="input text-[12.5px]" type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Field>
            <Field label="Tenure (months)" className="col-span-2"><input className="input text-[12.5px]" type="number" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} /></Field>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-brand-50 border border-brand-100 py-2.5"><div className="text-[9.5px] uppercase text-brand-700/60">EMI</div><div className="text-[15px] font-bold text-brand-700">₹{e.toLocaleString("en-IN")}</div></div>
            <div className="rounded-lg border border-zinc-100 py-2.5"><div className="text-[9.5px] uppercase text-zinc-400">Total</div><div className="text-[14px] font-bold text-zinc-800">₹{total.toLocaleString("en-IN")}</div></div>
            <div className="rounded-lg border border-zinc-100 py-2.5"><div className="text-[9.5px] uppercase text-zinc-400">Interest</div><div className="text-[14px] font-bold text-amber-600">₹{interest.toLocaleString("en-IN")}</div></div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1"><span>Principal</span><span>Interest</span></div>
            <div className="h-2.5 rounded-full bg-amber-100 overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${(amount / total) * 100}%` }} /></div>
          </div>
        </Card>
        <Card>
          <CardTitle title="Eligibility Checker" sub="FOIR-based loan eligibility" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Monthly income (₹)"><input className="input text-[12.5px]" type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} /></Field>
            <Field label="Existing obligations (₹)"><input className="input text-[12.5px]" type="number" value={obligations} onChange={(e) => setObligations(Number(e.target.value))} /></Field>
            <Field label="FOIR cap (%)"><input className="input text-[12.5px]" type="number" value={foorCap} onChange={(e) => setFoorCap(Number(e.target.value))} /></Field>
            <Field label="Tenure (months)"><input className="input text-[12.5px]" type="number" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} /></Field>
          </div>
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
            <div className="text-[10px] uppercase text-emerald-700/60">Eligible loan amount</div>
            <div className="text-[20px] font-bold text-emerald-700">₹{eligible.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-emerald-700/70 mt-0.5">At {(income * (foorCap / 100) - obligations).toLocaleString("en-IN")} disposable monthly income</div>
          </div>
        </Card>
      </div>
      <div className="text-[10.5px] text-zinc-400">Pure client-side calculators — indicative only. Final eligibility rests with the lender's underwriting.</div>
    </div>
  );
}
