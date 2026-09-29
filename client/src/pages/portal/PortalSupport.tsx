import { useEffect, useState } from "react";
import { api, fmtDateTime } from "../../lib/api";
import { PageHeader, Card, Badge, Field, Modal } from "../../components/ui";

export default function PortalSupport() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Payment");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    api("/portal/complaints").then((r) => setComplaints(r.rows));
    api("/portal/notifications").then((r) => setNotifs(r.rows));
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      const r = await api("/portal/complaints", { method: "POST", body: { category, subject, description } });
      setMsg(`Complaint ${r.complaint_no} raised — our team will respond within 48h`);
      setOpen(false);
      load();
      setTimeout(() => setMsg(""), 5000);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Support"
        sub="Raise a complaint or track existing ones"
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>Raise complaint</button>}
      />
      {msg && <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[12px] text-emerald-800">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">My complaints</h3>
          <div className="space-y-2">
            {complaints.map((c) => (
              <div key={c.id} className="rounded-md border border-zinc-100 px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-zinc-800">{c.complaint_no} · {c.category}</span>
                  <Badge status={c.status} />
                </div>
                <div className="text-[12px] text-zinc-600 mt-1">{c.subject}</div>
                <div className="text-[11px] text-zinc-400 mt-1">{fmtDateTime(c.created_at)} · SLA {c.sla_hours}h</div>
                {c.resolution && <div className="mt-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11.5px] text-emerald-800">Resolution: {c.resolution}</div>}
              </div>
            ))}
            {!complaints.length && <div className="py-10 text-center text-[12.5px] text-zinc-400">No complaints raised.</div>}
          </div>
        </Card>
        <Card>
          <h3 className="text-[13px] font-semibold text-zinc-900 mb-3">Notifications</h3>
          <div className="space-y-2.5">
            {notifs.map((n) => (
              <div key={n.id} className="text-[12px] border-b border-zinc-50 pb-2.5 last:border-0">
                <div className="font-medium text-zinc-800">{n.title}</div>
                <div className="text-zinc-500 mt-0.5">{n.body}</div>
                <div className="text-[10.5px] text-zinc-400 mt-1">{fmtDateTime(n.created_at)}</div>
              </div>
            ))}
            {!notifs.length && <div className="py-10 text-center text-[12.5px] text-zinc-400">No notifications.</div>}
          </div>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Raise a complaint">
        <div className="space-y-3">
          <Field label="Category">
            <select className="input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Payment", "Disbursement", "Statement", "KYC", "Portal", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <input className="input w-full" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
          </Field>
          <Field label="Description">
            <textarea className="input w-full min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue…" />
          </Field>
          <button className="btn btn-primary w-full" disabled={!subject || description.length < 10} onClick={submit}>Submit complaint</button>
        </div>
      </Modal>
    </div>
  );
}
