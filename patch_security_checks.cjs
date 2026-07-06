const fs = require('fs');
let code = fs.readFileSync('src/lib/security/checks/runner.ts', 'utf8');

code = code.replace(
  `export function runSecurityChecks(pageData: any): SecurityIssue[] {`,
  `import { auditStore } from '../../audit/audit-store';\n\nexport async function runSecurityChecks(pageData: any, auditId?: string): Promise<SecurityIssue[]> {`
);

code = code.replace(
  `  issues = issues.concat(checkHttps(pageData));`,
  `  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking HTTPS', step: 'Security Checks' });\n  issues = issues.concat(checkHttps(pageData));`
);

code = code.replace(
  `  issues = issues.concat(checkHeaders(pageData));`,
  `  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking Headers', step: 'Security Checks' });\n  issues = issues.concat(checkHeaders(pageData));`
);

code = code.replace(
  `  issues = issues.concat(checkCookies(pageData));`,
  `  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking Cookies', step: 'Security Checks' });\n  issues = issues.concat(checkCookies(pageData));`
);

code = code.replace(
  `  issues = issues.concat(checkCors(pageData));`,
  `  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking CORS', step: 'Security Checks' });\n  issues = issues.concat(checkCors(pageData));`
);

code = code.replace(
  `  if (pageData.url && pageData.headers) {
      issues = issues.concat(checkExposedFiles(pageData));
  }`,
  `  if (pageData.url && pageData.headers) {
      if (auditId) auditStore.appendAuditEvent(auditId, { type: 'check_started', message: 'Checking Exposed Files', step: 'Security Checks' });
      issues = issues.concat(await checkExposedFiles(pageData, auditId));
  }`
);

fs.writeFileSync('src/lib/security/checks/runner.ts', code);
