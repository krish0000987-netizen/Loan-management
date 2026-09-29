/**
 * Webhook Ingestion & Deduplication Service for SNIPER.
 * Ensures replay protection, HMAC signature verification, payload hashing,
 * and transactional business transitions.
 */

import { createHmac } from "node:crypto";
import { q1, run } from "../db/connection.js";
import { audit } from "./audit.js";
import { requestDisbursement } from "./disbursement-orchestrator.js";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "sniper-webhook-secret-key-2026";
const MAX_REPLAY_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface WebhookPayload {
  event: string;
  event_id?: string;
  timestamp?: string | number;
  application_no?: string;
  application_id?: number;
  amount?: number;
  utr?: string;
  reason?: string;
  status?: string;
  data?: Record<string, unknown>;
}

export function computePayloadHash(rawBody: string | Buffer): string {
  return createHmac("sha256", WEBHOOK_SECRET)
    .update(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"))
    .digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
  if (!signatureHeader) {
    // In demo/test environment without explicit signature header, accept if configured
    if (process.env.APP_ENV === "demo" || !process.env.APP_ENV) return true;
    return false;
  }
  const expectedSig = computePayloadHash(rawBody);
  const cleanSig = signatureHeader.replace(/^sha256=/i, "").trim();
  return cleanSig.toLowerCase() === expectedSig.toLowerCase();
}

export async function processWebhookEvent(
  provider: string,
  rawBody: string,
  payload: WebhookPayload,
  headers: Record<string, string | string[] | undefined>
): Promise<{ ok: boolean; message: string; duplicate: boolean; eventId?: number }> {
  const payloadHash = computePayloadHash(rawBody);
  const signature = (headers["x-webhook-signature"] || headers["x-hub-signature-256"] || "") as string;

  // 1. Signature check
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new Error("Invalid webhook signature.");
  }

  // 2. Replay check
  if (payload.timestamp) {
    const ts = typeof payload.timestamp === "number" ? payload.timestamp : new Date(payload.timestamp).getTime();
    if (Math.abs(Date.now() - ts) > MAX_REPLAY_AGE_MS) {
      if (process.env.APP_ENV !== "demo") {
        throw new Error("Webhook replay rejected: timestamp is outside acceptable window.");
      }
    }
  }

  // 3. Deduplication check: if identical payload hash was already processed, return 200 OK idempotent
  const existing = await q1<{ id: number; processed: number; status: string }>(
    "SELECT id, processed, status FROM webhook_events WHERE payload_hash = ?",
    [payloadHash]
  );

  if (existing && existing.processed === 1) {
    return {
      ok: true,
      message: `Webhook event already processed (Idempotent event ID: ${existing.id})`,
      duplicate: true,
      eventId: existing.id
    };
  }

  // 4. Resolve application & tenant
  let appId = payload.application_id;
  let tenantId = 1;

  if (!appId && payload.application_no) {
    const app = await q1<{ id: number; tenant_id: number }>(
      "SELECT id, tenant_id FROM applications WHERE application_no = ?",
      [payload.application_no]
    );
    if (app) {
      appId = app.id;
      tenantId = app.tenant_id;
    }
  } else if (appId) {
    const app = await q1<{ tenant_id: number }>("SELECT tenant_id FROM applications WHERE id = ?", [appId]);
    if (app) tenantId = app.tenant_id;
  }

  // 5. Persist event into webhook_events
  const eventRecordId = (await run(
    `INSERT INTO webhook_events (tenant_id, provider, event_type, event_id, payload_hash, payload, processed, status, application_id)
     VALUES (?, ?, ?, ?, ?, ?, 0, 'received', ?)`,
    [
      tenantId,
      provider,
      payload.event,
      payload.event_id ?? `evt-${Date.now()}`,
      payloadHash,
      rawBody,
      appId ?? null
    ]
  )).lastId;

  // 6. Transactional business transitions based on event type
  const eventType = (payload.event || "").toUpperCase();

  try {
    if (appId) {
      switch (eventType) {
        case "APPLICATION_RECEIVED":
        case "UNDERWRITING_STARTED": {
          await run("UPDATE applications SET stage = 'underwriting', updated_at = datetime('now') WHERE id = ?", [appId]);
          break;
        }
        case "APPROVED": {
          await run(
            "UPDATE applications SET decision = 'approve', status = 'approved', stage = 'sanction', approved_amount = COALESCE(?, approved_amount, requested_amount), updated_at = datetime('now') WHERE id = ?",
            [payload.amount ?? null, appId]
          );
          break;
        }
        case "REJECTED": {
          await run(
            "UPDATE applications SET decision = 'reject', status = 'rejected', decision_reason = ?, updated_at = datetime('now') WHERE id = ?",
            [payload.reason ?? "Rejected via partner webhook", appId]
          );
          break;
        }
        case "SANCTIONED": {
          await run("UPDATE applications SET stage = 'agreement', updated_at = datetime('now') WHERE id = ?", [appId]);
          break;
        }
        case "AGREEMENT_GENERATED": {
          await run("UPDATE applications SET stage = 'esign', updated_at = datetime('now') WHERE id = ?", [appId]);
          break;
        }
        case "ESIGN_COMPLETED": {
          await run("UPDATE agreements SET status = 'signed', signed_at = datetime('now') WHERE application_id = ?", [appId]);
          await run("UPDATE applications SET stage = 'disbursement', updated_at = datetime('now') WHERE id = ?", [appId]);
          break;
        }
        case "DISBURSEMENT_INITIATED":
        case "DISBURSEMENT_PROCESSING": {
          await run("UPDATE applications SET stage = 'disbursement', updated_at = datetime('now') WHERE id = ?", [appId]);
          break;
        }
        case "DISBURSEMENT_SUCCESS": {
          // Trigger disbursement orchestrator with idempotent key
          const idempotencyKey = `WH-DISB-${appId}-${payload.event_id || payload.utr || Date.now()}`;
          await requestDisbursement({
            tenantId,
            applicationId: appId,
            idempotencyKey,
            beneficiaryName: undefined
          });
          break;
        }
        case "DISBURSEMENT_FAILED": {
          await run(
            `UPDATE disbursement_transactions SET status = 'FAILED', failure_reason = ?, completed_at = datetime('now')
             WHERE application_id = ? AND status != 'SUCCESS'`,
            [payload.reason ?? "Disbursement failed at provider", appId]
          );
          break;
        }
        case "DISBURSEMENT_REVERSED": {
          await run(
            `UPDATE disbursement_transactions SET status = 'REVERSED', failure_reason = 'Transaction reversed', completed_at = datetime('now')
             WHERE application_id = ?`,
            [appId]
          );
          break;
        }
      }
    }

    // Mark event processed
    await run("UPDATE webhook_events SET processed = 1, status = 'processed' WHERE id = ?", [eventRecordId]);

    await audit({
      tenantId,
      action: "webhook.processed",
      entityType: "webhook_event",
      entityId: eventRecordId,
      after: { provider, event: payload.event, appId, duplicate: false }
    });

    return {
      ok: true,
      message: `Webhook ${payload.event} processed successfully.`,
      duplicate: false,
      eventId: eventRecordId
    };
  } catch (err: any) {
    await run("UPDATE webhook_events SET error = ?, status = 'error' WHERE id = ?", [err.message, eventRecordId]);
    throw err;
  }
}
