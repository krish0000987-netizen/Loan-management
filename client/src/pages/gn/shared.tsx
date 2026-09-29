import { useEffect, useRef, useState } from "react";
import { GN_PROCESS_FLOW, GN_WORKFLOW, gnProcessStage } from "../../lib/gn";
import { api, fmtInr, getToken } from "../../lib/api";

/** The 6-step process flow bar from the reference product (Lead → Application → Sanction → Disbursement → Commission → Payout). */
export function ProcessFlow({ status }: { status: string | null | undefined }) {
  const stage = gnProcessStage(status);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">Your loan process flow</div>
      <div className="flex items-center">
        {GN_PROCESS_FLOW.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i <= stage ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                {i + 1}
              </div>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${i <= stage ? "text-zinc-800" : "text-zinc-400"}`}>{s}</span>
            </div>
            {i < GN_PROCESS_FLOW.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${i < stage ? "bg-brand-500" : "bg-zinc-100"}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The canonical 13-step loan distribution workflow (as demanded by the product owner). */
export function WorkflowStepper({ status, amount }: { status: string | null | undefined; amount?: number | null }) {
  const idx = GN_WORKFLOW.findIndex((w) => w.status === status);
  const reached = (i: number) => idx >= i;
  return (
    <div>
      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Loan distribution workflow</div>
      <div className="space-y-0">
        {GN_WORKFLOW.map((w, i) => {
          const done = reached(i);
          const current = i === idx;
          return (
            <div key={w.step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : current ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-zinc-100 text-zinc-400"}`}>
                  {w.step}
                </div>
                {i < GN_WORKFLOW.length - 1 && <div className={`w-0.5 flex-1 my-0.5 ${done ? "bg-emerald-400" : "bg-zinc-100"}`} />}
              </div>
              <div className={`pb-4 ${current ? "" : done ? "opacity-80" : "opacity-40"}`}>
                <div className={`text-[12px] font-semibold ${done ? "text-emerald-700" : current ? "text-brand-700" : "text-zinc-500"}`}>
                  {w.label}
                  {w.step === 10 && amount ? <span className="ml-1.5 text-brand-600">· {fmtInr(amount)} → borrower's account</span> : null}
                </div>
                <div className="text-[10.5px] text-zinc-400">{w.hint}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Import (CSV → DB) + Export (DB → CSV) control for any GN entity, with a manual-entry slot. */
export function ImportExport({ entity, onImported, children }: { entity: string; onImported?: () => void; children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/gn/export/${entity}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) { setMsg({ ok: false, text: "Export failed" }); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gn_${entity}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg({ ok: true, text: "CSV downloaded" });
    } catch { setMsg({ ok: false, text: "Export failed" }); }
    finally { setBusy(false); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setMsg(null);
    try {
      const text = await f.text();
      const r = await api<{ inserted: number; errors: { row: number; error: string }[] }>(`/gn/import/${entity}`, { method: "POST", body: { csv: text } });
      setMsg({ ok: true, text: `Imported ${r.inserted} rows${r.errors?.length ? ` · ${r.errors.length} errors (see server log)` : ""}` });
      onImported?.();
    } catch (err: any) { setMsg({ ok: false, text: err.message ?? "Import failed" }); }
    finally { setBusy(false); e.target.value = ""; }
  };

  return (
    <div className="flex items-center gap-2">
      {children}
      <button onClick={doExport} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 bg-white text-zinc-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50">
        Export CSV
      </button>
      <button onClick={() => fileRef.current?.click()} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 bg-white text-zinc-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50">
        Import CSV
      </button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
      {msg && <span className={`text-[10.5px] font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</span>}
    </div>
  );
}

export function StatPill({ label, value, tone = "zinc" }: { label: string; value: string; tone?: "brand" | "green" | "amber" | "red" | "zinc" }) {
  const t: Record<string, string> = {
    brand: "border-brand-100 bg-brand-50/50 text-brand-700",
    green: "border-emerald-100 bg-emerald-50/50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/50 text-amber-700",
    red: "border-rose-100 bg-rose-50/50 text-rose-700",
    zinc: "border-zinc-100 bg-white text-zinc-800"
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${t[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-[19px] font-bold leading-tight mt-0.5">{value}</div>
    </div>
  );
}

/** Import a scheme source file in ANY format — CSV / TSV / JSON / Excel are parsed into scheme rows; PDF / images / DOCX are stored as scheme documents for review. */
export function AnyFileImport({ entity, onImported }: { entity: string; onImported?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(String(rd.result).split(",")[1] ?? "");
    rd.onerror = () => reject(new Error("read failed"));
    rd.readAsDataURL(f);
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setMsg(null);
    try {
      const data = await toBase64(f);
      const r = await api<{ format: string; inserted: number; pending: boolean; errors?: { row: number; error: string }[]; notes?: string | null }>(
        `/gn/import/schemes/file`,
        { method: "POST", body: { filename: f.name, mime: f.type, data } }
      );
      const text = r.pending
        ? `Document stored (${f.name}) — pending review`
        : `Imported ${r.inserted} scheme(s) from ${String(r.format).toUpperCase()}${r.errors?.length ? ` · ${r.errors.length} row errors` : ""}`;
      setMsg({ ok: true, text });
      onImported?.();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message ?? "Import failed" });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => fileRef.current?.click()} disabled={busy} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 bg-white text-zinc-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50">
        {busy ? "Importing…" : "Import file (any format)"}
      </button>
      <input ref={fileRef} type="file" accept=".csv,.tsv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" className="hidden" onChange={onFile} />
      {msg && <span className={`text-[10.5px] font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</span>}
    </div>
  );
}

const PROFILE_OPTIONS = ["Salaried", "Self-Employed / Business", "Salaried / Self-Employed", "Farmer / Agri", "All"];
const EMPLOYMENT_MODELS = ["Salaried", "Self Employed", "Business", "Professional", "Trust", "Pvt Ltd", "Public Ltd", "Partnership", "LLP"];
const PROFILE_CATEGORIES = ["Bank Salary", "Cash Salary", "Pvt Limited", "LLP", "Trust", "NRI", "Single Lady"];
const APPLICANT_TYPES = ["Salaried", "Self-Employed Professional", "Self-Employed Non-Professional", "Trust / Society / NGO", "Pvt Ltd / LLP / Public Ltd", "NRI"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Industrial Property", "Plot", "Warehouse", "Showroom", "School / College", "Hospital", "Hotel / Resort", "Guest House", "PG (Paying Guest)", "Mix Property", "Gamthal", "Akarni", "City Area Property", "Agricultural (Other)"];
const PROGRAM_OPTIONS = ["BT", "LRD", "Top-up", "Surrogate", "Refinance", "Home Purchase", "Home Construction", "Business Expansion", "Working Capital", "Fleet Expansion", "KCC", "Crop Loan", "Study Abroad"];
const CHECK_OPTIONS = ["Single Sale Deed", "CIBIL Call", "Legal Call"];
const VARIANT_OPTIONS = ["Term Loan", "DOD"];
const STATE_OPTIONS = ["All India", "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Gujarat", "Haryana", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"];

/** The banker "Add your scheme here" form — mirrors the reference product layout: identity → loan parameters → eligibility → LTVs → programs → commission → circular → policy → Let's Launch. */
export function SchemeForm({ onSaved, compact }: { onSaved?: () => void; compact?: boolean }) {
  const [lenders, setLenders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState<Record<string, any>>({
    lender_id: 0, product_id: 0, name: "", profile: "Salaried", states: ["All India"],
    banker_name: "", banker_email: "", banker_phone: "", branch: "", sub_product: "",
    min_amount: "", max_amount: "", min_tenure: "", max_tenure: "", roi_min: "", roi_max: "", fee_min: "", fee_max: "", fee_pct: "",
    property_area_min: "", property_area_max: "", bank_tat: "",
    rate_notes: "", rate_salaried: "", rate_senp: "", processing_fee_flat: "", processing_fee_notes: "",
    employment_models: ["Salaried"], profile_categories: ["Bank Salary"], applicant_types: ["Salaried"], property_types: [],
    foir: "", min_vintage: "", min_income: "", min_turnover: "", min_cibil: "", geo_radius: "", city_specific: false,
    max_enquiries: "", min_age: "", max_age: "", bt_allowed: true, bt_notes: "", city_tiers: "",
    ltv_residential: "", ltv_commercial: "", ltv_industrial: "",
    programs: [], purposes: "", usp: "",
    payout_type: "percent", payout: "", effective_from: today, effective_to: "",
    circular_url: "", checks: ["CIBIL Call"], variants: ["Term Loan"],
    negative_list: "", cibil_required: true, notes: "",
    circular_file: undefined as { filename: string; mime: string; data: string } | undefined
  });
  useEffect(() => { api("/gn/lenders").then(setLenders).catch(() => {}); }, []);
  useEffect(() => { api<any>("/gn/products").then((r) => setProducts(Array.isArray(r) ? r : (r?.rows ?? []))).catch(() => {}); }, []);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  const toggleIn = (k: string, v: string) => {
    const cur: string[] = f[k] ?? [];
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  const num = (v: any) => (v === "" || v === null || v === undefined ? undefined : Number(v));
  const list = (v: any) => (typeof v === "string" && v.trim() ? v.split(",").map((x: string) => x.trim()).filter(Boolean) : Array.isArray(v) ? v : []);
  const clean = (o: Record<string, any>) => { const out: Record<string, any> = {}; for (const k of Object.keys(o)) if (o[k] !== null && o[k] !== undefined && o[k] !== "") out[k] = o[k]; return out; };
  const inp = "w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-[12px] outline-none focus:border-brand-400 bg-white";
  const sec = "rounded-xl border border-zinc-100 bg-white p-4";
  const secTitle = "text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5";

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      const data = String(rd.result).split(",")[1] ?? "";
      set("circular_file", { filename: file.name, mime: file.type, data });
      setFileInfo(`${file.name} (${(file.size / 1024).toFixed(1)} KB) — uploaded successfully`);
    };
    rd.readAsDataURL(file);
    e.target.value = "";
  };

  const submit = async () => {
    if (!f.name || !f.lender_id) { setMsg({ ok: false, text: "Scheme name and bank are required" }); return; }
    if (!f.banker_name || !f.banker_email || !f.banker_phone) { setMsg({ ok: false, text: "Your name, bank email and phone are required" }); return; }
    setBusy(true); setMsg(null);
    try {
      await api("/gn/schemes", {
        method: "POST",
        body: {
          lender_id: Number(f.lender_id), product_id: f.product_id ? Number(f.product_id) : null, name: f.name, profile: f.profile,
          banker_name: f.banker_name || null, banker_email: f.banker_email || null,
          banker_phone: f.banker_phone || null, branch: f.branch || null, sub_product: f.sub_product || null,
          states: list(f.states.length ? f.states.join(",") : "All India"),
          loan_params: clean({
            min_amount: num(f.min_amount), max_amount: num(f.max_amount),
            min_tenure: num(f.min_tenure), max_tenure: num(f.max_tenure),
            roi_min: num(f.roi_min), roi_max: num(f.roi_max),
            processing_fee_min: num(f.fee_min), processing_fee_max: num(f.fee_max), processing_fee_pct: num(f.fee_pct),
            property_area_min: num(f.property_area_min), property_area_max: num(f.property_area_max),
            bank_tat: num(f.bank_tat), rate_notes: f.rate_notes || null,
            rate_salaried: num(f.rate_salaried), rate_senp: num(f.rate_senp),
            processing_fee_flat: num(f.processing_fee_flat), processing_fee_notes: f.processing_fee_notes || null
          }),
          eligibility: clean({
            max_foir: num(f.foir), min_vintage: num(f.min_vintage),
            min_income: num(f.min_income), min_turnover: num(f.min_turnover),
            min_credit_score: num(f.min_cibil), geo_radius_km: num(f.geo_radius),
            employment_models: f.employment_models, property_types: f.property_types,
            applicant_types: f.applicant_types, max_enquiries_6m: num(f.max_enquiries),
            min_age: num(f.min_age), max_age: num(f.max_age),
            bt_allowed: !!f.bt_allowed, bt_notes: f.bt_notes || null,
            city_tiers: list(f.city_tiers),
            ltv_residential: num(f.ltv_residential), ltv_commercial: num(f.ltv_commercial), ltv_industrial: num(f.ltv_industrial),
            max_ltv: num(f.ltv_residential)
          }),
          programs: f.programs, purposes: list(f.purposes), usp: f.usp || null,
          payout_type: f.payout_type, rate: f.payout_type === "percent" ? (num(f.payout) ?? 0) : 0,
          flat_amount: f.payout_type === "flat" ? (num(f.payout) ?? 0) : 0,
          commission_pct: f.payout_type === "percent" ? (num(f.payout) ?? 0) : 0,
          effective_from: f.effective_from || null, effective_to: f.effective_to || null,
          policy: clean({
            negative_list: list(f.negative_list), cibil_required: f.cibil_required,
            notes: f.notes || null, circular_url: f.circular_url || null,
            checks: f.checks, city_specific: f.city_specific, variants: f.variants,
            profile_categories: f.profile_categories
          }),
          circular_file: f.circular_file,
          source: "banker"
        }
      });
      setMsg({ ok: true, text: "✓ Scheme published — live in the feed, matcher and compliance register" });
      setF((x) => ({ ...x, name: "", circular_file: undefined }));
      setFileInfo(null);
      onSaved?.();
    } catch (e: any) {
      setMsg({ ok: false, text: "Save failed: " + e.message });
    } finally {
      setBusy(false);
    }
  };

  const Chip = ({ label, keyName, val }: { label: string; keyName: string; val: string }) => (
    <button type="button" onClick={() => toggleIn(keyName, val)}
      className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${(f[keyName] ?? []).includes(val) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-zinc-500 border-zinc-200 hover:border-brand-300"}`}>
      {label}
    </button>
  );
  const FL = ({ label, k, ph, type = "text", step }: { label: string; k: string; ph?: string; type?: string; step?: string }) => (
    <div>
      <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">{label}</div>
      <input type={type} step={step} className={inp} placeholder={ph} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[14px] font-bold text-zinc-900">Add your scheme here</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">Distribute your scheme to 100+ DSAs directly into their CRM — your scheme starts showing up every time there is a lead matching your criteria.</div>
      </div>

      {/* Your details — banker identity */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Your details</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FL label="Your name *" k="banker_name" ph="e.g. Rajesh Kumar" />
          <FL label="Bank email *" k="banker_email" ph="you@bankdomain.com" />
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Phone *</div>
            <input className={inp} value={f.banker_phone} onChange={(e) => set("banker_phone", e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <FL label="Branch" k="branch" ph="e.g. Mumbai Andheri West" />
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Bank *</div>
            <select className={inp} value={f.lender_id} onChange={(e) => set("lender_id", Number(e.target.value))}>
              <option value={0}>Select bank…</option>
              {lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <FL label="Scheme name *" k="name" ph="e.g. Salaried HL — Q4 2026" />
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Product</div>
            <select className={inp} value={f.product_id} onChange={(e) => set("product_id", Number(e.target.value))}>
              <option value={0}>Select product…</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
            </select>
          </div>
          <FL label="Sub-product" k="sub_product" ph="e.g. All sub-products" />
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Profile</div>
            <select className={inp} value={f.profile} onChange={(e) => set("profile", e.target.value)}>
              {PROFILE_OPTIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">States the scheme is valid in</div>
            <select className={inp} value={f.states.length === 1 ? f.states[0] : "All India"} onChange={(e) => set("states", [e.target.value])}>
              <option value="All India">All India (blank = pan-India)</option>
              {STATE_OPTIONS.filter((s) => s !== "All India").map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Loan parameters */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Loan parameters — amount & tenure</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FL label="Loan amount min (₹)" k="min_amount" type="number" />
          <FL label="Loan amount max (₹)" k="max_amount" type="number" />
          <FL label="Tenure min (months)" k="min_tenure" type="number" />
          <FL label="Tenure max (months)" k="max_tenure" type="number" />
          <FL label="ROI min (%)" k="roi_min" type="number" step="0.01" />
          <FL label="ROI max (%)" k="roi_max" type="number" step="0.01" />
          <FL label="Property area min (sq ft)" k="property_area_min" type="number" />
          <FL label="Property area max (sq ft)" k="property_area_max" type="number" />
          <FL label="Bank TAT (days)" k="bank_tat" type="number" />
          <FL label="Processing fee min (₹)" k="fee_min" type="number" />
          <FL label="Processing fee max (₹)" k="fee_max" type="number" />
          <FL label="Processing fee (%)" k="fee_pct" type="number" step="0.01" />
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {CHECK_OPTIONS.map((c) => (
            <label key={c} className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={(f.checks ?? []).includes(c)} onChange={() => toggleIn("checks", c)} /> {c}
            </label>
          ))}
        </div>
      </div>

      {/* Customer eligibility */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Customer eligibility</div>
        <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">Profile — who the scheme accepts</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PROFILE_CATEGORIES.map((m) => <Chip key={m} label={m} keyName="profile_categories" val={m} />)}
        </div>
        <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">Applicant types accepted</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {APPLICANT_TYPES.map((m) => <Chip key={m} label={m} keyName="applicant_types" val={m} />)}
        </div>
        <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">Approximate employment models</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {EMPLOYMENT_MODELS.map((m) => <Chip key={m} label={m} keyName="employment_models" val={m} />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FL label="Max FOIR / DBR (%)" k="foir" type="number" />
          <FL label="Min CIBIL score" k="min_cibil" type="number" />
          <FL label="Max enquiries (last 6 months)" k="max_enquiries" type="number" />
          <FL label="Min age" k="min_age" type="number" />
          <FL label="Max age" k="max_age" type="number" />
          <FL label="Min business vintage (years)" k="min_vintage" type="number" />
          <FL label="Min monthly income (₹) — Salaried" k="min_income" type="number" />
          <FL label="Min annual turnover (₹) — Self-emp" k="min_turnover" type="number" />
          <FL label="Geo radius from branch (km)" k="geo_radius" type="number" />
          <FL label="City tiers (comma-separated 1, 2, 3)" k="city_tiers" ph="e.g. 1, 2" />
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={!!f.bt_allowed} onChange={(e) => set("bt_allowed", e.target.checked)} /> BT (Balance Transfer) allowed
            </label>
            <input className={inp + " mt-2"} value={f.bt_notes} onChange={(e) => set("bt_notes", e.target.value)} placeholder="BT notes — e.g. min 12 EMIs paid in current loan" />
          </div>
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Geo limit — branch & radius</div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={!!f.city_specific} onChange={(e) => set("city_specific", e.target.checked)} /> City / Taluka-specific branches only
            </label>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-zinc-500 mb-1.5 mt-3">Eligible property types</div>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((p) => <Chip key={p} label={p} keyName="property_types" val={p} />)}
        </div>
      </div>

      {/* LTV by property */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />LTV by property</div>
        <div className="grid grid-cols-3 gap-3">
          <FL label="LTV — Residential (%)" k="ltv_residential" type="number" />
          <FL label="LTV — Commercial (%)" k="ltv_commercial" type="number" />
          <FL label="LTV — Industrial (%)" k="ltv_industrial" type="number" />
        </div>
      </div>

      {/* Programs & purpose */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Programs & purpose</div>
        <div className="text-[11px] font-semibold text-zinc-500 mb-1.5">Programs (BT / LRD / Top-up / Surrogate)</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PROGRAM_OPTIONS.map((p) => <Chip key={p} label={p} keyName="programs" val={p} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FL label="Purpose tags (comma-separated)" k="purposes" ph="e.g. built campus, bus purchase, top-up, refinance" />
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">USP — RM contact · pitch</div>
            <input className={inp} value={f.usp} onChange={(e) => set("usp", e.target.value)} placeholder="e.g. Fastest disbursal in the market — RM: Rajesh (98765 43210)" />
          </div>
        </div>
      </div>

      {/* Commission terms */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Commission terms</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Calculation</div>
            <select className={inp} value={f.payout_type} onChange={(e) => set("payout_type", e.target.value)}>
              <option value="percent">Percent of disbursement</option>
              <option value="flat">Flat per case</option>
            </select>
          </div>
          <FL label={f.payout_type === "percent" ? "Payout (%)" : "Flat amount (₹)"} k="payout" type="number" />
          <FL label="Effective from" k="effective_from" type="date" />
          <FL label="Effective to" k="effective_to" type="date" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Circular link</div>
            <input className={inp} value={f.circular_url} onChange={(e) => set("circular_url", e.target.value)} placeholder="https://… (paste a URL)" />
          </div>
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Circular document (PDF / image / Excel)</div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>Upload circular</button>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx" className="hidden" onChange={pickFile} />
              {fileInfo && <span className="text-[10.5px] font-semibold text-emerald-600">{fileInfo}</span>}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Anything else you should know?</div>
          <textarea className={inp + " min-h-16"} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Conditions, exclusions, documentation requirements…" />
        </div>
      </div>

      {/* Product policy details */}
      <div className={sec}>
        <div className={secTitle}><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />Product policy details</div>
        <div className="text-[10.5px] text-zinc-400 mb-3">Bank policy — fields shown as per the bank type selected above. All values are defaults — make sure to edit them per your scheme. Defaults are pulled from the bank catalogue; you may override per product.</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FL label="Rate notes" k="rate_notes" ph="e.g. slab based, floating" />
          <FL label="Rate — Salaried (%)" k="rate_salaried" type="number" step="0.01" />
          <FL label="Rate — SENP (%)" k="rate_senp" type="number" step="0.01" />
          <FL label="Processing fee (flat ₹)" k="processing_fee_flat" type="number" />
          <FL label="Processing fee notes" k="processing_fee_notes" ph="e.g. + GST, capped at ₹" />
        </div>
        <div className="text-[11px] font-semibold text-zinc-500 mb-1.5 mt-3">Product variants offered</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {VARIANT_OPTIONS.map((v) => <Chip key={v} label={v} keyName="variants" val={v} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FL label="Negative list (occupations / industries)" k="negative_list" ph="e.g. Gambling, Cryptocurrency, MLM" />
          <div>
            <div className="text-[10.5px] font-semibold text-zinc-500 mb-1">Compliance toggles</div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={!!f.cibil_required} onChange={(e) => set("cibil_required", e.target.checked)} /> CIBIL score mandatory
            </label>
          </div>
        </div>
      </div>

      {msg && <div className={`text-[11.5px] font-semibold px-3 py-2 rounded-lg border ${msg.ok ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-rose-700 border-rose-200 bg-rose-50"}`}>{msg.text}</div>}
      <div className="flex items-center justify-end gap-2">
        <button className="btn btn-primary" disabled={busy || !f.name || !f.lender_id || !f.banker_name || !f.banker_email || !f.banker_phone} onClick={submit}>{busy ? "Publishing…" : "Submit & Publish"}</button>
      </div>
    </div>
  );
}
