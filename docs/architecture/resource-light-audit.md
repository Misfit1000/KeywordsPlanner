# Resource-Light Audit Architecture

SEOIntel is a lightweight SEO, performance, crawlability, reporting, and passive security audit platform. It is not a keyword-generation-first product and does not use AI or paid SEO APIs for audit data.

## Runtime Split

- Vercel handles the frontend, dashboard UI, landing page, report pages, and lightweight job APIs.
- Firebase/Firestore stores audit jobs, live events, crawled page summaries, issues, final reports, and user/project data.
- A separate Node audit worker handles crawling, checks, progress writes, and report generation.

Vercel API routes must create, read, cancel, and export jobs only. They must not run long multi-page crawls.

## Firestore Data Model

- `audits/{auditId}` stores job status, normalized URL details, mode, progress, current phase/check/page, counts, lease fields, timestamps, and errors.
- `audits/{auditId}/events/{eventId}` stores compact live timeline events.
- `audits/{auditId}/pages/{pageId}` stores crawled page summaries only.
- `audits/{auditId}/issues/{issueId}` stores issue summaries and remediation guidance.
- `audits/{auditId}/reports/final` stores scores, summary, top issues, page summaries, export metadata, and generation time.

Raw full HTML is never stored.

## Audit Modes

- Quick Audit is the default: 10 pages, concurrency 2, 6 second fetch timeout.
- Standard Audit: 25 pages, concurrency 3, 8 second fetch timeout.
- Deep Audit: 50 pages, concurrency 3, 10 second fetch timeout. Users must choose it manually and see a warning that deep audits may take longer and use more resources.

## Limits

- Maximum 300 events per audit.
- Maximum 10 pages for Quick, 25 for Standard, and 50 for Deep.
- Maximum 1,000 issues per audit.
- `expiresAt` is set on audit jobs so old data can be cleaned up.

## URL Handling

Inputs such as `example.com`, `www.example.com`, `https://example.com`, `http://example.com`, and paths are normalized server-side and client-side. Domain-only input defaults to HTTPS. Invalid schemes, empty input, malformed URLs, localhost, and private IP targets are rejected in production.

If HTTPS fails, the worker may try HTTP once, records `usedHttpFallback`, and writes an issue titled `HTTPS failed or unavailable`.

## Worker Behavior

The worker polls every few seconds, claims queued jobs with Firestore lease fields, writes `running`, crawls same-domain HTML pages only, checks cancellation before each page/check, and keeps partial results when cancelled.

The crawler uses fetch with `AbortController`, robots.txt rules, limited sitemap discovery, `cheerio` parsing, and a small concurrency queue. It does not use Playwright, Puppeteer, Lighthouse, browser rendering, external broken-link crawling by default, port scanning, exploit testing, credential testing, or admin/private crawling.

## Progress And Live UI

Progress is work-based:

- queued/started: 0-5%
- URL validation/final URL: 5-10%
- robots/sitemap: 10-20%
- crawling pages: 20-55%
- SEO checks: 55-75%
- security checks: 75-90%
- scoring/report: 90-100%

The frontend listens to Firestore realtime updates for the audit document plus latest events, pages, and issues. SSE may remain as a fallback, but Firestore realtime is the production live-progress channel.

The live page shows the submitted input, normalized URL, final URL, hostname, mode, status, current phase, current URL, current check, pages crawled/page limit, issues found, elapsed time, live pages, live issues, timeline, and a Stop Audit button.

## Reports And Exports

JSON, pages CSV, and issues CSV exports read from stored Firestore report/page/issue data. Exports never rerun an audit.

## Cleanup

`scripts/cleanup-old-audits.mjs` deletes expired audit subcollection data for jobs whose `expiresAt` is in the past. Production deployments should schedule this script outside Vercel request handling.

## Competitor Gap Future Work

The legacy competitor-gap API crawler is disabled in Vercel routes. It should return as a queued worker-backed job that:

- creates a lightweight `competitor-gap` job document,
- limits crawls per domain by mode,
- stores extracted page/topic summaries only,
- writes progress to Firestore events,
- never stores raw HTML,
- compares imported or crawled content terms without inventing rankings, traffic, backlinks, authority, or search volume.
