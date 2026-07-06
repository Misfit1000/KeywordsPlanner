const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const SeoAudit = lazy(() => import('./components/SeoAudit'));`,
  `const SeoAudit = lazy(() => import('./components/SeoAudit'));\nconst SecurityAudit = lazy(() => import('./components/SecurityAudit'));`
);

code = code.replace(
  `case 'seo-audit':\n        return <SeoAudit />;`,
  `case 'seo-audit':\n        return <SeoAudit />;\n      case 'security-audit':\n        return <SecurityAudit />;`
);

// find nav items
code = code.replace(
  `{ id: 'seo-audit', icon: Activity, label: 'SEO Audit' },`,
  `{ id: 'seo-audit', icon: Activity, label: 'SEO Audit' },\n      { id: 'security-audit', icon: Activity, label: 'Security Audit' },`
);

fs.writeFileSync('src/App.tsx', code);
