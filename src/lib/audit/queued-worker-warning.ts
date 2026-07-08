import { AUDIT_LIMITS } from './audit-config';
import type { ResourceAuditDocument } from './resource-types';

export function isAuditQueuedTooLong(
  audit: Pick<ResourceAuditDocument, 'status' | 'createdAt'> | null | undefined,
  nowMs = Date.now(),
  thresholdMs = AUDIT_LIMITS.noWorkerWarningMs,
) {
  if (!audit || audit.status !== 'queued') return false;
  const createdMs = new Date(audit.createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return nowMs - createdMs > thresholdMs;
}
