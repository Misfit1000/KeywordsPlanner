const fs = require('fs');
let code = fs.readFileSync('src/lib/seo/checks/runner.ts', 'utf8');

code = code.replace(
  `export function runAllChecks(pageData: any): AuditIssue[] {`,
  `import { eventEmitter } from '../../audit/event-emitter';\n\nexport function runAllChecks(pageData: any, auditId?: string): AuditIssue[] {`
);

code = code.replace(
  /issues = issues\.concat\(check([A-Za-z]+)\(pageData\)\);/g,
  (match, p1) => {
    return `if (auditId) eventEmitter.emitCheckStarted(auditId, '${p1}', pageData.url);
  const issues${p1} = check${p1}(pageData, auditId);
  if (auditId) {
    issues${p1}.forEach(issue => eventEmitter.emitIssueFound(auditId, issue));
    eventEmitter.emitCheckCompleted(auditId, '${p1}', pageData.url);
  }
  issues = issues.concat(issues${p1});`;
  }
);

fs.writeFileSync('src/lib/seo/checks/runner.ts', code);
