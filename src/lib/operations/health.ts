import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type OperationalStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface OperationalHealthSummary {
  status: OperationalStatus;
  reasons: string[];
  applicationCommit: string;
  workerCommit: string | null;
  apiSchemaVersion: number;
  databaseSchemaVersion: number | null;
  auditEngineVersion: string;
  scoringVersion: string;
  workerOnline: boolean;
  lastWorkerHeartbeat: string | null;
  activeWorkerCount: number;
  queuedAuditCount: number;
  oldestQueuedAgeSeconds: number | null;
  runningAuditCount: number;
  staleLeaseCount: number;
  recentFailedAuditCount: number;
  recentCompletionRate: number | null;
  medianAuditDurationMs: number | null;
  realtimeFallbackCount: number;
  commitMismatch: boolean;
  schemaMismatch: boolean;
  deepAuditEnabled: boolean;
  publicPlanLimits: unknown[];
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function commitsMatch(left?: string | null, right?: string | null) {
  if (!left || !right || left === 'local' || right === 'local') return true;
  return left.startsWith(right) || right.startsWith(left);
}

export function buildOperationalHealth(input: {
  audits: any[];
  workers: any[];
  plans: any[];
  compatibility: any;
  nowMs?: number;
}): OperationalHealthSummary {
  const nowMs = input.nowMs ?? Date.now();
  const expected = input.compatibility?.expected || {};
  const database = input.compatibility?.database || null;
  const workerRows = input.workers.map((row) => ({ ...row.value, updatedAt: row.updated_at || row.value?.lastSeenAt || null }));
  const liveWorkers = workerRows.filter((worker) => {
    const seen = new Date(worker.updatedAt || 0).getTime();
    return Number.isFinite(seen) && nowMs - seen <= 2 * 60 * 1000 && worker.databaseConnected !== false;
  });
  const latestWorker = workerRows[0] || input.compatibility?.worker || null;
  const queued = input.audits.filter((row) => row.status === 'queued');
  const running = input.audits.filter((row) => row.status === 'running');
  const terminal = input.audits.filter((row) => ['completed', 'completed_with_warnings', 'failed', 'abandoned'].includes(row.status));
  const completed = terminal.filter((row) => ['completed', 'completed_with_warnings'].includes(row.status));
  const failed = terminal.filter((row) => ['failed', 'abandoned'].includes(row.status));
  const oldestQueuedAt = queued.map((row) => new Date(row.created_at).getTime()).filter(Number.isFinite).sort((a, b) => a - b)[0];
  const durations = completed
    .map((row) => row.started_at && row.completed_at ? new Date(row.completed_at).getTime() - new Date(row.started_at).getTime() : 0)
    .filter((value) => value > 0);
  const staleLeaseCount = running.filter((row) => row.lease_expires_at && new Date(row.lease_expires_at).getTime() < nowMs).length;
  const workerCommit = latestWorker?.commitIdentifier || null;
  const commitMismatch = !commitsMatch(expected.commitIdentifier, workerCommit);
  const databaseSchemaVersion = database ? Number(database.api_schema_version || 0) : null;
  const schemaMismatch = databaseSchemaVersion == null || databaseSchemaVersion < Number(expected.apiSchemaVersion || 0);
  const oldestQueuedAgeSeconds = oldestQueuedAt ? Math.max(0, Math.round((nowMs - oldestQueuedAt) / 1000)) : null;
  const completionRate = terminal.length ? completed.length / terminal.length : null;
  const reasons: string[] = [];
  let status: OperationalStatus = 'healthy';
  const degrade = (reason: string) => { reasons.push(reason); if (status === 'healthy') status = 'degraded'; };
  const critical = (reason: string) => { reasons.push(reason); status = 'critical'; };

  if (!workerRows.length) critical('No audit-engine heartbeat has been recorded.');
  else if (!liveWorkers.length) critical('No healthy audit-engine heartbeat was received in the last two minutes.');
  if (oldestQueuedAgeSeconds != null && oldestQueuedAgeSeconds > 15 * 60) critical('The oldest queued audit has waited more than 15 minutes.');
  else if (oldestQueuedAgeSeconds != null && oldestQueuedAgeSeconds > 5 * 60) degrade('The oldest queued audit has waited more than five minutes.');
  if (staleLeaseCount) degrade(`${staleLeaseCount} audit lease(s) are stale.`);
  if (commitMismatch) degrade('Application and audit-engine commits do not match.');
  if (schemaMismatch) critical('The database has not applied the latest additive schema migration.');
  if (terminal.length >= 5 && completionRate != null && completionRate < 0.5) critical('Less than half of recent terminal audits completed successfully.');
  else if (terminal.length >= 5 && completionRate != null && completionRate < 0.75) degrade('Recent audit completion rate is below 75%.');

  return {
    status,
    reasons,
    applicationCommit: String(expected.commitIdentifier || 'unknown'),
    workerCommit,
    apiSchemaVersion: Number(expected.apiSchemaVersion || 0),
    databaseSchemaVersion,
    auditEngineVersion: String(expected.auditEngineVersion || 'unknown'),
    scoringVersion: String(expected.scoringVersion || 'unknown'),
    workerOnline: liveWorkers.length > 0,
    lastWorkerHeartbeat: workerRows[0]?.updatedAt || null,
    activeWorkerCount: liveWorkers.length,
    queuedAuditCount: queued.length,
    oldestQueuedAgeSeconds,
    runningAuditCount: running.length,
    staleLeaseCount,
    recentFailedAuditCount: failed.length,
    recentCompletionRate: completionRate,
    medianAuditDurationMs: median(durations),
    realtimeFallbackCount: input.audits.filter((row) => row.used_http_fallback).length,
    commitMismatch,
    schemaMismatch,
    deepAuditEnabled: liveWorkers.some((worker) => worker.deepAuditEnabled === true),
    publicPlanLimits: input.plans,
  };
}

export function buildSafeAlertPayload(summary: OperationalHealthSummary) {
  return {
    product: 'Crawlio',
    status: summary.status,
    reasons: summary.reasons.slice(0, 8),
    applicationCommit: summary.applicationCommit,
    workerCommit: summary.workerCommit,
    apiSchemaVersion: summary.apiSchemaVersion,
    databaseSchemaVersion: summary.databaseSchemaVersion,
    workerOnline: summary.workerOnline,
    queuedAuditCount: summary.queuedAuditCount,
    oldestQueuedAgeSeconds: summary.oldestQueuedAgeSeconds,
    staleLeaseCount: summary.staleLeaseCount,
    recentCompletionRate: summary.recentCompletionRate,
    observedAt: new Date().toISOString(),
  };
}

export function alertFingerprint(payload: ReturnType<typeof buildSafeAlertPayload>) {
  const stable = { ...payload, observedAt: undefined };
  return createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

export function shouldSendOperationalAlert(input: { enabled: boolean; status: OperationalStatus; fingerprint: string; previousFingerprint?: string | null; lastSentAt?: string | null; cooldownMinutes: number; nowMs?: number }) {
  if (!input.enabled || !['degraded', 'critical'].includes(input.status)) return false;
  if (input.fingerprint === input.previousFingerprint) return false;
  const lastSent = input.lastSentAt ? new Date(input.lastSentAt).getTime() : 0;
  return !lastSent || (input.nowMs ?? Date.now()) - lastSent >= input.cooldownMinutes * 60_000;
}

export async function maybeSendOperationalAlert(summary: OperationalHealthSummary, client: SupabaseClient) {
  const enabled = process.env.OPERATIONS_ALERTS_ENABLED === 'true';
  const webhook = String(process.env.OPERATIONS_ALERT_WEBHOOK_URL || '');
  const cooldownMinutes = Math.max(5, Math.min(1440, Number(process.env.OPERATIONS_ALERT_COOLDOWN_MINUTES || 60)));
  let webhookUrl: URL | null = null;
  try { webhookUrl = new URL(webhook); } catch {}
  if (!enabled || !webhookUrl || webhookUrl.protocol !== 'https:') return { enabled, sent: false, reason: 'disabled' };

  const payload = buildSafeAlertPayload(summary);
  const fingerprint = alertFingerprint(payload);
  const key = 'platform-health';
  const { data: previous } = await client.from('operations_alert_state').select('fingerprint,last_sent_at').eq('alert_key', key).maybeSingle();
  const send = shouldSendOperationalAlert({ enabled, status: summary.status, fingerprint, previousFingerprint: previous?.fingerprint, lastSentAt: previous?.last_sent_at, cooldownMinutes });
  const now = new Date().toISOString();
  if (send) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { enabled: true, sent: false, reason: `webhook_http_${response.status}` };
  }
  await client.from('operations_alert_state').upsert({
    alert_key: key,
    status: summary.status,
    fingerprint,
    last_evaluated_at: now,
    last_sent_at: send ? now : previous?.last_sent_at || null,
    safe_summary: payload,
  }, { onConflict: 'alert_key' });
  return { enabled: true, sent: send, reason: send ? 'sent' : 'deduplicated_or_healthy' };
}
