import { createHash } from 'node:crypto';

export const ADMIN_PAGE_SIZE_MAX = 50;
export const ADMIN_BULK_AUDIT_MAX = 25;
export const RETENTION_CONFIRMATION = 'APPLY RETENTION';
export const RETENTION_PREVIEW_TTL_MS = 10 * 60 * 1000;

export type AdminUserRole = 'user' | 'support' | 'admin';
export type AdminAuditBulkAction = 'cancel' | 'retry' | 'recover_stale' | 'priority';

export function boundedPageSize(value: unknown, fallback = 25) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(ADMIN_PAGE_SIZE_MAX, Math.floor(parsed)));
}

export function encodeAdminCursor(createdAt: string, id: string) {
  return Buffer.from(JSON.stringify({ createdAt, id }), 'utf8').toString('base64url');
}

export function decodeAdminCursor(value: unknown): { createdAt: string; id: string } | null {
  if (typeof value !== 'string' || !value || value.length > 500) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      typeof decoded?.createdAt !== 'string'
      || Number.isNaN(new Date(decoded.createdAt).getTime())
      || !/^[0-9a-f-]{36}$/i.test(String(decoded.id || ''))
    ) return null;
    return { createdAt: decoded.createdAt, id: decoded.id };
  } catch {
    return null;
  }
}

export function getUserActionGuard(input: {
  actorId: string;
  targetId: string;
  targetRole: AdminUserRole;
  activeAdminCount: number;
  action: 'suspend' | 'restore' | 'update_access' | 'process_deletion';
  nextRole?: AdminUserRole;
}) {
  const removesAdminAccess = input.action === 'suspend'
    || input.action === 'process_deletion'
    || (input.action === 'update_access' && input.targetRole === 'admin' && input.nextRole !== undefined && input.nextRole !== 'admin');

  if (input.actorId === input.targetId && (removesAdminAccess || input.action === 'suspend')) {
    return { allowed: false, code: 'ADMIN_SELF_PROTECTION', message: 'Administrators cannot remove or suspend their own access.' };
  }
  if (input.targetRole === 'admin' && removesAdminAccess && input.activeAdminCount <= 1) {
    return { allowed: false, code: 'LAST_ADMIN_PROTECTION', message: 'The last active administrator cannot be removed or suspended.' };
  }
  return { allowed: true as const };
}

export function validateBulkAuditSelection(ids: unknown) {
  if (!Array.isArray(ids) || ids.length < 1) {
    return { valid: false, code: 'AUDIT_SELECTION_REQUIRED', message: 'Select at least one audit.' };
  }
  const normalized = [...new Set(ids.map((id) => String(id || '').trim()))];
  if (normalized.length > ADMIN_BULK_AUDIT_MAX) {
    return { valid: false, code: 'AUDIT_SELECTION_TOO_LARGE', message: `Select no more than ${ADMIN_BULK_AUDIT_MAX} audits.` };
  }
  if (normalized.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) {
    return { valid: false, code: 'INVALID_AUDIT_ID', message: 'One or more audit identifiers are invalid.' };
  }
  return { valid: true as const, ids: normalized };
}

export function canApplyAuditAction(status: string, action: AdminAuditBulkAction, leaseExpiresAt?: string | null) {
  if (action === 'cancel') return status === 'queued' || status === 'running';
  if (action === 'retry') return ['failed', 'cancelled', 'abandoned'].includes(status);
  if (action === 'recover_stale') {
    return status === 'running'
      && Boolean(leaseExpiresAt)
      && new Date(String(leaseExpiresAt)).getTime() < Date.now();
  }
  return ['queued', 'running'].includes(status);
}

export function escapeCsvCell(value: unknown) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(formulaSafe) ? `"${formulaSafe.replace(/"/g, '""')}"` : formulaSafe;
}

export function rowsToCsv(rows: Array<Record<string, unknown>>, columns: string[]) {
  return [
    columns.map(escapeCsvCell).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(',')),
  ].join('\r\n');
}

const ADMIN_RESOURCE_HOSTS = [
  'supabase.com',
  'vercel.com',
  'render.com',
  'sentry.io',
  'github.com',
] as const;

export function normalizeAdminResourceLink(value: unknown) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const allowed = ADMIN_RESOURCE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    const sensitiveQueryName = /(?:token|key|secret|auth|password|signature|code)/i;
    if ([...url.searchParams.keys()].some((key) => sensitiveQueryName.test(key))) return null;
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeAdminResourceLinks(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const supported = ['supabase', 'vercel', 'render', 'sentry', 'github'] as const;
  const result: Partial<Record<(typeof supported)[number], string>> = {};
  for (const key of supported) {
    const normalized = normalizeAdminResourceLink((value as Record<string, unknown>)[key]);
    if (normalized === null) return null;
    if (normalized) result[key] = normalized;
  }
  return result;
}

export function retentionFingerprint(preview: unknown, adminUserId: string, createdAt: string) {
  return createHash('sha256')
    .update(JSON.stringify({ preview, adminUserId, createdAt }))
    .digest('hex');
}

export function retentionPreviewIsUsable(input: {
  expiresAt: string;
  appliedAt?: string | null;
  expectedFingerprint: string;
  suppliedFingerprint: string;
  confirmation: string;
  reason: string;
}) {
  if (input.appliedAt) return { valid: false, code: 'RETENTION_PREVIEW_ALREADY_USED', message: 'This retention preview has already been applied.' };
  if (new Date(input.expiresAt).getTime() <= Date.now()) return { valid: false, code: 'RETENTION_PREVIEW_EXPIRED', message: 'This retention preview has expired. Create a new preview.' };
  if (input.expectedFingerprint !== input.suppliedFingerprint) return { valid: false, code: 'RETENTION_PREVIEW_MISMATCH', message: 'The retention preview no longer matches.' };
  if (input.confirmation !== RETENTION_CONFIRMATION) return { valid: false, code: 'RETENTION_CONFIRMATION_REQUIRED', message: `Type ${RETENTION_CONFIRMATION} to continue.` };
  if (input.reason.trim().length < 4) return { valid: false, code: 'ADMIN_REASON_REQUIRED', message: 'Provide a reason with at least four characters.' };
  return { valid: true as const };
}
