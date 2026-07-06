const fs = require('fs');
let code = fs.readFileSync('src/lib/security/audit-runner.ts', 'utf8');

code = code.replace(
  `import { fetchSecurityPage } from './fetch-security-page';`,
  `import { fetchSecurityPage } from './fetch-security-page';\nimport { auditStore } from '../audit/audit-store';`
);

code = code.replace(
  `export async function runSecurityAudit(url: string, options: any = {}): Promise<SecurityAuditResult> {`,
  `export async function runSecurityAudit(url: string, options: any = {}): Promise<SecurityAuditResult> {\n  const auditId = options.auditId;\n  if (auditId) auditStore.appendAuditEvent(auditId, { type: 'audit_started', message: 'Starting security audit', progress: 5, step: 'Fetching homepage' });\n`
);

code = code.replace(
  `const issues = runSecurityChecks(pageData);`,
  `if (auditId) auditStore.appendAuditEvent(auditId, { type: 'step_started', message: 'Running security checks', progress: 50, step: 'Security Checks' });\n  const issues = runSecurityChecks(pageData, auditId);\n`
);

code = code.replace(
  `const scoreResult = calculateSecurityScore(issues);`,
  `if (auditId) auditStore.appendAuditEvent(auditId, { type: 'step_started', message: 'Calculating security score', progress: 90, step: 'Scoring' });\n  const scoreResult = calculateSecurityScore(issues);\n`
);

code = code.replace(
  `return {`,
  `const result = {\n    url: pageResult.url,\n    finalUrl: pageResult.finalUrl,\n    scannedAt: new Date().toISOString(),\n    securityScore: scoreResult.securityScore,\n    categoryScores: scoreResult.categoryScores,\n    criticalCount: scoreResult.criticalCount,\n    highCount: scoreResult.highCount,\n    mediumCount: scoreResult.mediumCount,\n    lowCount: scoreResult.lowCount,\n    infoCount: scoreResult.infoCount,\n    issues,\n    passedChecks: scoreResult.passedChecks,\n    summary\n  };\n\n  if (auditId) {\n    auditStore.updateAudit(auditId, { result });\n    auditStore.appendAuditEvent(auditId, { type: 'audit_completed', message: 'Security audit complete', progress: 100, step: 'Complete' });\n  }\n  return result;`
);

// Delete the old return block
code = code.replace(
  `return {\n    url: pageResult.url,\n    finalUrl: pageResult.finalUrl,\n    scannedAt: new Date().toISOString(),\n    securityScore: scoreResult.securityScore,\n    categoryScores: scoreResult.categoryScores,\n    criticalCount: scoreResult.criticalCount,\n    highCount: scoreResult.highCount,\n    mediumCount: scoreResult.mediumCount,\n    lowCount: scoreResult.lowCount,\n    infoCount: scoreResult.infoCount,\n    issues,\n    passedChecks: scoreResult.passedChecks,\n    summary\n  };`,
  ``
);

code = code.replace(
  `throw new Error('Failed to fetch security page: ' + pageResult.error);`,
  `if (auditId) auditStore.appendAuditEvent(auditId, { type: 'audit_failed', message: 'Failed to fetch security page: ' + pageResult.error });\n    throw new Error('Failed to fetch security page: ' + pageResult.error);`
);


fs.writeFileSync('src/lib/security/audit-runner.ts', code);
