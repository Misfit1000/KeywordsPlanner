import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateBlogFixture, getBlogFixtureConfiguration, regenerateFixtureSection } from '../src/lib/blog/fixture-provider';
import { inspectFeedXml, testApprovedSourceUrl, validateApprovedSourceInput } from '../src/lib/blog/source-management';
import { validateCalendarMove } from '../src/lib/blog/freshness';
import { renderBlogArticleHtml } from '../src/lib/blog/render';
import { renderBlogNewsSitemap, renderBlogRss, renderBlogSitemap } from '../src/lib/blog/sitemap';
import { mapBlogPostRow } from '../src/lib/blog/repository';

const mode = process.argv[2] || 'all';
const source = (path: string) => readFileSync(path, 'utf8');
const originalEnv = { ...process.env };
const enableFixture = () => Object.assign(process.env, { NODE_ENV: 'test', BLOG_FIXTURE_PROVIDER_ENABLED: 'true', ALLOW_BLOG_FIXTURE_GENERATION: 'true' });
const restoreEnv = () => { for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key]; Object.assign(process.env, originalEnv); };

function fixturePost() {
  enableFixture();
  const draft = generateBlogFixture({ topic: 'canonical URL validation', articleType: 'urgent_news', scenario: 'news' });
  const now = new Date().toISOString();
  return mapBlogPostRow({
    id: 'fixture-post', slug: draft.suggestedSlug, title: draft.title, excerpt: draft.excerpt, tagline: draft.tagline, summary: draft.summary,
    content_html: draft.contentHtml, content_text: draft.contentHtml.replace(/<[^>]+>/g, ' '), focus_keyword: draft.focusKeyword, tags: draft.tags,
    seo_title: draft.seoTitle, meta_description: draft.metaDescription, canonical_url: null, og_image_url: 'https://example.com/image.jpg', og_title: draft.title,
    og_description: draft.metaDescription, og_image_alt: 'Illustration showing a canonical URL review', og_image_attribution: 'Fixture licence record',
    responsive_images: [{ width: 480, height: 270, format: 'webp', mimeType: 'image/webp', fileSize: 12000, storagePath: 'fixture/480.webp', storageUrl: 'https://example.com/480.webp', status: 'ready' }],
    status: 'draft', origin: 'admin_manual', article_type: 'urgent_news', topic_cluster: 'technical seo', language: 'en', robots_directive: 'noindex,nofollow', freshness_status: 'high',
    source_published_at: now, source_updated_at: now, discovered_at: now, continuing_development: false, scheduled_at: null, recommended_publication_at: null,
    publication_rule: '', publication_urgency: 'normal', schedule_version: 0, publication_reason: 'Fixture test content', quality_status: 'passed', quality_results: null,
    originality_status: 'passed', source_status: 'passed', prerender_status: 'passed', image_status: 'passed', sources: draft.sources, related_articles: [], image_variants: [],
    generation_job_id: 'fixture-job', batch_id: null, author_id: null, reviewer_id: null, updated_by: null, published_at: null, created_at: now, updated_at: now,
  });
}

