const fs = require('fs');
let code = fs.readFileSync('scripts/smoke-security-audit.ts', 'utf8');

code = code.replace(
  `const issues = runSecurityChecks(pageData);`,
  `const issues = await runSecurityChecks(pageData);`
);

code = code.replace(
  `import { runSecurityChecks } from '../src/lib/security/checks/runner';`,
  `import { runSecurityChecks } from '../src/lib/security/checks/runner';`
);

fs.writeFileSync('scripts/smoke-security-audit.ts', code);
