const fs = require('fs');
let code = fs.readFileSync('src/lib/security/audit-runner.ts', 'utf8');

// Fix the return block syntax error
code = code.replace(/return result;[\s\S]*summary\n  };/m, 'return result;');

// Fix await runSecurityChecks
code = code.replace(/const issues = runSecurityChecks\(pageData, auditId\);/, 'const issues = await runSecurityChecks(pageData, auditId);');

fs.writeFileSync('src/lib/security/audit-runner.ts', code);
