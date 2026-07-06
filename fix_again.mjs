import fs from 'fs';

let content = fs.readFileSync('src/api/index.ts', 'utf8');

// Undo the sed:
content = content.replace(/  \}\)\);/g, '  });');

// Wait, the previous replace changed all "});" at the end of functions to "}));".
// Let's just fix it by replacing the wrapper manually for each apiRouter endpoint.
