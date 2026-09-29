import { useEffect, useState } from "react";
import { api, fmtDate } from "../../lib/api";
import { PageHeader, Card, Badge, Field, Modal } from "../../components/ui";

export default function PortalDocuments() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("pan");
  const [name, setName] = useState("");
  const [appId, setAppId] = useState<number | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => api("/portal/documents").then((r) => setRows(r.rows));
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    const a = await api("/portal/applications");
    setApps(a.rows);
    setAppId(a.rows[0]?.id ?? null);
    setOpen(true);
  };

  const submit = async () => {
    try {
      await api("/portal/documents", { method: "POST", body: { application_id: appId, category, name } });
      setMsg("Document uploaded — pending verification");
      setOpen(false);
      load();
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <PageHeader
        title="My documents"
        sub="Upload and track verification of your documents"
        actions={<button className="btn btn-primary" onClick={openModal}>Upload document</button>}
      />
      {msg && <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[12px] text-emerald-800">{msg}</div>}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-zinc-200">
              <th className="th">Document</th><th className="th">Application</th><th className="th">Category</th>
              <th className="th">Version</th><th className="th">Uploaded</th><th className="th">Status</th>
            </tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-zinc-50">
                  <td className="td font-medium text-zinc-800">{d.name}</td>
                  <td className="td">{d.application_no || "—"}</td>
                  <td className="td uppercase text-zinc-500">{d.category}</td>
                  <td className="td">v{d.version}</td>
                  <td className="td text-zinc-500">{fmtDate(d.created_at)}</td>
                  <td className="td"><Badge status={d.status} /></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="py-12 text-center text-zinc-400">No documents yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload document">
        <div className="space-y-3">
          <Field label="Application">
            <select className="input w-full" value={appId ?? ""} onChange={(e) => setAppId(Number(e.target.value))}>
              {apps.map((a) => <option key={a.id} value={a.id}>{a.application_no} · {a.product_name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className="input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["pan", "aadhaar", "address_proof", "bank_statement", "salary_slip", "itr", "gst", "business_reg"].map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="File name">
            <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. pan-card.pdf" />
          </Field>
          <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-[10.5px] text-amber-800">Demo upload — the file is recorded as metadata only; no real file storage occurs.</div>
          <button className="btn btn-primary w-full" disabled={!name || !appId} onClick={submit}>Upload</button>
        </div>
      </Modal>
    </div>
  );
}
