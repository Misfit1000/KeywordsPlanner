import { SecurityIssue } from '../types';
import './all-checks';
import { run as checkHttps } from './https';
import { run as checkHeaders } from './headers';
import { run as checkCookies } from './cookies';
import { run as checkCors } from './cors';
import { run as checkForms } from './forms';
import { run as checkInfoDisclosure } from './information-disclosure';
import { run as checkDependencySignals } from './dependency-signals';
import { run as checkClickjacking } from './clickjacking';
import { run as checkContentSecurity } from './content-security';
import { run as checkAuthSurface } from './auth-surface';
import { run as checkMetadata } from './metadata';
import { run as checkRobots } from './robots';
import { run as checkEmailTrust } from './email-trust';
import { run as checkMisconfiguration } from './misconfiguration';
import { run as checkExposedFiles } from './exposed-files';

import { auditStore } from '../../audit/audit-store';

export async function runSecurityChecks(pageData: any, auditId?: string): Promise<SecurityIssue[]> {
  let issues: SecurityIssue[] = [];
  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking HTTPS', step: 'Security Checks' });
  issues = issues.concat(checkHttps(pageData));
  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking Headers', step: 'Security Checks' });
  issues = issues.concat(checkHeaders(pageData));
  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking Cookies', step: 'Security Checks' });
  issues = issues.concat(checkCookies(pageData));
  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking CORS', step: 'Security Checks' });
  issues = issues.concat(checkCors(pageData));
  issues = issues.concat(checkForms(pageData));
  issues = issues.concat(checkInfoDisclosure(pageData));
  issues = issues.concat(checkDependencySignals(pageData));
  issues = issues.concat(checkClickjacking(pageData));
  issues = issues.concat(checkContentSecurity(pageData));
  issues = issues.concat(checkAuthSurface(pageData));
  issues = issues.concat(checkMetadata(pageData));
  issues = issues.concat(checkRobots(pageData));
  issues = issues.concat(checkEmailTrust(pageData));
  issues = issues.concat(checkMisconfiguration(pageData));
  if (pageData.url && pageData.headers) {
      if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking Exposed Files', step: 'Security Checks' });
      issues = issues.concat(await checkExposedFiles(pageData, auditId));
  }
  return issues;
}
