import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight, X, ArrowUpDown, Download, Inbox } from "lucide-react";
import { badgeFor, statusLabel } from "../lib/api";

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`card ${pad ? "card-pad" : ""} ${className}`}>{children}</div>;
}

export function CardTitle({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="text-[13px] font-semibold text-zinc-900">{title}</h3>
        {sub && <p className="text-[11.5px] text-zinc-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ title, sub, actions, breadcrumb }: { title: string; sub?: string; actions?: ReactNode; breadcrumb?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
      <div>
        {breadcrumb && <div className="text-[11px] text-zinc-400 mb-1">{breadcrumb}</div>}
        <h1 className="text-[19px] font-semibold tracking-tight text-zinc-900">{title}</h1>
        {sub && <p className="text-[12.5px] text-zinc-500 mt-1">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ status, children }: { status?: string | null; children?: ReactNode }) {
  return <span className={badgeFor(status)}>{children ?? statusLabel(status)}</span>;
}

export function Stat({ label, value, sub, tone = "default", icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "default" | "green" | "red" | "amber" | "brand"; icon?: ReactNode }) {
  const tones: Record<string, string> = {
    default: "text-zinc-900", green: "text-emerald-700", red: "text-rose-700", amber: "text-amber-700", brand: "text-brand-600"
  };
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
          <div className={`mt-1.5 text-[22px] font-semibold num tracking-tight ${tones[tone]}`}>{value}</div>
          {sub && <div className="mt-1 text-[11.5px] text-zinc-500">{sub}</div>}
        </div>
        {icon && <div className="text-zinc-300">{icon}</div>}
      </div>
    </Card>
  );
}

export function Tabs({ items, active, onChange }: { items: { key: string; label: string; count?: number }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-zinc-200 pb-px mb-4 overflow-x-auto">
      {items.map((it) => (
        <button key={it.key} className={`tabs-btn ${active === it.key ? "tabs-btn-active" : ""}`} onClick={() => onChange(it.key)}>
          {it.label}
          {it.count !== undefined && <span className="ml-1 text-[10.5px] font-semibold text-zinc-400">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, className = "", span }: { label: string; children: ReactNode; className?: string; span?: number }) {
  return (
    <div className={className} style={span ? { gridColumn: `span ${span}` } : undefined}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative card shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 sticky top-0 bg-white rounded-t-lg">
          <h3 className="text-[13.5px] font-semibold text-zinc-900">{title}</h3>
          <button className="text-zinc-400 hover:text-zinc-700 cursor-pointer" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full ${width} w-full bg-white shadow-2xl flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h3 className="text-[13.5px] font-semibold text-zinc-900">{title}</h3>
          <button className="text-zinc-400 hover:text-zinc-700 cursor-pointer" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
}

export function DataTable<T extends { id: number }>({
  columns, rows, total, page, limit, onPage, searchable, searchPlaceholder = "Search…", onSearch, dense, onRowClick, exportName
}: {
  columns: Column<T>[];
  rows: T[];
  total?: number;
  page?: number;
  limit?: number;
  onPage?: (p: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  dense?: boolean;
  onRowClick?: (row: T) => void;
  exportName?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState<Set<string>>(new Set(columns.map((c) => c.key)));

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sortDir;
      return String(va).localeCompare(String(vb)) * sortDir;
    });
  }, [rows, sortKey, sortDir, columns]);

  const filtered = useMemo(() => {
    if (!q) return sorted;
    return sorted.filter((r) => columns.some((c) => c.render(r) != null && String(c.render(r)).toLowerCase().includes(q.toLowerCase())));
  }, [sorted, q, columns]);

  const pages = total !== undefined && limit ? Math.max(1, Math.ceil(total / limit)) : 1;
  const colList = columns.filter((c) => visible.has(c.key));

  return (
    <div>
      {(searchable || onSearch || exportName) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              className="input pl-8"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => { setQ(e.target.value); onSearch?.(e.target.value); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input w-auto text-[12px]"
              value={[...visible].join(",")}
              onChange={(e) => {
                const set = new Set<string>(e.target.value.split(",").filter(Boolean));
                setVisible(set);
              }}
            >
              <option value={columns.map((c) => c.key).join(",")}>All columns</option>
              {columns.map((c) => (
                <option key={c.key} value={[...visible].includes(c.key) ? [...visible].filter((k) => k !== c.key).join(",") : [...visible, c.key].join(",")}>
                  {visible.has(c.key) ? `Hide ${c.header}` : `Show ${c.header}`}
                </option>
              ))}
            </select>
            {exportName && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const head = colList.map((c) => c.header).join(",");
                  const body = filtered.map((r) => colList.map((c) => String(c.render(r) ?? "").replace(/,/g, " ")).join(",")).join("\n");
                  const blob = new Blob([head + "\n" + body], { type: "text/csv" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${exportName}.csv`;
                  a.click();
                }}
              >
                <Download size={13} /> Export
              </button>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full border-collapse min-w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              {colList.map((c) => (
                <th
                  key={c.key}
                  className={`th ${c.align === "right" ? "text-right" : ""}`}
                  style={{ width: c.width }}
                  onClick={() => {
                    if (!c.sortValue) return;
                    if (sortKey === c.key) setSortDir((d) => (d === 1 ? -1 : 1));
                    else { setSortKey(c.key); setSortDir(1); }
                  }}
                >
                  <span className={`inline-flex items-center gap-1 ${c.sortValue ? "cursor-pointer hover:text-zinc-900" : ""}`}>
                    {c.header}
                    {c.sortValue && <ArrowUpDown size={11} className="text-zinc-300" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={colList.length} className="py-12 text-center">
                  <Inbox size={28} className="mx-auto text-zinc-300 mb-2" />
                  <div className="text-[13px] text-zinc-500">No records match</div>
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className={`tr-hover border-b border-zinc-100 ${onRowClick ? "cursor-pointer" : ""}`} onClick={() => onRowClick?.(row)}>
                {colList.map((c) => (
                  <td key={c.key} className={`td ${dense ? "py-2" : ""} ${c.align === "right" ? "text-right num" : ""}`}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total !== undefined && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
          <div className="text-[11.5px] text-zinc-500">
            {total} records · page {(page ?? 1)} of {pages}
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-secondary btn-sm" disabled={!onPage || (page ?? 1) <= 1} onClick={() => onPage?.((page ?? 1) - 1)}><ChevronLeft size={13} /></button>
            <button className="btn btn-secondary btn-sm" disabled={!onPage || (page ?? 1) >= pages} onClick={() => onPage?.((page ?? 1) + 1)}><ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="py-14 text-center">
      <Inbox size={30} className="mx-auto text-zinc-300 mb-3" />
      <div className="text-[13.5px] font-medium text-zinc-700">{title}</div>
      {sub && <div className="text-[12px] text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "green" | "red" | "amber" }) {
  const tones: Record<string, string> = { brand: "bg-brand-600", green: "bg-emerald-500", red: "bg-rose-500", amber: "bg-amber-500" };
  return (
    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div className={`h-full ${tones[tone]} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function KV({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-zinc-50 last:border-0">
      <span className="text-[11.5px] text-zinc-500">{k}</span>
      <span className={`text-[12.5px] font-medium text-zinc-800 text-right ${mono ? "num" : ""}`}>{v}</span>
    </div>
  );
}

export function useDebounce<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
