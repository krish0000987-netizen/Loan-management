import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, Badge, Modal, Field, EmptyState } from "../../components/ui";
import { api } from "../../lib/api";
import { GN_MODULES, GN_ACTIONS, gnPerm } from "../../lib/gn";
import { Users, ShieldCheck, Search, Plus, Save, Check, Copy, CheckCheck } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  view: "View", create: "Create", edit: "Update", delete: "Delete", manage: "Manage", use: "Use"
};

type GridCell = { allowed: boolean; scope: "all" | "own" };
type Grid = Record<string, Record<string, GridCell>>;

export function GnRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [grid, setGrid] = useState<Grid>({});
  const [roleMeta, setRoleMeta] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const loadRoles = () => api<{ roles: any[] }>("/gn/admin/roles").then((r) => {
    setRoles(r.roles);
    if (!selId && r.roles.length) setSelId(r.roles[0].id);
  }).catch(() => {});
  useEffect(() => { loadRoles(); }, []);

  const loadGrid = (id: number) => {
    api<{ role: any; grid: Grid }>(`/gn/admin/roles/${id}/permissions`).then((r) => {
      setRoleMeta(r.role);
      setGrid(r.grid);
    }).catch(() => {});
  };
  useEffect(() => { if (selId) loadGrid(selId); }, [selId]);

  const sel = roles.find((r) => r.id === selId);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q) || (r.designation ?? "").toLowerCase().includes(q) || (r.partner_type ?? "").toLowerCase().includes(q));
  }, [roles, search]);
  const staff = filtered.filter((r) => r.kind === "staff");
  const partners = filtered.filter((r) => r.kind === "partner");

  const toggle = (m: string, a: string) => {
    setGrid((g) => ({ ...g, [m]: { ...g[m], [a]: { ...g[m][a], allowed: !g[m][a].allowed } } }));
  };
  const setScope = (m: string, a: string, scope: "all" | "own") => {
    setGrid((g) => ({ ...g, [m]: { ...g[m], [a]: { ...g[m][a], scope } } }));
  };
  const toggleModule = (m: string, on: boolean) => {
    setGrid((g) => {
      const ng: Grid = { ...g, [m]: {} };
      for (const a of GN_ACTIONS) ng[m][a] = { ...g[m][a], allowed: on };
      return ng;
    });
  };

  const save = async (targetId = selId) => {
    if (!targetId) return;
    setSaving(true); setMsg(null);
    const rows: { module: string; action: string; allowed: boolean; scope: string }[] = [];
    for (const m of GN_MODULES) for (const a of GN_ACTIONS) rows.push({ module: m, action: a, allowed: grid[m]?.[a]?.allowed ?? false, scope: grid[m]?.[a]?.scope ?? "all" });
    try {
      const r = await api(`/gn/admin/roles/${targetId}/permissions`, { method: "POST", body: { rows } });
      setMsg(`Saved ${r.granted} permissions for ${roleMeta?.name}. Changes take effect immediately.`);
      loadRoles();
    } catch (e: any) { setMsg("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const applyToSimilar = async () => {
    if (!sel) return;
    const key = sel.kind === "partner" ? "partner_type" : "designation";
    const val = sel[key];
    if (!val) { setMsg("This role has no designation/partner-type to apply to."); return; }
    const targets = roles.filter((r) => r.id !== sel.id && r.kind === sel.kind && r[key] === val);
    if (!targets.length) { setMsg("No other roles share this designation/partner type."); return; }
    setSaving(true);
    let done = 0;
    for (const t of targets) {
      const rows: any[] = [];
      for (const m of GN_MODULES) for (const a of GN_ACTIONS) rows.push({ module: m, action: a, allowed: grid[m]?.[a]?.allowed ?? false, scope: grid[m]?.[a]?.scope ?? "all" });
      try { await api(`/gn/admin/roles/${t.id}/permissions`, { method: "POST", body: { rows } }); done++; } catch {}
    }
    setSaving(false);
    setMsg(`Applied permissions to ${done} role(s) with same ${sel.kind === "partner" ? "partner type" : "designation"}.`);
  };

  const grantedCount = () => {
    let n = 0;
    for (const m of GN_MODULES) for (const a of GN_ACTIONS) if (grid[m]?.[a]?.allowed) n++;
    return n;
  };

  const createRole = async (name: string, kind: string, designation: string, partnerType: string) => {
    try {
      const r = await api("/gn/admin/roles", { method: "POST", body: { name, kind, designation: designation || null, partner_type: partnerType || null } });
      setNewOpen(false);
      await loadRoles();
      setSelId(r.id);
      setMsg(`Role "${r.name}" created — configure its permissions below.`);
    } catch (e: any) { setMsg("Create failed: " + e.message); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Roles & Permissions" sub="Configure exactly what each role can do — every change is enforced on the API and applied to the dashboards instantly" breadcrumb="Growth Nations / Settings / Roles & Permissions" />
      <div className="grid grid-cols-[260px_1fr] gap-4">
        {/* Role list */}
        <Card pad={false}>
          <div className="p-3 border-b border-zinc-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles…" className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-zinc-200 text-[12px] outline-none focus:border-brand-400" />
            </div>
            <button onClick={() => setNewOpen(true)} className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[11.5px] font-semibold hover:bg-brand-700">
              <Plus className="w-3.5 h-3.5" /> New Role
            </button>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            <div className="px-3 pt-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">Staff ({staff.length})</div>
            {staff.map((r) => <RoleRow key={r.id} r={r} active={r.id === selId} onSelect={() => setSelId(r.id)} />)}
            <div className="px-3 pt-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-400">Partners ({partners.length})</div>
            {partners.map((r) => <RoleRow key={r.id} r={r} active={r.id === selId} onSelect={() => setSelId(r.id)} />)}
            {!staff.length && !partners.length && <EmptyState title="No roles" sub="Create a role to get started" />}
          </div>
        </Card>

        {/* Permission grid */}
        <Card pad={false}>
          {!sel ? (
            <div className="p-8"><EmptyState title="Select a role" sub="Pick a role from the list to configure its permissions" /></div>
          ) : (
            <div>
              <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center"><Users className="w-4 h-4 text-brand-600" /></div>
                    <div>
                      <div className="text-[14px] font-bold text-zinc-800">{sel.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {sel.code} · {sel.kind === "partner" ? (sel.partner_type ?? "Partner") : (sel.designation ?? "Staff")} · {grantedCount()}/{GN_MODULES.length * GN_ACTIONS.length} permissions
                        {sel.is_system ? <span className="ml-1.5 text-[9.5px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">SYSTEM ROLE</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={applyToSimilar} disabled={saving} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border border-zinc-200 text-zinc-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Apply to {sel.kind === "partner" ? "Partner Type" : "Designation"}
                  </button>
                  <button onClick={() => save()} disabled={saving} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Permissions"}
                  </button>
                </div>
              </div>
              {msg && <div className={`px-3.5 py-2 text-[11.5px] font-semibold border-b ${msg.startsWith("Saved") || msg.startsWith("Applied") ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>{msg}</div>}
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[760px]">
                  <thead>
                    <tr className="text-left border-b border-zinc-100 bg-zinc-50/60">
                      <th className="px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Module</th>
                      {GN_ACTIONS.map((a) => (
                        <th key={a} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">{ACTION_LABELS[a]}</th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GN_MODULES.map((m) => {
                      const onCount = GN_ACTIONS.filter((a) => grid[m]?.[a]?.allowed).length;
                      return (
                        <tr key={m} className="border-b border-zinc-50 hover:bg-zinc-50/40">
                          <td className="px-3.5 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center"><ShieldCheck className="w-3 h-3 text-zinc-500" /></div>
                              <div>
                                <div className="text-[12.5px] font-semibold text-zinc-800">{m}</div>
                                <button onClick={() => toggleModule(m, onCount < GN_ACTIONS.length)} className="text-[10px] text-brand-600 hover:underline font-semibold">
                                  {onCount === GN_ACTIONS.length ? "Revoke all" : "Allow all"}
                                </button>
                              </div>
                            </div>
                          </td>
                          {GN_ACTIONS.map((a) => {
                            const cell = grid[m]?.[a] ?? { allowed: false, scope: "all" as const };
                            return (
                              <td key={a} className="px-2 py-2 text-center">
                                <button onClick={() => toggle(m, a)} title={gnPerm(m, a)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${cell.allowed ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-zinc-200 hover:border-brand-300"}`}>
                                  {cell.allowed && <Check className="w-3 h-3" />}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center">
                            <select
                              value={grid[m]?.[GN_ACTIONS[0]]?.scope ?? "all"}
                              onChange={(e) => { const s = e.target.value as "all" | "own"; for (const a of GN_ACTIONS) setScope(m, a, s); }}
                              className="text-[10.5px] border border-zinc-200 rounded-md px-1.5 py-1 text-zinc-600 outline-none focus:border-brand-400"
                            >
                              <option value="all">All Records</option>
                              <option value="own">Own Only</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10.5px] text-zinc-400 flex items-center gap-1.5"><CheckCheck className="w-3.5 h-3.5" /> Changes are enforced on every API request within seconds — no restart needed.</span>
                <button onClick={() => save()} disabled={saving} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">{saving ? "Saving…" : "Save Permissions"}</button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {newOpen && (
        <Modal open title="New Role" onClose={() => setNewOpen(false)}>
          <NewRoleForm onCancel={() => setNewOpen(false)} onCreate={createRole} />
        </Modal>
      )}
    </div>
  );
}

function RoleRow({ r, active, onSelect }: { r: any; active: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`w-full text-left px-3 py-2.5 border-b border-zinc-50 flex items-center gap-2.5 ${active ? "bg-brand-50/70" : "hover:bg-zinc-50"}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${r.kind === "partner" ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"}`}>
        {r.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-zinc-800 truncate">{r.name}</div>
        <div className="text-[10.5px] text-zinc-400 truncate">{r.kind === "partner" ? (r.partner_type ?? "Partner") : (r.designation ?? "Staff")}</div>
      </div>
      <Badge status=""><span className="text-[9.5px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full">{r.allowed_perms ?? 0}</span></Badge>
    </button>
  );
}

function NewRoleForm({ onCancel, onCreate }: { onCancel: () => void; onCreate: (name: string, kind: string, designation: string, partnerType: string) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"staff" | "partner">("staff");
  const [designation, setDesignation] = useState("");
  const [partnerType, setPartnerType] = useState("");
  return (
    <div className="space-y-3">
      <Field label="Role name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lead Generator" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:border-brand-400" /></Field>
      <Field label="Type">
        <div className="flex gap-2">
          {(["staff", "partner"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize ${kind === k ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-600"}`}>{k}</button>
          ))}
        </div>
      </Field>
      {kind === "staff" ? (
        <Field label="Designation"><input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Sales, Credit, Operations" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:border-brand-400" /></Field>
      ) : (
        <Field label="Partner type"><input value={partnerType} onChange={(e) => setPartnerType(e.target.value)} placeholder="e.g. DSA, Master DSA, Connector" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:border-brand-400" /></Field>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-zinc-200 text-zinc-600">Cancel</button>
        <button onClick={() => name.trim() && onCreate(name.trim(), kind, designation, partnerType)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-brand-600 text-white">Create Role</button>
      </div>
    </div>
  );
}
