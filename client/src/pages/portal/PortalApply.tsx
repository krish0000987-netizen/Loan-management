import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtInr } from "../../lib/api";
import { PageHeader, Card, Field, Badge } from "../../components/ui";

export default function PortalApply() {
  const nav = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("36");
  const [purpose, setPurpose] = useState("");
  const [income, setIncome] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<any>(null);

  useEffect(() => { api("/portal/products").then((r) => { setProducts(r.rows); setProductId(r.rows[0]?.id ?? null); }); }, []);

  const product = products.find((p) => p.id === productId);
  const amt = Number(amount) || 0;
  const eligible = product && amt >= product.min_amount && amt <= product.max_amount;

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const r = await api("/portal/apply", {
        method: "POST",
        body: { product_id: productId, requested_amount: amt, tenure: Number(tenure), purpose, monthly_income: income ? Number(income) : undefined }
      });
      setCreated(r);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  if (created) {
    return (
      <div>
        <PageHeader title="Application submitted" sub="Our team will review and contact you" />
        <Card className="max-w-lg">
          <div className="rounded-md bg-emerald-50 border border-emerald-100 p-4 mb-4">
            <div className="text-[13.5px] font-semibold text-emerald-800">Application {created.application_no} received</div>
            <div className="text-[12px] text-emerald-700 mt-1">Track progress from My Applications. You may be asked to upload documents.</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => nav(`/portal/applications/${created.id}`)}>Track application</button>
            <button className="btn btn-secondary" onClick={() => nav("/portal/loans")}>Back to dashboard</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Apply for a loan" sub="Choose a product, tell us what you need, and we'll take it from there" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Loan details</h3>
          <div className="space-y-3">
            <Field label="Loan product">
              <select className="input w-full" value={productId ?? ""} onChange={(e) => setProductId(Number(e.target.value))}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.interest_rate}% p.a.</option>)}
              </select>
            </Field>
            <Field label={`Requested amount (${product ? fmtInr(product.min_amount) : ""} – ${product ? fmtInr(product.max_amount) : ""})`}>
              <input className="input w-full num" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 500000" />
            </Field>
            <Field label="Tenure (months)">
              <select className="input w-full" value={tenure} onChange={(e) => setTenure(e.target.value)}>
                {Array.from({ length: 11 }, (_, i) => (i + 1) * 6).map((t) => <option key={t} value={t}>{t} months</option>)}
              </select>
            </Field>
            <Field label="Purpose">
              <input className="input w-full" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Home renovation" />
            </Field>
            <Field label="Monthly income (₹, optional)">
              <input className="input w-full num" value={income} onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 85000" />
            </Field>
            {!eligible && amt > 0 && (
              <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-[11.5px] text-amber-800">
                Amount outside this product's band — pick a different amount or product.
              </div>
            )}
            {error && <div className="rounded-md bg-rose-50 border border-rose-100 px-3 py-2 text-[11.5px] text-rose-800">{error}</div>}
            <button className="btn btn-primary w-full" disabled={!eligible || !amt || busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </Card>
        <Card>
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">What happens next</h3>
          <ol className="space-y-3 text-[12.5px] text-zinc-600">
            <li className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 text-[10.5px] font-bold flex items-center justify-center shrink-0">1</span>We verify your KYC and documents (PAN, address proof, bank statement).</li>
            <li className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 text-[10.5px] font-bold flex items-center justify-center shrink-0">2</span>A credit officer reviews your bureau report, income and banking behaviour.</li>
            <li className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 text-[10.5px] font-bold flex items-center justify-center shrink-0">3</span>You receive an offer with full terms in a Key Fact Statement (KFS) — APR, fees and schedule disclosed before you accept.</li>
            <li className="flex gap-2.5"><span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 text-[10.5px] font-bold flex items-center justify-center shrink-0">4</span>After agreement and e-sign, the amount is disbursed to your bank account.</li>
          </ol>
          <div className="mt-4 rounded-md bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-[11px] text-zinc-500">
            This is a demo environment. No live credit check is performed and no real disbursement occurs.
          </div>
        </Card>
      </div>
    </div>
  );
}
