const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const SecurityAudit = lazy(() => import('./components/SecurityAudit'));\nconst SecurityAudit = lazy(() => import('./components/SecurityAudit'));`,
  `const SecurityAudit = lazy(() => import('./components/SecurityAudit'));`
);

fs.writeFileSync('src/App.tsx', code);
