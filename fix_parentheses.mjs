import fs from 'fs';

let content = fs.readFileSync('src/api/index.ts', 'utf8');

const regex = /\}\);(?=\napiRouter|\n$|$)/g;
content = content.replace(regex, '}));');
fs.writeFileSync('src/api/index.ts', content, 'utf8');

let secContent = fs.readFileSync('src/lib/security/api/index.ts', 'utf8');
secContent = secContent.replace(/\}\);(?=\nsecurityRouter|\n$|$)/g, '}));');
fs.writeFileSync('src/lib/security/api/index.ts', secContent, 'utf8');
