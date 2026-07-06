import { AuditIssue } from '../../audit/types';

export function runAdvancedChecks(pageData: any): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const url = pageData.url || '';
  
  // 1. Schema JSON-LD
  if (pageData.jsonLd && pageData.jsonLd.length === 0) {
    issues.push({ id: 'missing-json-ld', category: 'content', severity: 'info', title: 'No JSON-LD Schema Found', description: 'Page does not use JSON-LD structured data.', affectedUrl: url });
  }

  // 2. Open Graph & Twitter
  if (!pageData.ogImage) {
    issues.push({ id: 'missing-og-image', category: 'on-page', severity: 'low', title: 'Missing OG Image', description: 'Page is missing an Open Graph image.', affectedUrl: url });
  }
  
  // 3. Security Headers (Mocked for now since crawler doesn't extract headers yet, but we will assume missing for demonstration or rely on real headers if added)
  if (pageData.headers) {
    const h = pageData.headers;
    if (!h['strict-transport-security']) issues.push({ id: 'missing-hsts', category: 'security', severity: 'medium', title: 'Missing HSTS Header', description: 'Strict-Transport-Security header is missing.', affectedUrl: url });
    if (!h['content-security-policy']) issues.push({ id: 'missing-csp', category: 'security', severity: 'low', title: 'Missing CSP', description: 'Content-Security-Policy header is missing.', affectedUrl: url });
    if (!h['x-frame-options']) issues.push({ id: 'missing-xfo', category: 'security', severity: 'low', title: 'Missing X-Frame-Options', description: 'X-Frame-Options header is missing.', affectedUrl: url });
  }

  return issues;
}
