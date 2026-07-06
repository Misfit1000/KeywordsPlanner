const fs = require('fs');

// Patch event-emitter to update progress automatically if provided, or just let auditStore do it.
// Actually, it's better to calculate progress inside audit-runner.ts and crawler.ts

let code = fs.readFileSync('src/lib/audit/audit-runner.ts', 'utf8');

// The weighting: URL Validation 0-5%, Crawling 5-45%, Page Checks 45-85%, Domain Checks 85-90%, Scoring/Report 90-100%

// Update URL validation 
code = code.replace(/progress: 2/, "progress: 2.5");
code = code.replace(/progress: 5/, "progress: 5");
code = code.replace(/progress: 8/, "progress: 5.5");
code = code.replace(/progress: 10/, "progress: 6");

// In crawler, we need to pass a callback to update progress? No, we can just let crawler emit `page_crawled` and update progress there.
// Actually, the easiest way is to modify `auditStore.appendAuditEvent` to recompute progress.