async function run(selected: string) {
  if (selected === 'blog-fixture-provider') {
    assert.equal(getBlogFixtureConfiguration({ NODE_ENV: 'test' } as any).enabled, false);
    assert.equal(getBlogFixtureConfiguration({ NODE_ENV: 'production', BLOG_FIXTURE_PROVIDER_ENABLED: 'true', ALLOW_BLOG_FIXTURE_GENERATION: 'true' } as any).productionBlocked, true);
    enableFixture();
    const first = generateBlogFixture({ topic: 'crawl validation', scenario: 'evergreen' });
    const second = generateBlogFixture({ topic: 'crawl validation', scenario: 'evergreen' });
    assert.deepEqual(first, second); assert.match(first.contentHtml, /<h2>/); assert.equal(first.fixtureLabel, 'Fixture test content');
    assert.ok(first.contentHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length >= 1500);
    assert.equal(generateBlogFixture({ topic: 'x', scenario: 'invalid' }).contentHtml, '<p>Invalid fixture.</p>');
    assert.equal(generateBlogFixture({ topic: 'x', scenario: 'missing_sources' }).sources.length, 0);
    const original = generateBlogFixture({ topic: 'x', scenario: 'evergreen' });
    assert.equal(generateBlogFixture({ topic: 'x', scenario: 'originality_failure' }).contentHtml, `${original.contentHtml}${original.contentHtml}`);
    assert.match(source('src/lib/blog/server/vercel-workflow.ts'), /fixtureScenario === 'image_failure'/);
    assert.throws(() => generateBlogFixture({ topic: 'x', scenario: 'timeout' }), /timeout simulated/i);
    assert.throws(() => generateBlogFixture({ topic: 'x', scenario: 'malformed' }), /structured-output failure/i);
  } else if (selected === 'blog-fixture-safety') {
    const fixture = source('src/lib/blog/fixture-provider.ts'); const api = source('src/api/index.ts'); const worker = source('src/lib/blog/server/vercel-workflow.ts');
    assert.match(fixture, /ALLOW_PRODUCTION_BLOG_FIXTURE_GENERATION/); assert.match(api, /requireAdminRequester/); assert.match(api, /requireBlogFixtureProvider/);
    assert.match(worker, /status: fixture \? 'draft'/); assert.match(worker, /'noindex,nofollow'/); assert.doesNotMatch(source('src/components/blog/BlogAutomationPanel.tsx') + source('src/components/blog/BlogProviderFreeWorkspace.tsx'), /BLOG_FIXTURE_PROVIDER_ENABLED/);
  } else if (selected === 'blog-source-management') {
    const migration = source('supabase/migrations/014_blog_provider_free_editorial_operations.sql'); const api = source('src/api/index.ts');
    assert.match(migration, /create table if not exists public\.blog_approved_sources/); assert.match(migration, /enable row level security/); assert.match(migration, /is_admin_user/);
    assert.match(api, /create_blog_approved_source/); assert.match(api, /test_blog_approved_source/); assert.match(api, /delete_blog_approved_source/);
  } else if (selected === 'blog-feed-security') {
    const rss = inspectFeedXml('<?xml version="1.0"?><rss><channel><item><link>https://example.com/a</link><pubDate>Tue, 14 Jul 2026 10:00:00 GMT</pubDate></item><item><link>https://example.com/a</link></item></channel></rss>', 'https://example.com/feed');
    const atom = inspectFeedXml('<?xml version="1.0"?><feed><entry><link href="https://example.com/b"/><updated>2026-07-14T10:00:00Z</updated></entry></feed>', 'https://example.com/feed');
    assert.equal(rss.format, 'rss'); assert.equal(rss.duplicateItemCount, 1); assert.equal(atom.format, 'atom');
    assert.throws(() => inspectFeedXml('not xml', 'https://example.com'), /INVALID_XML/);
    assert.throws(() => validateApprovedSourceInput({ name: 'Local', publisher: 'Local', sourceUrl: 'https://127.0.0.1/feed' }), /private/i);
    const failed = await testApprovedSourceUrl('https://example.com/feed', 'rss', async () => { throw Object.assign(new Error('too large'), { code: 'RESPONSE_TOO_LARGE' }); });
    assert.equal(failed.success, false);
    const manual = await testApprovedSourceUrl('https://example.com/reference', 'manual_url', async () => ({ requestedUrl: 'https://example.com/reference', finalUrl: 'https://example.com/reference', status: 200, headers: {}, contentType: 'text/html', body: '<html><title>Reference</title></html>', bodyBytes: 44, redirectCount: 0, durationMs: 1 }));
    assert.equal(manual.success, true); assert.equal(manual.format, 'web_page');
  } else if (selected === 'blog-editorial-review') {
    const ui = source('src/components/blog/BlogEditorialReviewPanel.tsx');
    for (const term of ['Claims and sources', 'Originality review', 'Image licence', 'Static HTML', 'Sitemap and RSS']) assert.match(ui, new RegExp(term));
    assert.match(ui, /target="_blank"/); assert.doesNotMatch(ui, /system prompt|API key/i);
  } else if (selected === 'blog-section-review') {
    const post = fixturePost(); const before = post.contentHtml; const result = regenerateFixtureSection({ post, sectionKey: 'introduction', action: 'improve_clarity' });
    assert.notEqual(result.candidate.contentHtml, before); assert.equal(result.candidate.contentHtml.slice(result.selection.end + result.replacementHtml.length - result.selection.beforeHtml.length), before.slice(result.selection.end));
    const ui = source('src/components/blog/BlogSectionRevisionPanel.tsx'); assert.match(ui, /Current version/); assert.match(ui, /Proposed version/); assert.match(ui, /Accept/); assert.match(ui, /Reject/);
  } else if (selected === 'blog-calendar-complete') {
    const ui = source('src/components/blog/BlogContentCalendar.tsx');
    for (const term of ['onPointerDown', 'onDragStart', 'Move', 'Undo', 'recommended', 'datetime-local']) assert.match(ui, new RegExp(term, 'i'));
    const invalid = validateCalendarMove({ scheduledAt: '2026-07-15T09:00:00Z', timezone: 'UTC', existingPublicationTimes: ['2026-07-15T09:30:00Z'], minimumSpacingMinutes: 120, maximumPostsPerDay: 2, blackoutWeekdays: [], blackoutDates: [] });
    assert.equal(invalid.valid, false);
  } else if (selected === 'blog-responsive-image-render') {
    const post = fixturePost(); post.status = 'published'; post.publishedAt = new Date().toISOString(); post.robotsDirective = 'index,follow,max-image-preview:large';
    post.imageVariants = [{ width: 480, height: 270, format: 'webp', mimeType: 'image/webp', fileSize: 12000, storagePath: 'x', storageUrl: 'https://example.com/480.webp', status: 'ready' }];
    const html = renderBlogArticleHtml(post, 'https://example.com');
    for (const token of ['<picture>', 'srcset=', 'sizes=', 'width="480"', 'height="270"', 'alt=', 'loading="eager"', 'decoding="async"', 'Fixture licence record']) assert.match(html, new RegExp(token));
  } else if (selected === 'blog-public-initial-html') {
    const post = fixturePost(); const draftHtml = renderBlogArticleHtml(post, 'https://example.com');
    for (const token of ['<title>', 'meta name="description"', 'rel="canonical"', 'noindex,nofollow', '<h1>', '<h2>', 'application/ld', 'BreadcrumbList', '<a href=']) assert.match(draftHtml, new RegExp(token));
    assert.match(source('server.ts'), /status\(404\).*Article not found/s);
  } else if (selected === 'blog-feed-output') {
    const sitemapSource = source('src/lib/blog/sitemap.ts');
    assert.match(sitemapSource, /status === 'published'|listPublished/); assert.match(sitemapSource, /freshnessStatus === 'high'/); assert.match(sitemapSource, /<rss version="2\.0">/);
    assert.equal(typeof renderBlogSitemap, 'function'); assert.equal(typeof renderBlogNewsSitemap, 'function'); assert.equal(typeof renderBlogRss, 'function');
  } else if (selected === 'blog-operations') {
    const api = source('src/api/index.ts'); const repository = source('src/lib/blog/automation-repository.ts');
    for (const term of ['staleLeases', 'sourceFailures', 'imageFailures', 'prerenderFailures', 'validate_sitemap', 'validate_rss', 'pause_automation', 'pause_publication']) assert.match(api, new RegExp(term));
    assert.match(repository, /recoverJob/); assert.match(api, /BLOG_OPERATION_REASON_REQUIRED/); assert.match(api, /logBlogAction/);
  } else if (selected === 'blog-provider-disabled') {
    const ui = source('src/components/blog/BlogAutomationPanel.tsx'); const api = source('src/api/index.ts');
    assert.match(ui, /Available now:/); assert.match(ui, /Requires provider:/); assert.match(ui, /Provider not configured/); assert.match(api, /BLOG_PROVIDER_NOT_CONFIGURED/);
    assert.doesNotMatch(source('src/lib/blog/server/vercel-workflow.ts'), /Gemini|generateBlogWithGemini/);
  }
}

try {
  const modes = mode === 'all' ? ['blog-fixture-provider', 'blog-fixture-safety', 'blog-source-management', 'blog-feed-security', 'blog-editorial-review', 'blog-section-review', 'blog-calendar-complete', 'blog-responsive-image-render', 'blog-public-initial-html', 'blog-feed-output', 'blog-operations', 'blog-provider-disabled'] : [mode];
  for (const selected of modes) { await run(selected); console.log(`${selected}: passed`); }
} finally { restoreEnv(); }
