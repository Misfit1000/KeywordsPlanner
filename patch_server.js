const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `import { apiRouter } from "./src/api/index";`,
  `import { apiRouter } from "./src/api/index";\nimport { securityRouter } from "./src/lib/security/api/index";`
);

fs.writeFileSync('server.ts', code);
