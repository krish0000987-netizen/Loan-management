import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Stat, Tabs, EmptyState } from "../../components/ui";
import { api } from "../../lib/api";
import { Plus, ThumbsUp, ThumbsDown, Trash2, LifeBuoy } from "lucide-react";
import { ImportExport } from "./shared";

export function GnHelp() {
  const [tab, setTab] = useState("faq");
  const [faqs, setFaqs] = useState<any>({ rows: [], categories: [] });
  const [tickets, setTickets] = useState<any>({ rows: [], summary: [] });
  const [faqOpen, setFaqOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);

  const loadFaqs = () => { api("/gn/faqs").then(setFaqs).catch(() => {}); };
  const loadTickets = () => { api("/gn/support/tickets").then(setTickets).catch(() => {}); };
  useEffect(loadFaqs, []);
  useEffect(() => { if (tab === "tickets") loadTickets(); }, [tab]);

  const openTickets = tickets.summary.filter((s: any) => s.status === "open").reduce((a: number, s: any) => a + s.n, 0);
  const urgent = tickets.summary.filter((s: any) => s.priority === "urgent" && s.status !== "resolved" && s.status !== "closed").reduce((a: number, s: any) => a + s.n, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Help & FAQ" sub="Self-service knowledge base and support ticket center" breadcrumb="Growth Nations / Help & FAQ" actions={
        <div className="flex items-center gap-2">
          <ImportExport entity={tab === "faq" ? "faqs" : "tickets"} onImported={() => (tab === "faq" ? loadFaqs() : loadTickets())} />
          {tab === "faq" && <button className="btn btn-primary text-[12px]" onClick={() => setFaqOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New FAQ</button>}
          {tab === "tickets" && <button className="btn btn-primary text-[12px]" onClick={() => setTicketOpen(true)}><LifeBuoy className="w-3.5 h-3.5 mr-1" />New Ticket</button>}
        </div>
      } />
      <Tabs items={[
        { key: "faq", label: "FAQ", count: faqs.rows.length },
        { key: "tickets", label: "Support Tickets", count: openTickets }
      ]} active={tab} onChange={setTab} />

      {tab === "faq" && <>
        <div className="grid grid-cols-4 gap-4">
          <Stat label="FAQs" value={faqs.rows.length} />
          <Stat label="Categories" value={faqs.categories.length} />
          <Stat label="Helpful votes" value={faqs.rows.reduce((a: number, f: any) => a + (f.helpful_yes ?? 0), 0)} tone="green" />
          <Stat label="Open Tickets" value={openTickets} tone={urgent > 0 ? "red" : "default"} sub={`${urgent} urgent`} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {faqs.rows.map((f: any) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-semibold text-zinc-800">{f.question}</div>
                <Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 bg-zinc-50 text-zinc-500">{f.category}</span></Badge>
              </div>
              <p className="mt-1.5 text-[12px] text-zinc-600">{f.answer}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10.5px] text-zinc-400">Was this helpful?</span>
                <button className="btn btn-secondary text-[10.5px] !py-1 !px-2" onClick={async () => { await api(`/gn/faqs/${f.id}`, { method: "PATCH", body: { helpful_yes: true } }); loadFaqs(); }}><ThumbsUp className="w-3 h-3 mr-1" />{f.helpful_yes ?? 0}</button>
                <button className="btn btn-secondary text-[10.5px] !py-1 !px-2" onClick={async () => { await api(`/gn/faqs/${f.id}`, { method: "PATCH", body: { helpful_no: true } }); loadFaqs(); }}><ThumbsDown className="w-3 h-3 mr-1" />{f.helpful_no ?? 0}</button>
                <button title="Move to Recycle Bin" className="text-zinc-300 hover:text-red-500 p-1 ml-auto" onClick={async () => { if (confirm("Move this FAQ to the Recycle Bin?")) { await api(`/gn/faqs/${f.id}`, { method: "DELETE" }); loadFaqs(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </Card>
          ))}
          {faqs.rows.length === 0 && <div className="col-span-2"><EmptyState title="No FAQs yet" sub="Create your first FAQ entry." /></div>}
        </div>
      </>}

      {tab === "tickets" && <TicketsTab tickets={tickets} load={loadTickets} onNew={() => setTicketOpen(true)} />}

      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} onDone={() => { setFaqOpen(false); loadFaqs(); }} />
      <TicketModal open={ticketOpen} onClose={() => setTicketOpen(false)} onDone={() => { setTicketOpen(false); loadTickets(); }} />
    </div>
  );
}

function TicketsTab({ tickets, load, onNew }: any) {
  const { rows = [], summary = [] } = tickets;
  const s = Object.fromEntries(summary.map((x: any) => [x.status, x.n]));
  const setStatus = async (t: any, status: string) => {
    await api(`/gn/support/tickets/${t.id}`, { method: "PATCH", body: { status } });
    load();
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Open" value={s.open ?? 0} tone="red" />
        <Stat label="In Progress" value={s["in_progress"] ?? 0} tone="amber" />
        <Stat label="Resolved" value={s.resolved ?? 0} tone="green" />
        <Stat label="Total" value={rows.length} />
      </div>
      <Card pad={false}>
        <table className="w-full text-[12.5px]">
          <thead><tr className="text-left text-[10.5px] uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
            <th className="px-3 py-2.5 font-semibold">Ticket</th><th className="px-3 py-2.5 font-semibold">Category</th><th className="px-3 py-2.5 font-semibold">Priority</th><th className="px-3 py-2.5 font-semibold">Status</th><th className="px-3 py-2.5 font-semibold">Assigned</th><th className="px-3 py-2.5 font-semibold">Created</th><th className="px-3 py-2.5"></th>
          </tr></thead>
          <tbody>
            {rows.map((t: any) => (
              <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-zinc-800">{t.subject}</div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[280px]">{t.message}</div>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{t.category}</td>
                <td className="px-3 py-2.5"><Badge status=""><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${t.priority === "urgent" ? "border-red-200 bg-red-50 text-red-600" : t.priority === "high" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>{t.priority}</span></Badge></td>
                <td className="px-3 py-2.5">
                  <select className="input text-[11px] !py-1" value={t.status} onChange={(e) => setStatus(t, e.target.value)}>
                    {["open", "in_progress", "resolved", "closed"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{t.assigned_name ?? "Unassigned"}</td>
                <td className="px-3 py-2.5 text-zinc-400">{String(t.created_at).slice(0, 16)}</td>
                <td className="px-3 py-2.5 text-[10.5px] text-zinc-400">{t.created_name ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-zinc-400 text-[12px]">No tickets yet</td></tr>}
          </tbody>
        </table>
      </Card>
      <button className="btn btn-secondary text-[12px]" onClick={onNew}><Plus className="w-3.5 h-3.5 mr-1" />New Ticket</button>
    </div>
  );
}

function FaqModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ question: "", answer: "", category: "General" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/faqs", { method: "POST", body: f }); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New FAQ">
      <Field label="Question"><input className="input text-[12.5px]" value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} /></Field>
      <div className="mt-3"><Field label="Category"><input className="input text-[12.5px]" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field></div>
      <div className="mt-3"><Field label="Answer"><textarea className="input text-[12.5px]" rows={4} value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} /></Field></div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.question || !f.answer} onClick={save}>{busy ? "Saving…" : "Create FAQ"}</button>
      </div>
    </Modal>
  );
}

function TicketModal({ open, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ subject: "", message: "", priority: "medium", category: "Bug" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api("/gn/support/tickets", { method: "POST", body: f }); alert("Ticket raised — track it from the Support Tickets tab."); onDone(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Raise Support Ticket">
      <Field label="Subject"><input className="input text-[12.5px]" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Category"><input className="input text-[12.5px]" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
        <Field label="Priority"><select className="input text-[12.5px]" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>{["low", "medium", "high", "urgent"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      </div>
      <div className="mt-3"><Field label="Describe the issue"><textarea className="input text-[12.5px]" rows={4} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field></div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.subject || !f.message} onClick={save}>{busy ? "Submitting…" : "Raise Ticket"}</button>
      </div>
    </Modal>
  );
}
