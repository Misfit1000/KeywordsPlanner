const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  `{ icon: Activity, label: 'Full SEO Audit', id: 'seo-audit' },`,
  `{ icon: Activity, label: 'Full SEO Audit', id: 'seo-audit' },\n    { icon: Activity, label: 'Security Audit', id: 'security-audit' },`
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
