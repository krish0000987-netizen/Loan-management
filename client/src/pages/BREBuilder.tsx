import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Power, FlaskConical, Save, ChevronDown } from "lucide-react";
import { api } from "../lib/api";
import { PageHeader, Card, CardTitle, Badge, Modal, Field, Tabs, type Column, DataTable } from "../components/ui";

const FIELDS: [string, string][] = [
  ["credit.score", "Credit score"], ["credit.dpd_max", "Bureau max DPD"], ["credit.utilization", "Credit utilization %"],
  ["credit.enquiries_6m", "Enquiries (6m)"], ["credit.writeoffs", "Write-offs"], ["credit.settlements", "Settlements"],
  ["credit.total_outstanding", "Bureau outstanding"], ["credit.overdue_accounts", "Overdue accounts"],
  ["customer.age", "Age"], ["customer.monthly_income", "Monthly income"], ["customer.annual_income", "Annual income"],
  ["customer.business_turnover", "Business turnover"], ["customer.employment_type", "Employment type"],
  ["customer.state", "State"], ["customer.city", "City"], ["customer.credit_score", "Customer credit score"],
  ["bank.monthly_income", "Bank monthly income"], ["bank.avg_balance", "Average balance"], ["bank.bounce_count", "Cheque bounces"],
  ["bank.emi_obligations", "EMI obligations"], ["bank.surplus", "Banking surplus"], ["bank.cash_deposits", "Cash deposits"],
  ["bank.turnover", "Bank turnover"], ["gst.turnover", "GST turnover"], ["gst.filing_status", "GST filing status"],
  ["capacity.foir", "FOIR %"], ["capacity.dscr", "DSCR"], ["capacity.income", "Capacity income"], ["capacity.obligations", "Existing obligations"],
  ["exposure.total", "Existing exposure"], ["application.requested_amount", "Requested amount"], ["application.tenure", "Tenure"],
  ["documents.verified", "Verified documents"]
];

const OPERATORS = [
  ["gte", "≥ (at least)"], ["gt", "> (greater than)"], ["lte", "≤ (at most)"], ["lt", "< (less than)"],
  ["eq", "= (equals)"], ["neq", "≠ (not equal)"], ["between", "between"], ["in", "in list"], ["contains", "contains"]
];

interface Leaf { operator: string; field: string; value?: any; min?: any; max?: any; values?: any[] }
interface Group { operator: "and" | "or"; children: (Leaf | Group)[] }

function emptyLeaf(): Leaf { return { operator: "gte", field: "credit.score", value: 650 }; }

