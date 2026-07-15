import { hasUsableAuditReport, isTerminalAuditStatus } from './audit-time';
import type { ResourceAuditLiveData } from './resource-types';

export const FINAL_REPORT_RETRY_DELAYS_MS = [250, 500, 1_000, 2_000, 3_000] as const;

const emptyLiveData = (): ResourceAuditLiveData => ({
  audit: null,
  latestEvents: [],
  latestPages: [],
  latestIssues: [],
  finalReport: null,
});

export function createEmptyAuditLiveData() {
  return emptyLiveData();
}

export function mergeAuditLiveData(
  current: ResourceAuditLiveData,
  incoming: ResourceAuditLiveData,
): ResourceAuditLiveData {
  if (current.audit && incoming.audit && current.audit.id !== incoming.audit.id) {
    return incoming;
  }

  const currentAudit = current.audit;
  const incomingAudit = incoming.audit;
  const audit = (() => {
    if (!currentAudit) return incomingAudit;
    if (!incomingAudit) return currentAudit;
    if (isTerminalAuditStatus(currentAudit.status) && !isTerminalAuditStatus(incomingAudit.status)) {
      return currentAudit;
    }
    return {
      ...incomingAudit,
      progress: Math.max(currentAudit.progress || 0, incomingAudit.progress || 0),
      pagesDiscovered: Math.max(currentAudit.pagesDiscovered || 0, incomingAudit.pagesDiscovered || 0),
      pagesCrawled: Math.max(currentAudit.pagesCrawled || 0, incomingAudit.pagesCrawled || 0),
      checksCompleted: Math.max(currentAudit.checksCompleted || 0, incomingAudit.checksCompleted || 0),
      issuesFound: Math.max(currentAudit.issuesFound || 0, incomingAudit.issuesFound || 0),
    };
  })();

  return {
    audit,
    latestEvents: incoming.latestEvents.length ? incoming.latestEvents : current.latestEvents,
    latestPages: incoming.latestPages.length ? incoming.latestPages : current.latestPages,
    latestIssues: incoming.latestIssues.length ? incoming.latestIssues : current.latestIssues,
    finalReport: incoming.finalReport ?? current.finalReport ?? null,
  };
}

export function isFinalReportPending(data: ResourceAuditLiveData) {
  return hasUsableAuditReport(data.audit?.status) && !data.finalReport;
}

export interface FinalReportRetryResult {
  data: ResourceAuditLiveData;
  attempts: number;
  exhausted: boolean;
}

interface FinalReportRetryOptions {
  delays?: readonly number[];
  isActive?: () => boolean;
  onSnapshot?: (data: ResourceAuditLiveData) => void;
  wait?: (delayMs: number) => Promise<void>;
}

const waitFor = (delayMs: number) => new Promise<void>((resolve) => {
  globalThis.setTimeout(resolve, delayMs);
});

export async function waitForPersistedFinalReport(
  initialData: ResourceAuditLiveData,
  loadSnapshot: () => Promise<ResourceAuditLiveData>,
  options: FinalReportRetryOptions = {},
): Promise<FinalReportRetryResult> {
  const delays = options.delays ?? FINAL_REPORT_RETRY_DELAYS_MS;
  const isActive = options.isActive ?? (() => true);
  const wait = options.wait ?? waitFor;
  let data = initialData;
  let attempts = 0;

  for (const delayMs of delays) {
    if (!isActive() || !isFinalReportPending(data)) break;
    await wait(delayMs);
    if (!isActive()) break;

    attempts += 1;
    try {
      data = mergeAuditLiveData(data, await loadSnapshot());
      options.onSnapshot?.(data);
    } catch {
      // Persistence can briefly lag the terminal audit update. Retry within the bounded schedule.
    }
  }

  return {
    data,
    attempts,
    exhausted: isFinalReportPending(data),
  };
}
