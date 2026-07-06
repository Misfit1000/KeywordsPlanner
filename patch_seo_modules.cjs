const fs = require('fs');

const files = fs.readdirSync('src/lib/seo/checks').filter(f => f !== 'runner.ts' && f !== 'all-checks.ts' && f !== 'registry.ts' && f.endsWith('.ts'));

for (const file of files) {
  const path = `src/lib/seo/checks/${file}`;
  let code = fs.readFileSync(path, 'utf8');
  
  if (code.includes('export function run(pageData: any)')) {
    code = code.replace(
      'export function run(pageData: any): AuditIssue[] {',
      'export function run(pageData: any, auditId?: string): AuditIssue[] {'
    );
    fs.writeFileSync(path, code);
  }
}
