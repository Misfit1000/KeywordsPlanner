const fs = require('fs');
let code = fs.readFileSync('src/lib/audit/audit-runner.ts', 'utf8');

code = code.replace(
  `const crawlResults = await crawlDomain(job.targetUrl, { maxPages });`,
  `auditStore.appendAuditEvent(jobId, { type: 'audit_started', message: 'Starting SEO audit for ' + job.targetUrl, progress: 2, step: 'Validating URL' });\n    const crawlResults = await crawlDomain(job.targetUrl, { maxPages, auditId: jobId });`
);

code = code.replace(
  `const analyzedPages = crawlResults.map(page => {`,
  `auditStore.appendAuditEvent(jobId, { type: 'step_started', message: 'Analyzing ' + crawlResults.length + ' pages', progress: 60, step: 'Checking pages' });\n    const analyzedPages = crawlResults.map((page, idx) => {`
);

code = code.replace(
  `return {
        url: flatPageData.url`,
  `auditStore.appendAuditEvent(jobId, { type: 'check_completed', message: 'Analyzed ' + flatPageData.url, progress: 60 + Math.floor((idx / crawlResults.length) * 20), step: 'Checking pages' });\n      return {
        url: flatPageData.url`
);

code = code.replace(
  `const baseScore = 100 - (totalIssues / (analyzedPages.length || 1));`,
  `auditStore.appendAuditEvent(jobId, { type: 'step_started', message: 'Calculating scores', progress: 90, step: 'Calculating scores' });\n    const baseScore = 100 - (totalIssues / (analyzedPages.length || 1));`
);

code = code.replace(
  `auditStore.updateJob(jobId, {
      status: 'completed',`,
  `auditStore.appendAuditEvent(jobId, { type: 'audit_completed', message: 'Audit completed', progress: 100, step: 'Complete' });\n    auditStore.updateJob(jobId, {\n      status: 'completed',`
);

fs.writeFileSync('src/lib/audit/audit-runner.ts', code);
