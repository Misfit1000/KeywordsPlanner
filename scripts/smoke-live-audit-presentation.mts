import assert from 'node:assert/strict';
import { deriveAuditLivePresentation } from '../src/lib/audit/audit-live-presentation.ts';
import { mergeAuditLiveData } from '../src/lib/audit/audit-lifecycle.ts';
import { describeCrawlCompletion } from '../src/lib/audit/audit-coverage.ts';
import type { AuditStatus, ResourceAuditDocument, ResourceAuditEvent } from '../src/lib/audit/resource-types.ts';

const now = Date.parse('2026-07-15T10:00:10.000Z');

function audit(status: AuditStatus, patch: Partial<ResourceAuditDocument> = {}): ResourceAuditDocument {
  return {
    id: 'audit-live-test', userId: null, guestKeyHash: 'guest', projectId: null,
    submittedInput: 'https://example.com', normalizedUrl: 'https://example.com/', finalUrl: 'https://example.com/', hostname: 'example.com',
    mode: 'standard', plan: 'paid', requestedMode: 'standard', effectiveMode: 'standard', queuePriority: 50,
    processingTier: 'paid', quotaCounted: true, workerRuntime: 'render', estimatedWaitSeconds: null,
    status, progress: status === 'running' ? 48 : 100, currentPhase: 'Report ready', currentUrl: null,
    currentCheck: 'Final report is ready', pageLimit: 50, pagesDiscovered: 63, pagesCrawled: 50,
    checksTotal: 500, checksCompleted: 500, issuesFound: 12, criticalCount: 1, highCount: 3, mediumCount: 5, lowCount: 3,
    createdAt: '2026-07-15T09:59:00.000Z', updatedAt: '2026-07-15T10:00:05.000Z', startedAt: '2026-07-15T09:59:10.000Z',
    completedAt: status === 'completed' || status === 'completed_with_warnings' || status === 'failed' ? '2026-07-15T10:00:05.000Z' : null,
    expiresAt: '2026-08-15T10:00:05.000Z', cancelledAt: status === 'cancelled' ? '2026-07-15T10:00:05.000Z' : null,
    error: status === 'failed' ? 'The website could not be reached safely.' : null, lockedBy: null, lockedAt: null, leaseExpiresAt: null,
    ...patch,
  };
}

const staleActiveEvent: ResourceAuditEvent = {
  id: 'event-active', type: 'page_crawling', timestamp: '2026-07-15T10:00:04.000Z',
  message: 'Checking page content', phase: 'Checking now', currentUrl: 'https://example.com/last-page', progress: 98,
};

const completed = deriveAuditLivePresentation({ audit: audit('completed'), latestEvent: staleActiveEvent, hasFinalReport: true, now });
assert.equal(completed.heading, 'Audit complete');
assert.equal(completed.active, false);
assert.equal(completed.icon, 'success');
assert.equal(completed.phase, 'Report ready');
assert.equal(completed.action, 'Your final report is ready');
assert.equal(completed.targetLabel, 'Last checked page');
assert.equal(completed.reportActionAvailable, true);
assert.doesNotMatch(JSON.stringify(completed), /Checking now/i);

const warnings = deriveAuditLivePresentation({ audit: audit('completed_with_warnings'), latestEvent: staleActiveEvent, hasFinalReport: true, now });
assert.equal(warnings.heading, 'Audit complete with warnings');
assert.equal(warnings.icon, 'warning');
assert.equal(warnings.active, false);
assert.equal(warnings.reportActionAvailable, true);

const failed = deriveAuditLivePresentation({ audit: audit('failed'), latestEvent: staleActiveEvent, hasFinalReport: false, now });
assert.equal(failed.heading, 'Audit could not be completed');
assert.equal(failed.icon, 'failed');
assert.equal(failed.active, false);
assert.match(failed.message, /could not be reached safely/i);

const cancelled = deriveAuditLivePresentation({ audit: audit('cancelled'), latestEvent: staleActiveEvent, hasFinalReport: false, now });
assert.equal(cancelled.heading, 'Audit cancelled');
assert.equal(cancelled.active, false);
assert.equal(cancelled.reportActionAvailable, false);
assert.doesNotMatch(cancelled.action, /final report is ready/i);

const queued = deriveAuditLivePresentation({ audit: audit('queued', { progress: 0, currentPhase: 'Waiting to start' }), hasFinalReport: false, now });
assert.equal(queued.heading, 'Waiting for audit engine');
assert.equal(queued.icon, 'waiting');
assert.equal(queued.active, true);

const running = deriveAuditLivePresentation({
  audit: audit('running', { currentPhase: 'Checking page content', currentCheck: 'Title and description' }),
  latestEvent: staleActiveEvent, hasFinalReport: false, now,
});
assert.equal(running.heading, 'Checking now');
assert.equal(running.active, true);
assert.equal(running.action, 'Title and description');

const terminalData = { audit: audit('completed'), latestEvents: [staleActiveEvent], latestPages: [], latestIssues: [], finalReport: null };
const delayedActiveData = {
  audit: audit('running', { progress: 72, pagesCrawled: 30, checksCompleted: 300, issuesFound: 8 }),
  latestEvents: [staleActiveEvent], latestPages: [], latestIssues: [], finalReport: null,
};
const mergedTerminal = mergeAuditLiveData(terminalData, delayedActiveData);
assert.equal(mergedTerminal.audit?.status, 'completed', 'a delayed active snapshot must not replace a terminal audit');
assert.equal(mergedTerminal.audit?.progress, 100);
assert.equal(mergedTerminal.audit?.pagesCrawled, 50);

const monotonic = mergeAuditLiveData(delayedActiveData, {
  ...delayedActiveData,
  audit: audit('running', { progress: 41, pagesDiscovered: 40, pagesCrawled: 20, checksCompleted: 200, issuesFound: 4 }),
});
assert.equal(monotonic.audit?.progress, 72);
assert.equal(monotonic.audit?.pagesCrawled, 30);
assert.equal(monotonic.audit?.checksCompleted, 300);
assert.equal(monotonic.audit?.issuesFound, 8);

assert.equal(describeCrawlCompletion({ stopReason: 'page_limit_reached', pagesAnalysed: 50, pageLimit: 50 }), '50 of 50 pages analysed. The audit reached its page allowance.');
assert.equal(describeCrawlCompletion({ stopReason: 'crawl_queue_exhausted', pagesAnalysed: 18, pageLimit: 75 }), '18 of 75 pages analysed. No additional eligible public pages were found.');
assert.equal(describeCrawlCompletion({ stopReason: 'audit_deadline_reached', pagesAnalysed: 62, pageLimit: 75 }), '62 of 75 pages analysed. The audit reached its safe execution deadline.');

console.log('Live audit presentation smoke test passed.');
