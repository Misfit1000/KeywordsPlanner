const fs = require('fs');
let code = fs.readFileSync('src/lib/security/checks/exposed-files.ts', 'utf8');

code = code.replace(
  `import { auditStore } from '../../audit/audit-store';`,
  `import { auditStore } from '../../audit/audit-store';\nimport { eventEmitter } from '../../audit/event-emitter';`
);

code = code.replace(/if \(auditId\) \{\s*auditStore\.appendAuditEvent\(auditId, \{ type: 'check_started', message: `Checking \$\{path\}`, step: 'Security Checks' \}\);\s*\}/g,
  `// Check handled by outer loop`);

code = code.replace(/if \(auditId\) \{\s*auditStore\.appendAuditEvent\(auditId, \{ type: 'issue_found', severity: 'critical', message: `Exposed file found: \$\{path\}`, affectedUrl: url \}\);\s*\}/g,
  `// Issue emission is handled by outer loop`);

fs.writeFileSync('src/lib/security/checks/exposed-files.ts', code);
