import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../src/api/index.ts';
import { auditRepository } from '../src/lib/supabase/audit-repository.ts';
import { parseSitemapXml } from '../src/lib/seo/sitemap.ts';
import { runOneAudit } from '../src/workers/audit-worker.ts';

process.env.SEOINTEL_ALLOW_PRIVATE_TEST_TARGETS = 'true';

const sitemapIndex = parseSitemapXml('<?xml version="1.0"?><sitemapindex><sitemap><loc>https://example.com/pages.xml</loc></sitemap></sitemapindex>');
assert.deepEqual(sitemapIndex.urls, []);
assert.deepEqual(sitemapIndex.sitemaps, ['https://example.com/pages.xml']);

if (!auditRepository.isSupabaseEnabled()) {
  console.log('Running local in-memory E2E mode - not production Supabase.');
}

function listen(server, port = 0) {
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server.address())));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Timed out waiting for deterministic audit state.');
}

const targetServer = http.createServer((req, res) => {
  if (req.url === '/robots.txt') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n');
    return;
  }
  if (req.url === '/sitemap.xml') {
    res.writeHead(200, { 'content-type': 'application/xml' });
    res.end('<?xml version="1.0"?><urlset><url><loc>http://127.0.0.1:TARGET/about</loc></url></urlset>');
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/html',
    'x-content-type-options': 'nosniff',
  });
  res.end(`<!doctype html>
    <html lang="en">
      <head><title>Smoke Test</title><meta name="description" content="Smoke test page"></head>
      <body>
        <h1>Smoke Test</h1>
        <a href="/about">About</a>
        <img src="/missing.png">
      </body>
    </html>`);
});

const targetAddress = await listen(targetServer);
targetServer.removeAllListeners('request');
targetServer.on('request', (req, res) => {
  if (req.url === '/robots.txt') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(`User-agent: *\nDisallow: /blocked\nSitemap: http://127.0.0.1:${targetAddress.port}/sitemap.xml\n`);
    return;
  }
  if (req.url === '/sitemap.xml') {
    res.writeHead(200, { 'content-type': 'application/xml' });
    const paths = [
      '/broken', '/blocked', '/redirect-source', '/redirect-target', '/redirect-target#duplicate',
      '/page-1', '/page-1/', '/page-1?utm_source=duplicate',
      ...Array.from({ length: 100 }, (_value, index) => `/page-${index + 1}`),
    ];
    res.end(`<?xml version="1.0"?><urlset>${paths.map((path) => `<url><loc>http://127.0.0.1:${targetAddress.port}${path}</loc></url>`).join('')}</urlset>`);
    return;
  }
  if (req.url === '/broken') {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Unavailable');
    return;
  }
  if (req.url === '/redirect-source') {
    res.writeHead(302, { location: `http://127.0.0.1:${targetAddress.port}/redirect-target` });
    res.end();
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/html',
    'x-content-type-options': 'nosniff',
  });
  res.end(`<!doctype html>
    <html lang="en">
      <head><title>${req.url === '/about' ? 'About' : 'Home'} Smoke Test</title><meta name="description" content="Smoke test page"></head>
      <body>
        <h1>${req.url === '/about' ? 'About' : 'Home'}</h1>
        <a href="/about">About</a>
        <img src="/missing.png">
      </body>
    </html>`);
});

const smallTargetServer = http.createServer((req, res) => {
  if (req.url === '/robots.txt') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('User-agent: *\nAllow: /\n');
    return;
  }
  if (req.url?.includes('sitemap')) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('No sitemap');
    return;
  }
  if (req.url !== '/' && req.url !== '/only') {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html', 'x-content-type-options': 'nosniff' });
  res.end(`<!doctype html><html lang="en"><head><title>${req.url === '/' ? 'Small site' : 'Only page'}</title><meta name="description" content="Small deterministic fixture"></head><body><h1>Small fixture</h1>${req.url === '/' ? '<a href="/only">Only page</a>' : ''}</body></html>`);
});
const smallTargetAddress = await listen(smallTargetServer);

const app = express();
app.use(express.json());
app.use('/api/tools', apiRouter);
app.use('/api', (req, res) => res.status(404).json({ success: false, error: `API route not found: ${req.method} ${req.originalUrl}` }));
const apiServer = http.createServer(app);
const apiAddress = await listen(apiServer);

