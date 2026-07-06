const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `import SeoAudit from './components/SeoAudit';`,
  `import SeoAudit from './components/SeoAudit';\nimport SecurityAudit from './components/SecurityAudit';`
);

code = code.replace(
  `{activeTab === 'audit' && <SeoAudit />}`,
  `{activeTab === 'audit' && <SeoAudit />}\n        {activeTab === 'security' && <SecurityAudit />}`
);

// add to nav
code = code.replace(
  `{ id: 'audit', icon: Activity, label: 'SEO Audit' },`,
  `{ id: 'audit', icon: Activity, label: 'SEO Audit' },\n  { id: 'security', icon: Activity, label: 'Security Audit' },`
);

fs.writeFileSync('src/App.tsx', code);
