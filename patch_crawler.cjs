const fs = require('fs');
let code = fs.readFileSync('src/lib/seo/crawler.ts', 'utf8');

code = code.replace(
  `import { fetchRobotsTxt, isBlockedByRobots, getSitemapUrlsFromRobots, parseRobotsTxt } from './robots';`,
  `import { fetchRobotsTxt, isBlockedByRobots, getSitemapUrlsFromRobots, parseRobotsTxt } from './robots';\nimport { auditStore } from '../audit/audit-store';`
);

code = code.replace(
  `export interface CrawlOptions {`,
  `export interface CrawlOptions {\n  auditId?: string;`
);

code = code.replace(
  `let robotsTxt = '';
  if (respectRobots) {`,
  `let robotsTxt = '';
  if (options.auditId) auditStore.appendAuditEvent(options.auditId, { type: 'step_started', message: 'Fetching robots.txt', step: 'Checking robots.txt', progress: 5 });
  if (respectRobots) {`
);

code = code.replace(
  `const processQueue = async () => {`,
  `const processQueue = async () => {\n      if (options.auditId) {\n        auditStore.appendAuditEvent(options.auditId, {\n          type: 'page_discovered',\n          pagesDiscovered: visited.size + toVisit.length,\n          pagesCrawled: results.length,\n          progress: 15 + Math.floor((results.length / maxPages) * 40)\n        });\n      }`
);

code = code.replace(
  `// Use an IIFE`,
  `if (options.auditId) auditStore.appendAuditEvent(options.auditId, { type: 'page_crawling', message: 'Crawling ' + currentUrl, affectedUrl: currentUrl });
        // Use an IIFE`
);

code = code.replace(
  `results.push({
                url,`,
  `if (options.auditId) auditStore.appendAuditEvent(options.auditId, { type: 'page_crawled', message: 'Crawled ' + url, affectedUrl: url });\n              results.push({\n                url,`
);

code = code.replace(
  `results.push({
              url,
              finalUrl: url,
              status: 0,
              success: false,`,
  `if (options.auditId) auditStore.appendAuditEvent(options.auditId, { type: 'page_failed', message: 'Failed to crawl ' + url + ': ' + error.message, affectedUrl: url, severity: 'warning' });\n            results.push({\n              url,\n              finalUrl: url,\n              status: 0,\n              success: false,`
);

fs.writeFileSync('src/lib/seo/crawler.ts', code);
