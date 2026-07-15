import { customerSafeDiagnosticText } from './audit-failures';
import { getAuditTerminalTime, isCompletedAuditStatus } from './audit-time';
import type { ResourceAuditDocument, ResourceAuditEvent } from './resource-types';

export type AuditPresentationIcon = 'active' | 'waiting' | 'success' | 'warning' | 'failed' | 'cancelled';

export interface AuditLivePresentation {
  heading: string;
  phase: string;
  action: string;
  target: string;
  targetLabel: string;
  actionLabel: string;
  message: string;
  timestamp: string;
  icon: AuditPresentationIcon;
  active: boolean;
  reportActionAvailable: boolean;
}

function safeText(value?: string | null) {
  return customerSafeDiagnosticText(value) || '';
}

function relativeTerminalTime(timestamp: number | null, now: number, verb: string) {
  if (!timestamp) return verb;
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 10) return `${verb} just now`;
  if (seconds < 60) return `${verb} ${seconds}s ago`;
  if (seconds < 3_600) return `${verb} ${Math.floor(seconds / 60)}m ago`;
  return `${verb} ${new Date(timestamp).toLocaleString()}`;
}

export function deriveAuditLivePresentation(input: {
  audit: ResourceAuditDocument;
  latestEvent?: ResourceAuditEvent;
  hasFinalReport: boolean;
  lastCheckedUrl?: string | null;
  now?: number;
}): AuditLivePresentation {
  const { audit, latestEvent, hasFinalReport } = input;
  const now = input.now ?? Date.now();
  const lastCheckedUrl = input.lastCheckedUrl || audit.finalUrl || audit.normalizedUrl;
  const terminalTime = getAuditTerminalTime(audit);

  if (audit.status === 'completed') {
    return {
      heading: 'Audit complete', phase: 'Report ready', action: 'Your final report is ready',
      target: lastCheckedUrl, targetLabel: 'Last checked page', actionLabel: 'Summary',
      message: 'The audit finished successfully. Open the report for scores, findings, and page evidence.',
      timestamp: relativeTerminalTime(terminalTime, now, 'Completed'), icon: 'success', active: false,
      reportActionAvailable: hasFinalReport,
    };
  }

  if (audit.status === 'completed_with_warnings') {
    return {
      heading: 'Audit complete with warnings', phase: 'Report ready with warnings',
      action: 'Your report is ready with coverage notes', target: lastCheckedUrl,
      targetLabel: 'Last checked page', actionLabel: 'Summary',
      message: 'Some pages or checks were unavailable. Review the coverage notes before acting on the final scores.',
      timestamp: relativeTerminalTime(terminalTime, now, 'Completed'), icon: 'warning', active: false,
      reportActionAvailable: hasFinalReport,
    };
  }

  if (audit.status === 'failed' || audit.status === 'abandoned') {
    return {
      heading: 'Audit could not be completed', phase: 'Audit stopped',
      action: safeText(audit.error) || 'The audit stopped before enough evidence was collected',
      target: lastCheckedUrl, targetLabel: 'Last attempted page', actionLabel: 'Reason',
      message: safeText(audit.error) || 'The website could not be checked safely. Review the message and retry when the site is available.',
      timestamp: relativeTerminalTime(terminalTime, now, 'Stopped'), icon: 'failed', active: false,
      reportActionAvailable: false,
    };
  }

  if (audit.status === 'cancelled') {
    return {
      heading: 'Audit cancelled', phase: 'Cancelled',
      action: hasFinalReport ? 'Partial results are available' : 'No final report was created',
      target: lastCheckedUrl, targetLabel: 'Last checked page', actionLabel: 'Summary',
      message: hasFinalReport
        ? 'The audit was cancelled. Open the available partial results for the evidence collected before cancellation.'
        : 'The audit was cancelled before a usable report was saved.',
      timestamp: relativeTerminalTime(terminalTime, now, 'Cancelled'), icon: 'cancelled', active: false,
      reportActionAvailable: hasFinalReport,
    };
  }

  if (audit.status === 'queued') {
    return {
      heading: 'Waiting for audit engine', phase: safeText(audit.currentPhase) || 'Waiting to start',
      action: 'Your audit is in the queue', target: audit.normalizedUrl,
      targetLabel: 'Website', actionLabel: 'Queue status',
      message: safeText(latestEvent?.message) || 'The audit will begin when the audit engine is available.',
      timestamp: 'Waiting for first page', icon: 'waiting', active: true, reportActionAvailable: false,
    };
  }

  return {
    heading: 'Checking now', phase: safeText(audit.currentPhase || latestEvent?.phase) || 'Checking your site',
    action: safeText(audit.currentCheck || latestEvent?.checkTitle || latestEvent?.message) || 'Reviewing page evidence',
    target: audit.currentUrl || latestEvent?.currentUrl || latestEvent?.affectedUrl || audit.normalizedUrl,
    targetLabel: 'Page or URL', actionLabel: 'Now checking',
    message: safeText(latestEvent?.message) || 'The audit engine is updating live progress.',
    timestamp: 'Live update', icon: 'active', active: true, reportActionAvailable: false,
  };
}

export function isFinalAuditPresentation(presentation: AuditLivePresentation) {
  return !presentation.active && (presentation.icon === 'success' || presentation.icon === 'warning');
}

export function canPresentFinalScore(audit: ResourceAuditDocument, hasFinalReport: boolean) {
  return isCompletedAuditStatus(audit.status) && hasFinalReport;
}
