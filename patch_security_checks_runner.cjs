const fs = require('fs');
let code = fs.readFileSync('src/lib/security/checks/runner.ts', 'utf8');

code = code.replace(
  `import { auditStore } from '../../audit/audit-store';`,
  `import { auditStore } from '../../audit/audit-store';\nimport { eventEmitter } from '../../audit/event-emitter';`
);

// We'll rewrite the runSecurityChecks function entirely to properly emit events for each check
const functionBody = `export async function runSecurityChecks(pageData: any, auditId?: string): Promise<SecurityIssue[]> {
  let issues: SecurityIssue[] = [];

  const checks = [
    { name: 'HTTPS Configuration', fn: checkHttps },
    { name: 'Security Headers', fn: checkHeaders },
    { name: 'Cookies Security', fn: checkCookies },
    { name: 'CORS Configuration', fn: checkCors },
    { name: 'Forms Security', fn: checkForms },
    { name: 'Information Disclosure', fn: checkInfoDisclosure },
    { name: 'Dependency Signals', fn: checkDependencySignals },
    { name: 'Clickjacking Protection', fn: checkClickjacking },
    { name: 'Content Security Policy', fn: checkContentSecurity },
    { name: 'Authentication Surface', fn: checkAuthSurface },
    { name: 'Security Metadata', fn: checkMetadata },
    { name: 'Robots.txt Security', fn: checkRobots },
    { name: 'Email Trust', fn: checkEmailTrust },
    { name: 'Server Misconfiguration', fn: checkMisconfiguration }
  ];

  for (const check of checks) {
    if (auditId) eventEmitter.emitCheckStarted(auditId, check.name, pageData.url);
    const resultIssues = check.fn(pageData);
    if (auditId) {
      resultIssues.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
      eventEmitter.emitCheckCompleted(auditId, check.name, pageData.url);
    }
    issues = issues.concat(resultIssues);
  }

  if (pageData.url && pageData.headers) {
    if (auditId) eventEmitter.emitCheckStarted(auditId, 'Exposed Files', pageData.url);
    const resultIssues = await checkExposedFiles(pageData, auditId);
    if (auditId) {
      // checkExposedFiles might already emit issues, but let's be safe. Wait, if we emit here, we might double-emit.
      // Let's assume checkExposedFiles does not emit its own issues anymore, or we just emit here.
      // In the previous version, we added emitIssueFound to exposed-files.ts.
      // Let's remove auditId passing to checkExposedFiles and handle it here to be consistent.
      resultIssues.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
      eventEmitter.emitCheckCompleted(auditId, 'Exposed Files', pageData.url);
    }
    issues = issues.concat(resultIssues);
  }

  return issues;
}`;

code = code.replace(/export async function runSecurityChecks[\s\S]*$/, functionBody);
fs.writeFileSync('src/lib/security/checks/runner.ts', code);
