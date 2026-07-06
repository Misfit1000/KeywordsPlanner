import { auditStore } from './audit-store';
import { AuditLiveEvent } from './events';

export const eventEmitter = {
  emitAuditEvent(auditId: string, event: Partial<AuditLiveEvent>) {
    auditStore.appendAuditEvent(auditId, event);
  },
  emitStepStarted(auditId: string, step: string, message: string) {
    this.emitAuditEvent(auditId, { type: 'step_started', step, message });
  },
  emitStepCompleted(auditId: string, step: string, message: string) {
    this.emitAuditEvent(auditId, { type: 'step_completed', step, message });
  },
  emitPageDiscovered(auditId: string, url: string, data?: any) {
    this.emitAuditEvent(auditId, { type: 'page_discovered', affectedUrl: url, message: `Page discovered: ${url}`, ...data });
  },
  emitPageCrawling(auditId: string, url: string, data?: any) {
    this.emitAuditEvent(auditId, { type: 'page_crawling', affectedUrl: url, message: `Crawling page: ${url}`, ...data });
  },
  emitPageCrawled(auditId: string, url: string, data?: any) {
    this.emitAuditEvent(auditId, { type: 'page_crawled', affectedUrl: url, message: `Page crawled: ${url}`, ...data });
  },
  emitPageFailed(auditId: string, url: string, error: string) {
    this.emitAuditEvent(auditId, { type: 'page_failed', affectedUrl: url, message: `Failed to crawl ${url}: ${error}`, severity: 'warning' });
  },
  emitCheckStarted(auditId: string, checkTitle: string, affectedUrl?: string) {
    this.emitAuditEvent(auditId, { type: 'check_started', checkTitle, affectedUrl, message: `Checking ${checkTitle} on ${affectedUrl || 'domain'}` });
  },
  emitCheckCompleted(auditId: string, checkTitle: string, affectedUrl?: string) {
    this.emitAuditEvent(auditId, { type: 'check_completed', checkTitle, affectedUrl, message: `${checkTitle} check complete` });
  },
  emitIssueFound(auditId: string, issue: any) {
    this.emitAuditEvent(auditId, { 
      type: 'issue_found', 
      checkId: issue.id, 
      checkTitle: issue.title, 
      category: issue.category, 
      severity: issue.severity, 
      affectedUrl: issue.affectedUrl, 
      message: `Issue found: ${issue.title} on ${issue.affectedUrl || 'domain'}` 
    });
  },
  emitScoreUpdated(auditId: string, scoreData: any) {
    this.emitAuditEvent(auditId, { type: 'score_updated', message: `Score updated: ${scoreData.score}`, data: scoreData });
  },
  emitAuditCompleted(auditId: string, result?: any) {
    this.emitAuditEvent(auditId, { type: 'audit_completed', message: 'Audit complete', progress: 100, step: 'Complete' });
  },
  emitAuditFailed(auditId: string, error: string) {
    this.emitAuditEvent(auditId, { type: 'audit_failed', message: `Audit failed: ${error}` });
  }
};
