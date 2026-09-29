import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, Stat, EmptyState } from "../../components/ui";
import { api } from "../../lib/api";
import { Plus, Trash2, FileText, Search, Pencil } from "lucide-react";
import { ImportExport } from "./shared";

export function GnDocs() {
  const [data, setData] = useState<any>({ rows: [], categories: [] });
  const [cat, setCat] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [view, setView] = useState<any>(null);

  const load = () => {
    const p = new URLSearchParams();
    if (cat) p.set("category", cat);
    api(`/gn/docs${p.toString() ? `?${p}` : ""}`).then(setData).catch(() => {});
  };
  useEffect(load, [cat]);

  const rows = data.rows.filter((d: any) => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader title="Documentation" sub="Product guides, runbooks and reference articles for the entire Growth Nations platform" breadcrumb="Growth Nations / Documentation" actions={
        <div className="flex items-center gap-2">
          <ImportExport entity="docs" onImported={load} />
          <button className="btn btn-primary text-[12px]" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />New Article</button>
        </div>
      } />
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Articles" value={data.rows.length} />
        <Stat label="Categories" value={data.categories.length} />
        <Stat label="Getting Started" value={data.categories.find((c: any) => c.category === "Getting Started")?.n ?? 0} tone="brand" />
        <Stat label="Loan Origination" value={data.categories.find((c: any) => c.category === "Loan Origination")?.n ?? 0} />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input text-[12px] pl-8" placeholder="Search articles…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`btn text-[11.5px] ${!cat ? "btn-primary" : "btn-secondary"}`} onClick={() => setCat("")}>All</button>
        {data.categories.map((c: any) => (
          <button key={c.category} className={`btn text-[11.5px] ${cat === c.category ? "btn-primary" : "btn-secondary"}`} onClick={() => setCat(cat === c.category ? "" : c.category)}>{c.category} ({c.n})</button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map((d: any) => (
          <Card key={d.id}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-indigo-600" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button className="text-[13.5px] font-semibold text-zinc-800 hover:text-indigo-600 text-left" onClick={() => setView(d)}>{d.title}</button>
                  <Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700">{d.category}</span></Badge>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">Updated {String(d.updated_at).slice(0, 16)} by {d.updated_name ?? "—"}</div>
                <p className="mt-2 text-[12px] text-zinc-600 line-clamp-3">{d.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button title="Edit" className="text-zinc-300 hover:text-indigo-600 p-1" onClick={() => setEdit(d)}><Pencil className="w-3.5 h-3.5" /></button>
                <button title="Move to Recycle Bin" className="text-zinc-300 hover:text-red-500 p-1" onClick={async () => { if (confirm(`Move article “${d.title}” to the Recycle Bin?`)) { await api(`/gn/docs/${d.id}`, { method: "DELETE" }); load(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <div className="col-span-2"><EmptyState title="No articles found" sub="Try a different category or create a new article." /></div>}
      </div>
      <DocModal open={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} doc={null} />
      <DocModal open={!!edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} doc={edit} />
      <ViewModal doc={view} onClose={() => setView(null)} onEdit={() => { setEdit(view); setView(null); }} />
    </div>
  );
}

function DocModal({ open, onClose, onDone, doc }: any) {
  const [f, setF] = useState<any>({ title: "", category: "Getting Started", content: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setF({ title: doc?.title ?? "", category: doc?.category ?? "Getting Started", content: doc?.content ?? "" }); }, [open, doc]);
  const save = async () => {
    setBusy(true);
    try {
      if (doc) await api(`/gn/docs/${doc.id}`, { method: "PATCH", body: f });
      else await api("/gn/docs", { method: "POST", body: f });
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={doc ? "Edit Article" : "New Article"}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" span={2}><input className="input text-[12.5px]" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Category" span={2}><input className="input text-[12.5px]" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Getting Started, Loan Origination, …" /></Field>
        <Field label="Content" span={2}><textarea className="input text-[12.5px]" rows={8} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary text-[12px]" disabled={busy || !f.title} onClick={save}>{busy ? "Saving…" : doc ? "Save Changes" : "Create Article"}</button>
      </div>
    </Modal>
  );
}

function ViewModal({ doc, onClose, onEdit }: any) {
  if (!doc) return null;
  return (
    <Modal open onClose={onClose} title={doc.title} wide>
      <div className="flex items-center gap-2 mb-3">
        <Badge status=""><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700">{doc.category}</span></Badge>
        <span className="text-[11px] text-zinc-400">Updated {String(doc.updated_at).slice(0, 16)} by {doc.updated_name ?? "—"}</span>
      </div>
      <div className="prose prose-sm max-w-none text-[13px] text-zinc-700 whitespace-pre-wrap">{doc.content}</div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-secondary text-[12px]" onClick={onEdit}><Pencil className="w-3 h-3 mr-1" />Edit</button>
        <button className="btn btn-secondary text-[12px]" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
