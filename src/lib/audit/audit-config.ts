export type AuditMode = 'quick' | 'standard' | 'deep';

export interface AuditModeConfig {
  mode: AuditMode;
  label: string;
  pageLimit: number;
  concurrency: number;
  timeoutMs: number;
  description: string;
}

const AUDIT_MODE_CONFIG: Record<AuditMode, AuditModeConfig> = {
  quick: {
    mode: 'quick',
    label: 'Free Quick - 5 pages',
    pageLimit: 5,
    concurrency: 2,
    timeoutMs: 6000,
    description: 'Default resource-light audit for fast feedback.',
  },
  standard: {
    mode: 'standard',
    label: 'Full Standard - 25 pages',
    pageLimit: 25,
    concurrency: 3,
    timeoutMs: 8000,
    description: 'Balanced crawl depth and resource use.',
  },
  deep: {
    mode: 'deep',
    label: 'Deep - 75+ pages',
    pageLimit: 75,
    concurrency: 4,
    timeoutMs: 12000,
    description: 'Manual opt-in audit for expanded sitemap, crawl graph, page-level, and issue clustering coverage.',
  },
};

export const AUDIT_LIMITS = {
  maxEvents: 300,
  maxIssues: 1000,
  lockLeaseMs: 5 * 60 * 1000,
  staleLockRecoveryMs: 5 * 60 * 1000,
  defaultExpiresInDays: 30,
  workerPollIntervalMs: 4000,
  livePollIntervalMs: 2000,
  noWorkerWarningMs: 20000,
};

export function getAuditModeConfig(mode: unknown): AuditModeConfig {
  if (mode === 'standard' || mode === 'deep') {
    return AUDIT_MODE_CONFIG[mode];
  }
  return AUDIT_MODE_CONFIG.quick;
}

export function getAuditModeLabel(mode: unknown) {
  return getAuditModeConfig(mode).label;
}