try {
  const startedAt = Date.now();
  const startResponse = await fetch(`http://127.0.0.1:${apiAddress.port}/api/tools/audit/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: `http://127.0.0.1:${targetAddress.port}`, mode: 'quick' }),
  });
  const startJson = await startResponse.json();
  assert.equal(startJson.success, true);
  assert.ok(Date.now() - startedAt < 1000, 'start route should return quickly');

  const auditId = startJson.data.auditId;
  let live = await auditRepository.getLiveData(auditId);
  assert.equal(live.audit.status, 'queued');
  assert.ok(live.latestEvents.some((event) => event.type === 'audit_queued'));

  const claimed = await runOneAudit('smoke-worker');
  assert.equal(claimed, true);

  live = await auditRepository.getLiveData(auditId);
  const retainedEvents = await auditRepository.getEvents(auditId, 300);
  assert.equal(live.audit.status, 'completed_with_warnings');
  assert.equal(live.audit.progress, 100);
  assert.equal(live.audit.pagesCrawled, 5, 'failed candidates must not consume the five-page analysis allowance');
  assert.ok(live.audit.pagesDiscovered > live.audit.pageLimit, 'the bounded candidate pool should retain replacement pages');
  assert.ok(retainedEvents.some((event) => event.type === 'page_crawling' && event.currentUrl));
  assert.ok(retainedEvents.some((event) => event.type === 'page_crawled' && event.data?.responseTimeMs !== undefined));
  assert.ok(retainedEvents.some((event) => event.type === 'issue_found'));
  assert.ok(retainedEvents.some((event) => event.type === 'score_updated'));
  assert.ok(retainedEvents.some((event) => event.type === 'audit_completed_with_warnings'));
  const coverageEvent = retainedEvents.find((event) => event.type === 'crawl_coverage_completed');
  assert.equal(coverageEvent?.data?.quotaReached, true);
  assert.equal(coverageEvent?.data?.pagesAnalysed, 5);
  assert.ok(live.latestPages.some((page) => page.responseTimeMs >= 0));
  assert.ok(live.latestIssues.length > 0);
  assert.ok(live.finalReport);
  assert.equal(JSON.stringify(live).includes('<!doctype'), false, 'raw HTML should not be stored');

  const cancelResponse = await fetch(`http://127.0.0.1:${apiAddress.port}/api/tools/audit/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: `http://127.0.0.1:${targetAddress.port}`, mode: 'quick' }),
  });
  const cancelJson = await cancelResponse.json();
  const cancelId = cancelJson.data.auditId;
  const cancelResult = await fetch(`http://127.0.0.1:${apiAddress.port}/api/tools/audit/cancel/${cancelId}`, { method: 'POST' });
  const cancelBody = await cancelResult.json();
  assert.equal(cancelBody.success, true);
  const cancelled = await auditRepository.getAudit(cancelId);
  assert.equal(cancelled.status, 'cancelled');

  const exportResponse = await fetch(`http://127.0.0.1:${apiAddress.port}/api/tools/audit/export/${auditId}/json`);
  const exportBody = await exportResponse.json();
  assert.equal(exportBody.success, true);

  const fullAudit = await auditRepository.createAuditJob({
    submittedInput: `http://127.0.0.1:${targetAddress.port}`,
    normalizedUrl: `http://127.0.0.1:${targetAddress.port}/`,
    hostname: '127.0.0.1',
    mode: 'standard',
    requestedMode: 'standard',
    effectiveMode: 'standard',
    plan: 'paid',
    processingTier: 'paid',
    pageLimit: 50,
    queuePriority: 50,
    guestKeyHash: 'full-audit-quota-smoke',
  });
  assert.equal(await runOneAudit('smoke-worker-full'), true);
  const fullLive = await auditRepository.getLiveData(fullAudit.id);
  const fullEvents = await auditRepository.getEvents(fullAudit.id, 300);
  assert.equal(fullLive.audit.status, 'completed_with_warnings');
  assert.equal(fullLive.audit.pagesCrawled, 50, 'Full Audit must analyse 50 healthy pages when the site exposes enough pages');
  const fullCoverage = fullEvents.find((event) => event.type === 'crawl_coverage_completed');
  assert.equal(fullCoverage?.data?.quotaReached, true);
  assert.equal(fullCoverage?.data?.pagesAnalysed, 50);
  assert.ok(Number(fullCoverage?.data?.pagesAttempted) > 50, 'failed candidates should be replaced without reducing successful coverage');
  assert.equal(fullCoverage?.data?.stopReason, 'page_limit_reached');
  const fullScoreUpdates = fullEvents.filter((event) => event.type === 'score_updated');
  assert.ok(fullScoreUpdates.length >= 1 && fullScoreUpdates.length <= 11, '50-page scoring must stay batched plus one final update');
  assert.ok(fullScoreUpdates.length * 10 < fullLive.audit.checksCompleted, 'score writes must remain far below individual checks');
  const fullPersistedPages = await auditRepository.getPages(fullAudit.id, 500);
  assert.equal(fullLive.finalReport?.pages.length, fullPersistedPages.length, 'report page rows must match persisted page rows');
  const fullSuccessfulUrls = fullPersistedPages.filter((page) => page.fetchStatus === 'success').map((page) => page.url);
  assert.equal(new Set(fullSuccessfulUrls).size, fullSuccessfulUrls.length, 'redirect aliases must not count the same final page twice');

  const deepAudit = await auditRepository.createAuditJob({
    submittedInput: `http://127.0.0.1:${targetAddress.port}`,
    normalizedUrl: `http://127.0.0.1:${targetAddress.port}/`,
    hostname: '127.0.0.1',
    mode: 'deep', requestedMode: 'deep', effectiveMode: 'deep', plan: 'agency', processingTier: 'agency',
    pageLimit: 75, queuePriority: 100, guestKeyHash: 'deep-audit-quota-smoke',
  });
  assert.equal(await runOneAudit('smoke-worker-deep'), true);
  const deepLive = await auditRepository.getLiveData(deepAudit.id);
  const deepEvents = await auditRepository.getEvents(deepAudit.id, 1000);
  const deepCoverage = deepEvents.find((event) => event.type === 'crawl_coverage_completed');
  assert.equal(deepLive.audit.pagesCrawled, 75, 'Deep Audit must analyse 75 healthy sitemap pages when enough are reachable');
  assert.equal(deepLive.audit.pageLimit, 75);
  assert.equal(deepCoverage?.data?.quotaReached, true);
  assert.equal(deepCoverage?.data?.stopReason, 'page_limit_reached');
  assert.equal(deepCoverage?.data?.pagesAnalysed, 75);
  const deepScoreUpdates = deepEvents.filter((event) => event.type === 'score_updated');
  assert.ok(deepScoreUpdates.length >= 1 && deepScoreUpdates.length <= 16, '75-page scoring must stay batched plus one final update');
  assert.ok(deepScoreUpdates.length * 10 < deepLive.audit.checksCompleted, 'deep score writes must remain far below individual checks');
  assert.equal(deepLive.finalReport?.scores?.deepAudit?.sitemapExpansion, true);
  const deepPersistedPages = await auditRepository.getPages(deepAudit.id, 500);
  assert.equal(deepLive.finalReport?.pages.length, deepPersistedPages.length);
  assert.ok(deepLive.audit.pagesCrawled <= 75, 'Deep Audit must never exceed its admitted limit');

  const cancelledDuringCrawl = await auditRepository.createAuditJob({
    submittedInput: `http://127.0.0.1:${targetAddress.port}`,
    normalizedUrl: `http://127.0.0.1:${targetAddress.port}/`,
    hostname: '127.0.0.1',
    mode: 'standard', requestedMode: 'standard', effectiveMode: 'standard', plan: 'paid', processingTier: 'paid',
    pageLimit: 50, queuePriority: 50, guestKeyHash: 'cancel-during-crawl-smoke',
  });
  const cancelledWorkerRun = runOneAudit('smoke-worker-cancel-running');
  await waitFor(async () => (await auditRepository.getAudit(cancelledDuringCrawl.id))?.status === 'running');
  assert.equal(await auditRepository.cancelAudit(cancelledDuringCrawl.id), true);
  assert.equal(await cancelledWorkerRun, true);
  const cancelledDuringCrawlResult = await auditRepository.getAudit(cancelledDuringCrawl.id);
  assert.equal(cancelledDuringCrawlResult?.status, 'cancelled');
  assert.ok((cancelledDuringCrawlResult?.pagesCrawled || 0) < 50, 'cancellation must stop before the page allowance is consumed');

  const smallAudit = await auditRepository.createAuditJob({
    submittedInput: `http://127.0.0.1:${smallTargetAddress.port}`,
    normalizedUrl: `http://127.0.0.1:${smallTargetAddress.port}/`,
    hostname: '127.0.0.1',
    mode: 'quick', requestedMode: 'quick', effectiveMode: 'quick', plan: 'free', processingTier: 'free',
    pageLimit: 5, queuePriority: 10, guestKeyHash: 'small-site-queue-smoke',
  });
  assert.equal(await runOneAudit('smoke-worker-small'), true);
  const smallLive = await auditRepository.getLiveData(smallAudit.id);
  const smallEvents = await auditRepository.getEvents(smallAudit.id, 300);
  const smallCoverage = smallEvents.find((event) => event.type === 'crawl_coverage_completed');
  assert.equal(smallLive.audit.pagesCrawled, 2);
  assert.equal(smallCoverage?.data?.quotaReached, false);
  assert.equal(smallCoverage?.data?.stopReason, 'crawl_queue_exhausted');
  assert.match(String(smallCoverage?.message), /all 2 eligible public pages/i);

  console.log('Resource-light audit smoke test passed.');
} finally {
  await close(apiServer);
  await close(targetServer);
  await close(smallTargetServer);
}
