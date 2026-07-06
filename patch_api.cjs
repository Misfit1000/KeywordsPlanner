const fs = require('fs');
let code = fs.readFileSync('src/api/index.ts', 'utf8');

// Replace auditStore import just in case, but it should be the same.
// Add events SSE route

code = code.replace(
  `apiRouter.post('/audit/start', (req, res) => {
  try {
    const { url, maxPages } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    
    const jobId = auditStore.createJob(url);
    // Start job asynchronously
    runAuditJob(jobId, maxPages || 25);
    
    res.json({ success: true, data: { jobId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});`,
  `apiRouter.post('/audit/start', (req, res) => {
  try {
    const { url, maxPages, type = 'seo' } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });
    
    // We assume auditStore was updated to support createAudit(url, type) or similar, but let's check
    const auditId = typeof auditStore.createAudit === 'function' 
      ? auditStore.createAudit({ url, type })
      : auditStore.createJob(url); 
      
    // Start job asynchronously
    runAuditJob(auditId, maxPages || 25);
    
    res.json({ success: true, data: { 
      auditId: auditId || auditId, 
      status: "queued",
      eventsUrl: \`/api/tools/audit/events/\${auditId}\`,
      statusUrl: \`/api/tools/audit/status/\${auditId}\`,
      resultUrl: \`/api/tools/audit/result/\${auditId}\` 
    } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});

apiRouter.get('/audit/events/:id', (req, res) => {
  const auditId = req.params.id;
  const audit = typeof auditStore.getAudit === 'function' ? auditStore.getAudit(auditId) : auditStore.getJob(auditId);
  
  if (!audit) {
    return res.status(404).json({ success: false, error: 'Audit not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  const sendEvent = (eventType, data) => {
    res.write(\`event: \${eventType}\\n\`);
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  };

  // Send existing history
  const history = typeof auditStore.getAuditEvents === 'function' ? auditStore.getAuditEvents(auditId) : [];
  for (const ev of history) {
    sendEvent('audit-event', ev);
  }

  // Subscribe to new events
  const onEvent = (ev) => {
    sendEvent('audit-event', ev);
    if (ev.type === 'audit_completed') {
      sendEvent('audit-complete', { auditId, resultAvailable: true });
    } else if (ev.type === 'audit_failed') {
      sendEvent('audit-error', { auditId, error: ev.message });
    }
  };

  if (typeof auditStore.subscribeToAudit === 'function') {
    auditStore.subscribeToAudit(auditId, onEvent);
  }

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\\n\\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (typeof auditStore.unsubscribeFromAudit === 'function') {
      auditStore.unsubscribeFromAudit(auditId, onEvent);
    }
  });
});
`
);

code = code.replace(
  `apiRouter.get('/audit/status/:id', (req, res) => {
  try {
    const job = auditStore.getJob(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: { status: job.status, jobId: job.jobId, pagesCrawled: job.pagesCrawled } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});`,
  `apiRouter.get('/audit/status/:id', (req, res) => {
  try {
    const job = typeof auditStore.getAudit === 'function' ? auditStore.getAudit(req.params.id) : auditStore.getJob(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Audit not found' });
    
    const events = typeof auditStore.getAuditEvents === 'function' ? auditStore.getAuditEvents(req.params.id) : [];
    
    res.json({ success: true, data: { 
      id: job.id || job.jobId, 
      status: job.status, 
      progress: job.progress || 0,
      currentStep: job.currentStep,
      pagesDiscovered: job.pagesDiscovered,
      pagesCrawled: job.pagesCrawled,
      checksTotal: job.checksTotal,
      checksCompleted: job.checksCompleted,
      issuesFound: job.issuesFound,
      latestEvents: events.slice(-10),
      resultAvailable: job.status === 'completed'
    } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});`
);

fs.writeFileSync('src/api/index.ts', code);
