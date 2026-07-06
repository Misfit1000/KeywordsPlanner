const fs = require('fs');
let code = fs.readFileSync('src/api/index.ts', 'utf8');

code = code.replace(
  `// Start job asynchronously
    runAuditJob(auditId, maxPages || 25);`,
  `// Start job asynchronously
    if (type === 'security') {
      import('../lib/security/audit-runner').then(m => {
        m.runSecurityAudit(url, { auditId }).catch(console.error);
      });
    } else {
      runAuditJob(auditId, maxPages || 25);
    }`
);

fs.writeFileSync('src/api/index.ts', code);
