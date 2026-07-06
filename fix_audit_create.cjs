const fs = require('fs');
let code = fs.readFileSync('src/lib/audit/audit-store.ts', 'utf8');
code = code.replace(/createAudit\(input: \{ url: string; type: 'seo' \| 'security' \| 'combined' \}\): string \{/, "createAudit(input: { url: string; type: 'seo' | 'security' | 'combined' | 'competitor-gap' | 'website-analyzer' }): string {");
fs.writeFileSync('src/lib/audit/audit-store.ts', code);
