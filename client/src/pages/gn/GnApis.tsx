import { useState } from "react";
import { Card, PageHeader, Modal, Badge } from "../../components/ui";
import { Link } from "react-router-dom";
import { Play, ShieldCheck, Loader2 } from "lucide-react";

const API_GROUPS: { group: string; items: { name: string; cost: number; input: string; sample: string }[] }[] = [
  {
    group: "COMPANY / IDENTITY",
    items: [
      { name: "PAN → CIN", cost: 16.5, input: "PAN · ABCDE1234F", sample: "CIN U74999DL2015PTC284839 · Acme Pvt Ltd · Active" },
      { name: "CIN → PAN", cost: 3, input: "CIN · U74999DL2015PTC284839", sample: "PAN ABCDE1234F verified" },
      { name: "Company → CIN", cost: 3.6, input: "Company Name · Acme Pvt Ltd", sample: "CIN U74999DL2015PTC284839" },
      { name: "PAN → DIN", cost: 1.35, input: "PAN · ABCDE1234F", sample: "DIN 01234567 · 1 directorship" },
      { name: "DIN → PAN", cost: 1.5, input: "DIN · 01234567", sample: "PAN ABCDE1234F linked" },
      { name: "Mobile → Udyam (MSME)", cost: 12, input: "Mobile · 9876543210", sample: "Udyam registration UDYAM-XX-00-0001234" }
    ]
  },
  {
    group: "EMPLOYMENT",
    items: [
      { name: "Employment (UAN Basic)", cost: 4.5, input: "UAN · 100123456789", sample: "Employer: Tata Motors · Joined 2021 · Active" },
      { name: "Employment History (UAN)", cost: 7.5, input: "UAN · 100123456789", sample: "3 employers · 5 yr 2 mo total service" },
      { name: "Employment + PF (UAN)", cost: 6, input: "UAN · 100123456789", sample: "PF corpus ₹4,82,300 · 42 contributions" }
    ]
  },
  {
    group: "GST",
    items: [
      { name: "GSTIN Verification", cost: 1.8, input: "GSTIN · 22AAAAA0000A1Z5", sample: "Acme Pvt Ltd · Active · Chhattisgarh" },
      { name: "GSTIN Basic", cost: 1.2, input: "GSTIN · 22AAAAA0000A1Z5", sample: "Valid GSTIN · state 22" },
      { name: "GSTIN Enhanced", cost: 1.8, input: "GSTIN · 22AAAAA0000A1Z5", sample: "Filing compliance: Regular · Last GSTR-3B filed" },
      { name: "GSTINs by PAN", cost: 1.2, input: "PAN · ABCDE1234F", sample: "2 GSTINs found" },
      { name: "GSTIN → Contact", cost: 2.25, input: "GSTIN · 22AAAAA0000A1Z5", sample: "Contact + address returned" }
    ]
  },
  {
    group: "VEHICLE",
    items: [
      { name: "Vehicle RC (VAHAN)", cost: 6.75, input: "RC / Vehicle No. · RJ14AB1234", sample: "Mahindra Bolero · 2019 · Owner: Omkar Patil · No hypothecation" },
      { name: "RC e-Challan", cost: 6, input: "RC / Vehicle No. · RJ14AB1234", sample: "2 pending challans · ₹1,200" }
    ]
  }
];

export function GnApis() {
  const [running, setRunning] = useState<any>(null);
  const [result, setResult] = useState<string>("");
  const [done, setDone] = useState(false);

  const run = (item: any) => {
    setRunning(item);
    setDone(false);
    setResult("");
    setTimeout(() => { setResult(item.sample); setDone(true); }, 900);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Verification APIs" sub="Run GST, PAN, CIN, DIN, Udyam, Employment (UAN) and Vehicle checks on demand. Each call is billed from your wallet." breadcrumb="Growth Nations / API"
        actions={<Link to="/gn/wallet" className="btn btn-secondary text-[12px]">Wallet: ₹29,600</Link>} />
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-800 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span><b>Sandbox mode.</b> Results below are simulated demo responses — real provider credentials are required for production API calls. No live bureau data is fetched.</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {API_GROUPS.map((g) => (
          <Card key={g.group}>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-3">{g.group}</div>
            <div className="space-y-2">
              {g.items.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                  <div>
                    <div className="text-[12px] font-semibold text-zinc-800">{item.name} <span className="text-[10px] text-zinc-400 font-normal">· ₹{item.cost}</span></div>
                    <div className="text-[10.5px] text-zinc-400">{item.input}</div>
                  </div>
                  <button className="btn btn-secondary text-[11px]" onClick={() => run(item)} disabled={!!running}>
                    {running?.name === item.name && !done ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {running?.name === item.name && !done ? "Running…" : "Run"}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!running} onClose={() => setRunning(null)} title={running ? `${running.name} — Result` : "Result"}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge status=""><span className={done ? "bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10.5px] font-bold" : "bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10.5px] font-bold"}>{done ? "SUCCESS" : "PROCESSING"}</span></Badge>
            <span className="text-[11.5px] text-zinc-400">Billed ₹{running?.cost} from wallet</span>
          </div>
          {done ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-[13px] text-zinc-800">{result}</div>
          ) : (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-6 flex items-center justify-center gap-2 text-[12px] text-zinc-400"><Loader2 className="w-4 h-4 animate-spin" /> Fetching from sandbox provider…</div>
          )}
          <div className="text-[10.5px] text-zinc-400">Simulated demo response — clearly marked SANDBOX. Wire a real provider in Integrations to go live.</div>
        </div>
      </Modal>
    </div>
  );
}
