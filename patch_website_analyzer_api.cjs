const fs = require('fs');
let code = fs.readFileSync('src/api/index.ts', 'utf8');

const targetStr = "apiRouter.post('/website/analyze'";
const firstIndex = code.indexOf(targetStr);

const cleanCode = code.substring(0, firstIndex);

const newWebsiteAnalyze = `apiRouter.post('/website/analyze', async (req, res) => {
  try {
    const { url, maxPages } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    
    // Create an audit job for website analyze
    const auditId = typeof auditStore.createAudit === 'function' 
      ? auditStore.createAudit({ url, type: 'seo' }) // acts like SEO
      : auditStore.createJob(url);
      
    // Run in background
    setTimeout(async () => {
      try {
        const { eventEmitter } = require('../lib/audit/event-emitter');
        auditStore.updateJob(auditId, { status: 'crawling' });
        eventEmitter.emitAuditEvent(auditId, { type: 'audit_started', message: 'Starting website analyzer', progress: 5, step: 'Crawling ' + url });
        
        eventEmitter.emitStepStarted(auditId, 'Crawling', 'Crawling website');
        const crawls = await crawlDomain(url, { maxPages: maxPages || 25, auditId });
        eventEmitter.emitStepCompleted(auditId, 'Crawling', 'Crawling complete');
        
        eventEmitter.emitStepStarted(auditId, 'Analyzing', 'Analyzing pages');
        const audit = auditFullCrawl(crawls);
        eventEmitter.emitStepCompleted(auditId, 'Analyzing', 'Analysis complete');
        
        const initialCrawl = crawls.find(c => c.url === url || c.finalUrl === url) || crawls[0];
        
        auditStore.updateJob(auditId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          crawledPages: crawls.length,
          data: initialCrawl?.data, 
          fullAudit: audit,
          audit: audit.pageResults.find(p => p.url === initialCrawl?.url)?.audit || audit.pageResults[0]?.audit
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
});

apiRouter.post('/clusters', (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) return res.status(400).json({ success: false, error: 'Keywords array is required' });
    
    const clusters = clusterKeywords(keywords);
    res.json({ success: true, data: { clusters } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});

apiRouter.post('/content-brief', (req, res) => {
  try {
    const { cluster } = req.body;
    if (!cluster) return res.status(400).json({ success: false, error: 'Cluster object is required' });
    
    const brief = buildContentBrief(cluster);
    res.json({ success: true, data: { brief } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});

` + code.substring(code.indexOf("apiRouter.post('/competitor-gap'"));

fs.writeFileSync('src/api/index.ts', cleanCode + newWebsiteAnalyze);
