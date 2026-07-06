import fs from 'fs';

let content = fs.readFileSync('package.json', 'utf8');
const packageData = JSON.parse(content);
packageData.scripts['smoke:api-json'] = 'node scripts/smoke-api-json.mjs';
fs.writeFileSync('package.json', JSON.stringify(packageData, null, 2), 'utf8');
