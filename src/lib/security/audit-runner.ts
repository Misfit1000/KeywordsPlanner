import { SecurityAuditResult, SecurityAuditSummary } from './types';
import { runSecurityChecks } from './checks/runner';
import { calculateSecurityScore } from './scoring';
import { fetchSecurityPage } from './fetch-security-page';
import { auditStore } from '../audit/audit-store';

export async function runSecurityAudit(url: string, options: any = {}): Promise<SecurityAuditResult> {
  const auditId = options.auditId;
  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'audit_started', message: 'Starting security audit', progress: 5, step: 'Fetching homepage' });

  const pageResult = await fetchSecurityPage(url);
  
  if (!pageResult.success) {
    if (auditId) auditStore.appendAuditEvent(auditId, { type: 'audit_failed', message: 'Failed to fetch security page: ' + pageResult.error });
    throw new Error('Failed to fetch security page: ' + pageResult.error);
  }
  
  const pageData = {
    ...pageResult.data,
    url: pageResult.url,
    finalUrl: pageResult.finalUrl,
    status: pageResult.status,
    headers: pageResult.headers
  };
  
  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'step_started', message: 'Running security checks', progress: 50, step: 'Security Checks' });
  const issues = await runSecurityChecks(pageData, auditId);

  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'step_started', message: 'Calculating security score', progress: 90, step: 'Scoring' });
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
    auditStore.updateAudit(auditId, { result });
    auditStore.appendAuditEvent(auditId, { type: 'audit_completed', message: 'Security audit complete', progress: 100, step: 'Complete' });
  }
  return result;
}
