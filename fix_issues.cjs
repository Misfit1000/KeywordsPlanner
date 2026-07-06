const fs = require('fs');

// 1. Fix exposed-files.ts
let exposed = fs.readFileSync('src/lib/security/checks/exposed-files.ts', 'utf8');
exposed = exposed.replace(
  `affectedUrl: url
        });`,
  `affectedUrl: url,
          status: 'fail',
          evidence: url,
          recommendation: 'Ensure sensitive files are not publicly accessible.',
          weight: 10
        });`
);
fs.writeFileSync('src/lib/security/checks/exposed-files.ts', exposed);

// 2. Fix crawler.ts severity error
let crawler = fs.readFileSync('src/lib/seo/crawler.ts', 'utf8');
crawler = crawler.replace(
  `severity: 'warning'`,
  `severity: 'medium'`
);
fs.writeFileSync('src/lib/seo/crawler.ts', crawler);

// 3. Fix smoke-security-audit.ts missing await
let smokeSec = fs.readFileSync('scripts/smoke-security-audit.ts', 'utf8');
smokeSec = smokeSec.replace(
  `const issues = runSecurityChecks(mockPageData);`,
  `const issues = await runSecurityChecks(mockPageData);`
);
fs.writeFileSync('scripts/smoke-security-audit.ts', smokeSec);

// 4. Fix audit-store issuesFound logic
let store = fs.readFileSync('src/lib/audit/audit-store.ts', 'utf8');
store = store.replace(
  `issuesFound: eventData.issuesFound ?? job.issuesFound,`,
  `issuesFound: eventData.issuesFound ?? (eventData.type === 'issue_found' ? (job.issuesFound || 0) + 1 : job.issuesFound),`
);
fs.writeFileSync('src/lib/audit/audit-store.ts', store);

