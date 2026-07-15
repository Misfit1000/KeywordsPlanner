import type { AuditMode } from '../lib/audit/audit-config';

const AUDIT_JOB_TYPES = new Set<AuditMode>(['quick', 'standard', 'deep']);

export function isAuditJobType(value: unknown): value is AuditMode {
  return typeof value === 'string' && AUDIT_JOB_TYPES.has(value as AuditMode);
}

export function supportedAuditJobTypes() {
  return [...AUDIT_JOB_TYPES];
}
