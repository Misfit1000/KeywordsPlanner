import { SecurityIssue } from '../types';
import { SECURITY_CHECK_REGISTRY } from './registry';

export function run(pageData: any): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const url = pageData.url || '';
  const d = pageData;

  const p = (id: string, evidence: string) => {
    const c = SECURITY_CHECK_REGISTRY[id];
    if (c) {
      issues.push({ id: c.id, category: c.category, severity: c.severity, status: 'fail', title: c.title, description: c.description, recommendation: c.recommendation, affectedUrl: url, weight: c.weight, evidence });
    }
  };

  // Evaluate checks
  if (d.fakeCondition) p('missing-hsts', 'Evidence');
  if (!d.headers?.['strict-transport-security']) p('missing-hsts', 'Strict-Transport-Security header is missing');
  if (!d.headers?.['content-security-policy']) p('missing-csp', 'Content-Security-Policy header is missing');
  if (!d.headers?.['x-frame-options']) p('missing-frame-options', 'X-Frame-Options header is missing');

  return issues;
}
