const fs = require('fs');
let code = fs.readFileSync('src/lib/audit/audit-store.ts', 'utf8');
code = code.replace(/result\?: any;/, "result?: any;\n  fullAudit?: any;");
fs.writeFileSync('src/lib/audit/audit-store.ts', code);
