const fs = require('fs');
let code = fs.readFileSync('src/lib/seo/crawler.ts', 'utf8');

code = code.replace(
  `import { auditStore } from '../audit/audit-store';`,
  `import { auditStore } from '../audit/audit-store';\nimport { eventEmitter } from '../audit/event-emitter';`
);

// replace auditStore.appendAuditEvent with eventEmitter calls where possible, but actually we can just leave the crawler's existing auditStore calls and modify them to match the new requirements. Let's do a regex replacement for crawler events to use eventEmitter.

code = code.replace(
  /if \(options.auditId\) auditStore\.appendAuditEvent\(options\.auditId, \{ type: 'step_started', message: 'Fetching robots\.txt', step: 'Checking robots\.txt', progress: 5 \}\);/g,
  `if (options.auditId) {
    eventEmitter.emitStepStarted(options.auditId, 'Checking robots.txt', 'Fetching robots.txt');
    eventEmitter.emitAuditEvent(options.auditId, { progress: 5 });
  }`
);

code = code.replace(
  /if \(options\.auditId\) \{[\s\S]*?auditStore\.appendAuditEvent\(options\.auditId, \{[\s\S]*?type: 'page_discovered',[\s\S]*?pagesDiscovered: visited\.size \+ toVisit\.length,[\s\S]*?pagesCrawled: results\.length,[\s\S]*?progress: 15 \+ Math\.floor\(\(results\.length \/ maxPages\) \* 40\)[\s\S]*?\}\);\[\s\S\]*?\}/,
  `if (options.auditId) {
        eventEmitter.emitPageDiscovered(options.auditId, currentUrl, {
          pagesDiscovered: visited.size + toVisit.length,
          pagesCrawled: results.length,
          progress: 15 + Math.floor((results.length / maxPages) * 30)
        });
      }`
);

code = code.replace(
  /if \(options\.auditId\) auditStore\.appendAuditEvent\(options\.auditId, \{ type: 'page_crawling', message: 'Crawling ' \+ currentUrl, affectedUrl: currentUrl \}\);/,
  `if (options.auditId) eventEmitter.emitPageCrawling(options.auditId, currentUrl);`
);

code = code.replace(
  /if \(options\.auditId\) auditStore\.appendAuditEvent\(options\.auditId, \{ type: 'page_crawled', message: 'Crawled ' \+ url, affectedUrl: url \}\);/,
  `if (options.auditId) eventEmitter.emitPageCrawled(options.auditId, url);`
);

code = code.replace(
  /if \(options\.auditId\) auditStore\.appendAuditEvent\(options\.auditId, \{ type: 'page_failed', message: 'Failed to crawl ' \+ url \+ ': ' \+ error\.message, affectedUrl: url, severity: 'medium' \}\);/,
  `if (options.auditId) eventEmitter.emitPageFailed(options.auditId, url, error.message);`
);

fs.writeFileSync('src/lib/seo/crawler.ts', code);
