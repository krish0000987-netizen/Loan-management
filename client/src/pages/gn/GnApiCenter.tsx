import { useCallback, useEffect, useState } from "react";
import { Card, PageHeader, Badge, Field, Modal, EmptyState } from "../../components/ui";
import { api, fmtDate } from "../../lib/api";
import { RefreshCw, Plug2, Zap, Webhook, RotateCcw } from "lucide-react";

const STATUS_TONES: Record<string, string> = {
  demo_connected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sandbox_ready: "border-sky-200 bg-sky-50 text-sky-700",
  not_connected: "border-zinc-200 bg-zinc-100 text-zinc-500"
};

const EVENT_OPTIONS = [
  "APPLICATION_SUBMITTED", "UNDERWRITING_STARTED", "DOCUMENT_REQUIRED", "APPROVED", "REJECTED",
  "AGREEMENT_COMPLETED", "DISBURSEMENT_INITIATED", "DISBURSEMENT_COMPLETED", "DISBURSEMENT_FAILED", "PAYOUT_RECEIVED"
];

export function GnApiCenter() {
  const [providers, setProviders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any>(null);
  const [configure, setConfigure] = useState<any>(null);
  const [cfg, setCfg] = useState<any>({ endpoint: "", status: "sandbox_ready", env: "demo", enabled: true });
  const [whForm, setWhForm] = useState<any>({ event: "APPROVED", app_ref: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    api("/gn/api/providers").then(setProviders).catch(() => {});
    api("/gn/api/logs").then(setLogs).catch(() => {});
    api("/gn/api/webhooks").then(setWebhooks).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<any>, label = "action") => {
    setBusy(true); setMsg(null);
    try { const r = await fn(); load(); return r; }
    catch (e: any) { setMsg(e.message ?? `${label} failed`); return null; }
    finally { setBusy(false); }
  };

  const testProvider = (p: any) => run(() => api(`/gn/api/providers/${p.id}/test`, { method: "POST", body: {} }), "test");

  const saveConfig = async () => {
    const r = await run(() => api(`/gn/api/providers/${configure.id}`, { method: "PATCH", body: { endpoint: cfg.endpoint || undefined, status: cfg.status, env: cfg.env, enabled: cfg.enabled } }), "save");
    if (r) setConfigure(null);
  };

  const simulateWebhook = async () => {
    const r = await run(() => api("/gn/api/webhooks", { method: "POST", body: whForm }), "webhook");
    if (r) setMsg(r.duplicate ? "Duplicate event ignored (idempotency ✓)" : `Webhook ${whForm.event} processed → ${r.status}`);
  };

  const retryWebhook = (id: number) => run(() => api(`/gn/api/webhooks/${id}/retry`, { method: "POST", body: {} }), "retry");

  return (
    <div className="space-y-5">
      <PageHeader
        title="API Integration Center"
        sub="Provider abstraction ready for real KYC, credit, lender, eSign and disbursement APIs — demo providers are clearly labelled"
        breadcrumb="Growth Nations / Command Center / API Center"
        actions={<button className="btn btn-secondary text-[12px]" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</button>}
      />

      {msg && <div className="text-[12px] font-semibold text-emerald-600">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center"><Plug2 className="w-4 h-4 text-brand-600" /></div>
                <div>
                  <div className="text-[12.5px] font-bold text-zinc-800">{p.name}</div>
                  <div className="text-[10px] text-zinc-400 uppercase">{p.category}</div>
                </div>
              </div>
              <Badge status={p.status}>{p.status?.replace(/_/g, " ")}</Badge>
            </div>
            <div className="text-[10.5px] text-zinc-400 mt-2.5 truncate">{p.endpoint ?? "No endpoint configured"}</div>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
              <Badge status={p.env}>{p.env}</Badge>
              <span>{p.enabled ? "Enabled" : "Disabled"}</span>
              <span>· Last tested: {p.last_tested_at ? fmtDate(p.last_tested_at) : "never"}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn btn-secondary text-[11px] flex-1" onClick={() => { setConfigure(p); setCfg({ endpoint: p.endpoint ?? "", status: p.status, env: p.env, enabled: !!p.enabled }); }}>Configure</button>
              <button className="btn btn-secondary text-[11px] flex-1" onClick={() => testProvider(p)} disabled={busy}><Zap className="w-3 h-3 mr-1" />Test</button>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-zinc-800">API Activity Logs</div>
              <div className="text-[10.5px] text-zinc-400">Every provider call recorded — request ID, latency, response, environment</div>
            </div>
            <div className="flex gap-2 text-[10.5px] font-semibold">
              <span className="text-emerald-600">{logs?.counts?.success ?? 0} success</span>
              <span className="text-rose-600">{logs?.counts?.failed ?? 0} failed</span>
              <span className="text-amber-600">{logs?.counts?.retrying ?? 0} retrying</span>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {logs?.rows?.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between px-4 py-2 border-b border-zinc-50 text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge status={l.status}>{l.status}</Badge>
                  <span className="font-semibold text-zinc-700 truncate">{l.provider} · {l.action}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400 shrink-0">
                  <span>{l.latency_ms}ms</span><span>{l.environment}</span><span>{fmtDate(l.created_at)}</span>
                </div>
              </div>
            ))}
            {!logs?.rows?.length && <div className="p-6"><EmptyState title="No API activity yet" sub="Test a provider connection to generate logs" /></div>}
          </div>
        </Card>

        <Card pad={false}>
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-zinc-800">Webhook Events</div>
              <div className="text-[10.5px] text-zinc-400">Lender webhooks — idempotent, per-application, retryable (mock)</div>
            </div>
            <Webhook className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="p-3 border-b border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="input text-[11.5px]" value={whForm.event} onChange={(e) => setWhForm({ ...whForm, event: e.target.value })}>
              {EVENT_OPTIONS.map((e) => <option key={e}>{e}</option>)}
            </select>
            <input className="input text-[11.5px]" placeholder="Application ref (e.g. GN-2026-10025)" value={whForm.app_ref} onChange={(e) => setWhForm({ ...whForm, app_ref: e.target.value })} />
            <button className="btn btn-primary text-[11.5px]" disabled={busy} onClick={simulateWebhook}><Zap className="w-3 h-3 mr-1" />Simulate Webhook</button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {webhooks?.rows?.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-2 border-b border-zinc-50 text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge status={w.status}>{w.status}</Badge>
                  <span className="font-semibold text-zinc-700">{w.event}</span>
                  <span className="text-zinc-400 truncate">{w.app_ref ?? `app #${w.app_id}`}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-zinc-400">{w.provider} · {fmtDate(w.created_at)}</span>
                  {w.status !== "processed" && w.status !== "failed" && <button className="btn btn-secondary text-[10px]" onClick={() => retryWebhook(w.id)}><RotateCcw className="w-3 h-3 mr-1" />Retry</button>}
                </div>
              </div>
            ))}
            {!webhooks?.rows?.length && <div className="p-6"><EmptyState title="No webhook events" sub="Simulate an event above" /></div>}
          </div>
        </Card>
      </div>

      <Modal open={!!configure} onClose={() => setConfigure(null)} title={configure ? `Configure — ${configure.name}` : ""}>
        <div className="space-y-4">
          <Field label="Endpoint URL"><input className="input text-[12.5px]" value={cfg.endpoint} onChange={(e) => setCfg({ ...cfg, endpoint: e.target.value })} placeholder="https://api.provider.example/v1" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Environment">
              <select className="input text-[12.5px]" value={cfg.env} onChange={(e) => setCfg({ ...cfg, env: e.target.value })}>{["demo", "sandbox", "production"].map((e) => <option key={e}>{e}</option>)}</select>
            </Field>
            <Field label="Status">
              <select className="input text-[12.5px]" value={cfg.status} onChange={(e) => setCfg({ ...cfg, status: e.target.value })}>{["demo_connected", "sandbox_ready", "not_connected"].map((e) => <option key={e}>{e}</option>)}</select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-zinc-700"><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Enabled</label>
          <div className="text-[10.5px] text-zinc-400">Secrets are never stored in the frontend — production credentials belong in the server environment / secrets manager.</div>
          <button className="btn btn-primary text-[12px]" disabled={busy} onClick={saveConfig}>Save Configuration</button>
        </div>
      </Modal>
    </div>
  );
}
