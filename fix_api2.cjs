const fs = require('fs');
let code = fs.readFileSync('src/api/index.ts', 'utf8');

const targetStr = "apiRouter.post('/competitor-gap'";
const firstIndex = code.indexOf(targetStr);
const nextIndex = code.indexOf(targetStr, firstIndex + 1);

// Actually, wait. I can just chop the file right before `apiRouter.post('/competitor-gap'` and re-append it.
const cleanCode = code.substring(0, firstIndex);

const newCompetitorGap = `apiRouter.post('/competitor-gap', async (req, res) => {
  try {
    const { myUrl, competitorUrls, maxPages } = req.body;
    if (!myUrl) return res.status(400).json({ success: false, error: 'My URL is required' });
    
    // Create an audit job for competitor gap
    const auditId = typeof auditStore.createAudit === 'function' 
      ? auditStore.createAudit({ url: myUrl, type: 'competitor-gap' })
      : auditStore.createJob(myUrl);
      
    // Run in background
    setTimeout(async () => {
      try {
        const { eventEmitter } = require('../lib/audit/event-emitter');
        auditStore.updateJob(auditId, { status: 'crawling' });
        eventEmitter.emitAuditEvent(auditId, { type: 'audit_started', message: 'Starting competitor gap analysis', progress: 5, step: 'Crawling ' + myUrl });
        
        const myCrawls = await crawlDomain(myUrl, { maxPages: maxPages || 25, auditId });
        const myPhrases = new Set<string>();
        myCrawls.forEach(c => c.data?.topPhrases.forEach(p => myPhrases.add(p)));
        myCrawls.forEach(c => c.data?.topKeywords.forEach(p => myPhrases.add(p)));
        const myKeywords = Array.from(myPhrases);
        
        const competitorKeywords: Record<string, string[]> = {};
        const crawledCounts: Record<string, number> = {};
        crawledCounts[myUrl] = myCrawls.length;
        
        for (const url of (competitorUrls || [])) {
          let domain = url;
          try { domain = new URL(url).hostname; } catch(e){}
          
          eventEmitter.emitStepStarted(auditId, 'Crawling ' + domain, 'Fetching competitor data for ' + domain);
          const crawls = await crawlDomain(url, { maxPages: maxPages || 25, auditId });
          const phrases = new Set<string>();
          crawls.forEach(c => c.data?.topPhrases.forEach(p => phrases.add(p)));
          crawls.forEach(c => c.data?.topKeywords.forEach(p => phrases.add(p)));
          competitorKeywords[domain] = Array.from(phrases);
          crawledCounts[url] = crawls.length;
          
          eventEmitter.emitStepCompleted(auditId, 'Crawling ' + domain, 'Crawled ' + domain);
        }
        
        eventEmitter.emitStepStarted(auditId, 'Analyzing', 'Analyzing gap');
        const gaps = analyzeCompetitorGap(myKeywords, competitorKeywords);
        eventEmitter.emitStepCompleted(auditId, 'Analyzing', 'Analysis complete');
        
        auditStore.updateJob(auditId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          gaps,
          crawledCounts
        });
        
        eventEmitter.emitAuditCompleted(auditId);
      } catch(e: any) {
         auditStore.updateJob(auditId, { status: 'failed', error: e.message });
         const { eventEmitter } = require('../lib/audit/event-emitter');
         eventEmitter.emitAuditFailed(auditId, e.message);
      }
    }, 0);
    
    res.json({ 
      success: true, 
      data: {
        auditId: auditId,
        eventsUrl: \`/api/tools/audit/events/\${auditId}\`,
        statusUrl: \`/api/tools/audit/status/\${auditId}\`,
        resultUrl: \`/api/tools/audit/result/\${auditId}\`
      } 
    });
  } catch(e: any) {
    res.status(500).json({ success: false, error: e.message || 'Internal Server Error' });
  }
});\n`;

fs.writeFileSync('src/api/index.ts', cleanCode + newCompetitorGap);
