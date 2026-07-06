const fs = require('fs');
let code = fs.readFileSync('src/lib/seo/crawler.ts', 'utf8');

code = code.replace(
  /if \(options\.auditId\) eventEmitter\.emitPageCrawled\(options\.auditId, url\);/, 
  `if (options.auditId) {
                eventEmitter.emitPageCrawled(options.auditId, url);
                eventEmitter.emitAuditEvent(options.auditId, { progress: 5 + Math.floor((results.length / (options.maxPages || 25)) * 50) });
              }`
);

code = code.replace(
  /if \(options\.auditId\) eventEmitter\.emitPageFailed\(options\.auditId, url, error\.message\);/,
  `if (options.auditId) {
              eventEmitter.emitPageFailed(options.auditId, url, error.message);
              eventEmitter.emitAuditEvent(options.auditId, { progress: 5 + Math.floor((results.length / (options.maxPages || 25)) * 50) });
            }`
);

fs.writeFileSync('src/lib/seo/crawler.ts', code);
