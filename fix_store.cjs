const fs = require('fs');

let code = fs.readFileSync('src/lib/audit/audit-store.ts', 'utf8');
code = code.replace(/type: 'seo' \| 'security' \| 'combined';/, "type: 'seo' | 'security' | 'combined' | 'competitor-gap' | 'website-analyzer';");
code = code.replace(/result\?: any;/, "result?: any;\n  gaps?: any;\n  crawledCounts?: any;\n  data?: any;");

fs.writeFileSync('src/lib/audit/audit-store.ts', code);
