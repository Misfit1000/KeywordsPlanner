const fs = require('fs');
let code = fs.readFileSync('src/api/index.ts', 'utf8');

const startIndex = code.indexOf("apiRouter.post('/competitor-gap'");
if (startIndex !== -1) {
  // Let's just keep the new apiRouter.post('/competitor-gap', ...
  // Wait, in the current file it looks like the new one is at the top (inserted where the old one was)
  // but it left part of the old one because the regex didn't match the whole thing.
  // Actually, let's just strip out everything after the first `});` of the new competitor-gap block
  
  // Actually, I can just replace everything from the first `apiRouter.post('/competitor-gap'` to the end of the file with the correct new code, since competitor gap was at the bottom.
  // Let's verify what's after competitor-gap.
  const oldCode = code.substring(startIndex);
  // I will just rewrite it to remove the messed up parts.
}
