const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');
let pkg = JSON.parse(code);
pkg.scripts['smoke:live-audit'] = 'tsx scripts/smoke-live-audit.mts';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
