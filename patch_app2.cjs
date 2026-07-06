const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const SeoAudit = lazy(() => import('./components/SeoAudit'));`,
  `const SeoAudit = lazy(() => import('./components/SeoAudit'));\nconst SecurityAudit = lazy(() => import('./components/SecurityAudit'));`
);

code = code.replace(
  `{activeTab === 'seo-audit' && <SeoAudit />}`,
  `{activeTab === 'seo-audit' && <SeoAudit />}\n        {activeTab === 'security' && <SecurityAudit />}`
);

code = code.replace(
  `{ id: 'seo-audit', icon: Activity, label: 'SEO Audit' },`,
  `{ id: 'seo-audit', icon: Activity, label: 'SEO Audit' },\n  { id: 'security', icon: Activity, label: 'Security Audit' },`
);

code = code.replace(
  `{ id: 'audit', icon: Activity, label: 'SEO Audit' },`,
  `{ id: 'audit', icon: Activity, label: 'SEO Audit' },\n  { id: 'security', icon: Activity, label: 'Security Audit' },`
);

fs.writeFileSync('src/App.tsx', code);