export default function BREBuilder() {
  const [rules, setRules] = useState<any[]>([]);
  const [tab, setTab] = useState("rules");
  const [createOpen, setCreateOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [form, setForm] = useState<any>({ code: "", name: "", category: "credit_policy", priority: 100, action: { eligible: true } });
  const [tree, setTree] = useState<Group>({ operator: "and", children: [emptyLeaf()] });

  const load = () => api("/admin/bre/rules").then(setRules);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    await api("/admin/bre/rules", { method: "POST", body: { ...form, conditions: tree, action: { ...form.action, reason: "Policy rule" } } });
    setCreateOpen(false);
    setTree({ operator: "and", children: [emptyLeaf()] });
    load();
  };

  const simulate = async () => {
    const res = await api("/admin/bre/simulate", { method: "POST", body: { conditions: tree, action: {} } });
    setSimResult(res);
  };

  const columns: Column<any>[] = [
    { key: "code", header: "Rule", render: (r) => (
      <div>
        <div className="font-medium text-zinc-800">{r.code} · v{r.version}</div>
        <div className="text-[10.5px] text-zinc-400">{r.name}</div>
      </div>
    )},
    { key: "category", header: "Category", render: (r) => <Badge status={r.category === "regulatory" ? "violet" : r.category === "approval" ? "blue" : r.category === "operational" ? "zinc" : "indigo"}>{r.category.replace(/_/g, " ")}</Badge> },
    { key: "priority", header: "Priority", align: "right", render: (r) => <span className="num">{r.priority}</span> },
    { key: "conditions", header: "Conditions", render: (r) => <span className="text-[11.5px] text-zinc-600">{r.rendered}</span> },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {r.status === "active"
          ? <button className="btn btn-secondary btn-sm" onClick={async () => { await api(`/admin/bre/rules/${r.id}/retire`, { method: "POST" }); load(); }}><Power size={11} /> Retire</button>
          : <button className="btn btn-primary btn-sm" onClick={async () => { await api(`/admin/bre/rules/${r.id}/activate`, { method: "POST" }); load(); }}><Power size={11} /> Activate</button>}
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader
        title="Business Rule Engine"
        sub={`${rules.filter((r) => r.status === "active").length} active rules · ${rules.length} total · versioned & audited`}
        breadcrumb="LOS / Rules"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => { setSimOpen(true); setSimResult(null); }}><FlaskConical size={13} /> Policy simulator</button>
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New rule</button>
          </>
        }
      />

      <Tabs active={tab} onChange={setTab} items={[{ key: "rules", label: "Rules" }, { key: "categories", label: "Policy categories" }]} />

      {tab === "rules" && (
        <Card>
          <DataTable columns={columns} rows={rules} total={rules.length} searchable searchPlaceholder="Search rules…" />
        </Card>
      )}

      {tab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            ["product", "Product rules", "Loan limits, tenure bands, fees, prepayment — per product configuration", "indigo"],
            ["credit_policy", "Credit policy", "Score, FOIR, DSCR, exposure and bureau thresholds that gate eligibility", "brand"],
            ["regulatory", "Regulatory controls", "KFS, consent and disclosure gates — versioned compliance rules", "violet"],
            ["operational", "Operational rules", "Internal SLAs, document completeness and workflow guards", "blue"],
            ["approval", "Approval rules", "Tiered authorization matrix by amount and role", "amber"]
          ].map(([key, name, desc, tone]) => (
            <Card key={key}>
              <div className="flex items-center justify-between mb-2">
                <Badge status={tone as string}>{name}</Badge>
                <span className="num text-[11px] text-zinc-400">{rules.filter((r) => r.category === key).length} rules</span>
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">{desc}</p>
              <div className="mt-3 space-y-1">
                {rules.filter((r) => r.category === key).slice(0, 4).map((r) => (
                  <div key={r.id} className="text-[11px] text-zinc-600 flex justify-between"><span>{r.code}</span><Badge status={r.status} /></div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rule builder */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Build a policy rule" wide>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Rule code"><input className="input" placeholder="BRE-FOIR-02" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Rule name"><input className="input" placeholder="FOIR within 50%" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="product">Product</option><option value="credit_policy">Credit policy</option>
              <option value="regulatory">Regulatory</option><option value="operational">Operational</option><option value="approval">Approval</option>
            </select>
          </Field>
          <Field label="Priority (lower runs first)"><input className="input num" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></Field>
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">Conditions — IF … THEN</div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
          {tree.children.map((child, idx) => (
            <ConditionRow key={idx} leaf={child as Leaf} onUpdate={(leaf) => {
              const next = [...tree.children];
              next[idx] = leaf;
              setTree({ ...tree, children: next });
            }} onRemove={() => setTree({ ...tree, children: tree.children.filter((_, i) => i !== idx) })} />
          ))}
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setTree({ ...tree, children: [...tree.children, emptyLeaf()] })}><Plus size={12} /> Add condition</button>
            <select className="input w-auto text-[11.5px]" value={tree.operator} onChange={(e) => setTree({ ...tree, operator: e.target.value as "and" | "or" })}>
              <option value="and">All conditions (AND)</option>
              <option value="or">Any condition (OR)</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11.5px] text-zinc-500">
          <span className="font-medium text-zinc-700">THEN</span>
          <select className="input w-48" value={form.action.eligible ? "eligible" : "rejected"} onChange={(e) => setForm({ ...form, action: { ...form.action, eligible: e.target.value === "eligible" } })}>
            <option value="eligible">Eligible = TRUE</option>
            <option value="rejected">Eligible = FALSE (reject)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!form.name || !form.code}><Save size={13} /> Save rule (draft)</button>
        </div>
      </Modal>

      {/* Policy simulator */}
      <Modal open={simOpen} onClose={() => setSimOpen(false)} title="Policy simulator — test before you change" wide>
        <div className="text-[12px] text-zinc-500 mb-3">Simulate what happens if this rule were active — against {simResult?.simulated ?? "live"} applications. Production policy is never touched.</div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 space-y-2 mb-4">
          {tree.children.map((child, idx) => (
            <ConditionRow key={idx} leaf={child as Leaf} onUpdate={(leaf) => {
              const next = [...tree.children];
              next[idx] = leaf;
              setTree({ ...tree, children: next });
            }} onRemove={() => setTree({ ...tree, children: tree.children.filter((_, i) => i !== idx) })} />
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => setTree({ ...tree, children: [...tree.children, emptyLeaf()] })}><Plus size={12} /> Add condition</button>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={simulate}><FlaskConical size={13} /> Run simulation</button>
          {simResult && (
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-zinc-500">{simResult.simulated} applications tested</span>
              <span className={`font-semibold ${simResult.affected > 0 ? "text-rose-600" : "text-emerald-600"}`}>{simResult.affected} would be impacted ({simResult.impactPct}%)</span>
            </div>
          )}
        </div>
        {simResult?.results?.length > 0 && (
          <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-zinc-100">
            <table className="w-full text-[11px]">
              <thead className="bg-zinc-50 sticky top-0"><tr className="text-zinc-400">
                <th className="text-left px-3 py-2">Application</th><th className="text-left px-3 py-2">Would pass</th><th className="text-left px-3 py-2">Reason</th>
              </tr></thead>
              <tbody>
                {simResult.results.slice(0, 30).map((r: any) => (
                  <tr key={r.applicationId} className="border-t border-zinc-50">
                    <td className="px-3 py-1.5 num">#{r.applicationId}</td>
                    <td className="px-3 py-1.5">{r.eligible ? <Badge status="verified">PASS</Badge> : <Badge status="rejected">FAIL</Badge>}</td>
                    <td className="px-3 py-1.5 text-zinc-500">{r.reason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ConditionRow({ leaf, onUpdate, onRemove }: { leaf: Leaf; onUpdate: (l: Leaf) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select className="input w-44 text-[11.5px]" value={leaf.field} onChange={(e) => onUpdate({ ...leaf, field: e.target.value })}>
        {FIELDS.map(([f, label]) => <option key={f} value={f}>{label}</option>)}
      </select>
      <select className="input w-32 text-[11.5px]" value={leaf.operator} onChange={(e) => onUpdate({ ...leaf, operator: e.target.value })}>
        {OPERATORS.map(([op, label]) => <option key={op} value={op}>{label}</option>)}
      </select>
      {leaf.operator === "between" ? (
        <div className="flex items-center gap-1.5">
          <input className="input w-24 num text-[11.5px]" type="number" placeholder="min" value={leaf.min ?? ""} onChange={(e) => onUpdate({ ...leaf, min: Number(e.target.value) })} />
          <span className="text-zinc-400">and</span>
          <input className="input w-24 num text-[11.5px]" type="number" placeholder="max" value={leaf.max ?? ""} onChange={(e) => onUpdate({ ...leaf, max: Number(e.target.value) })} />
        </div>
      ) : (
        <input
          className="input w-28 num text-[11.5px]"
          type={["gte", "gt", "lte", "lt", "between"].includes(leaf.operator) ? "number" : "text"}
          value={leaf.value ?? ""}
          placeholder="value"
          onChange={(e) => onUpdate({ ...leaf, value: ["gte", "gt", "lte", "lt"].includes(leaf.operator) ? Number(e.target.value) : e.target.value })}
        />
      )}
      <button className="text-zinc-300 hover:text-rose-500 cursor-pointer" onClick={onRemove}><Trash2 size={13} /></button>
    </div>
  );
}
