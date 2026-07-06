import { SecurityAuditResult, SecurityAuditSummary } from './types';
import { runSecurityChecks } from './checks/runner';
import { calculateSecurityScore } from './scoring';
import { fetchSecurityPage } from './fetch-security-page';
import { auditStore } from '../audit/audit-store';
import { eventEmitter } from '../audit/event-emitter';

export async function runSecurityAudit(url: string, options: any = {}): Promise<SecurityAuditResult> {
  const auditId = options.auditId;
  if (auditId) {
    eventEmitter.emitAuditEvent(auditId, { type: 'audit_started', message: 'Starting security audit', progress: 5 });
    eventEmitter.emitStepStarted(auditId, 'Fetching homepage', 'Fetching homepage');
  }

  const pageResult = await fetchSecurityPage(url);
  
  if (!pageResult.success) {
    if (auditId) eventEmitter.emitAuditFailed(auditId, pageResult.error || 'Unknown error');
    throw new Error('Failed to fetch security page: ' + pageResult.error);
  }
  
  const pageData = {
    ...pageResult.data,
    url: pageResult.url,
    finalUrl: pageResult.finalUrl,
    status: pageResult.status,
    headers: pageResult.headers
  };
  
  if (auditId) {
    eventEmitter.emitStepCompleted(auditId, 'Fetching homepage', 'Homepage fetched');
    eventEmitter.emitStepStarted(auditId, 'Security Checks', 'Running security checks');
    eventEmitter.emitAuditEvent(auditId, { progress: 50 });
  }
  const issues = await runSecurityChecks(pageData, auditId);

  if (auditId) {
    eventEmitter.emitStepCompleted(auditId, 'Security Checks', 'Security checks completed');
    eventEmitter.emitStepStarted(auditId, 'Scoring', 'Calculating security score');
    eventEmitter.emitAuditEvent(auditId, { progress: 90 });
  }
  const scoreResult = calculateSecurityScore(issues);

  
  const summary: SecurityAuditSummary = {
    httpsEnabled: pageResult.finalUrl.startsWith('https://'),
    redirectsToHttps: pageResult.url.startsWith('http://') && pageResult.finalUrl.startsWith('https://'),
    securityHeadersPresent: [],
    securityHeadersMissing: [],
    cookieCount: 0,
    riskyCookieCount: 0,
    formsDetected: 0,
    insecureFormsDetected: 0,
    exposedFilesDetected: 0
  };
  
  const result = {
    url: pageResult.url,
    finalUrl: pageResult.finalUrl,
    scannedAt: new Date().toISOString(),
    securityScore: scoreResult.securityScore,
    categoryScores: scoreResult.categoryScores,
    criticalCount: scoreResult.criticalCount,
    highCount: scoreResult.highCount,
    mediumCount: scoreResult.mediumCount,
    lowCount: scoreResult.lowCount,
    infoCount: scoreResult.infoCount,
    issues,
    passedChecks: scoreResult.passedChecks,
    summary
  };

  if (auditId) {
    eventEmitter.emitScoreUpdated(auditId, { score: scoreResult.securityScore });
    eventEmitter.emitStepCompleted(auditId, 'Scoring', 'Score calculated');
    eventEmitter.emitStepStarted(auditId, 'Report Building', 'Building final report');
    eventEmitter.emitAuditEvent(auditId, { progress: 95 });
    
    auditStore.updateAudit(auditId, { result });
    
    eventEmitter.emitStepCompleted(auditId, 'Report Building', 'Report built');
    eventEmitter.emitAuditCompleted(auditId);
  }
  return result;
}
