import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { resolveBlogLengthRange } from '../src/lib/blog/length-policy';
import { classifyBlogFreshness, selectAutomaticBlogOpportunities, selectAutomaticPublicationTime, validateCalendarMove } from '../src/lib/blog/freshness';
import { honestCompetitorTrafficLabel } from '../src/lib/blog/research';
import { generateResponsiveImageVariants } from '../src/lib/blog/images';
import { replaceSelectedBlogSection, selectBlogSection } from '../src/lib/blog/section-regeneration';

const mode = process.argv[2] || 'all';
const root = new URL('../', import.meta.url);
const source = (path: string) => readFileSync(new URL(path, root), 'utf8');

async function length() {
  assert.deepEqual(resolveBlogLengthRange({ articleType: 'urgent_news' }), { minimum: 700, maximum: 1200, label: 'Brief urgent news update' });
  assert.equal(resolveBlogLengthRange({ articleType: 'technical_guide' }).maximum, 3500);
  assert.equal(resolveBlogLengthRange({ articleType: 'evergreen_guide', mode: 'brief' }).minimum, 700);
  assert.doesNotMatch(source('src/lib/blog/quality.ts'), /At least 1,500 useful words/);
}

const opportunity = (hours: number, continuing = false) => ({ sourceUrl: `https://example.com/${hours}`, sourceTitle: 'Official update', publisher: 'Example', publishedAt: new Date(Date.now() - hours * 3_600_000).toISOString(), discoveredAt: new Date().toISOString(), topicCluster: `cluster-${hours}`, searchIntent: `intent-${hours}`, proposedAngle: 'Practical impact', audienceRelevance: 0.9, sourceAuthority: 0.9, novelty: 0.9, primarySource: true, continuingDevelopment: continuing });
async function freshness() {
  assert.equal(classifyBlogFreshness(opportunity(24)).status, 'high');
  assert.equal(classifyBlogFreshness(opportunity(72)).status, 'medium');
  assert.equal(classifyBlogFreshness(opportunity(240)).status, 'low');
  assert.equal(classifyBlogFreshness(opportunity(1000, true)).status, 'medium');
  assert.equal(selectAutomaticBlogOpportunities([opportunity(10), opportunity(20)], new Date(), 2).length, 2);
}

async function review() {
  const migration = source('supabase/migrations/013_blog_provider_and_editor_completion.sql');
  assert.match(migration, /required_reviewed_articles_before_autopublish integer not null default 30/);
  assert.match(source('src/lib/blog/repository.ts'), /strict_autopilot_enabled/);
  assert.match(source('src/lib/blog/automation-repository.ts'), /Strict Autopilot remains locked/);
}

async function publication() {
  const scheduled = selectAutomaticPublicationTime({ opportunity: opportunity(12), now: new Date('2030-01-01T00:00:00Z'), settings: { automaticTiming: true, timezone: 'UTC', preferredStartHour: 9, preferredEndHour: 17, minimumSpacingMinutes: 180, delayAfterDiscoveryMinutes: 0, maximumPostsPerDay: 2, blackoutDates: ['2030-01-01'] } });
  assert.ok(scheduled.scheduledAt?.startsWith('2030-01-02'));
  assert.equal(selectAutomaticPublicationTime({ opportunity: opportunity(12), settings: { automaticTiming: true, timezone: 'UTC', preferredStartHour: 9, preferredEndHour: 17, minimumSpacingMinutes: 180, delayAfterDiscoveryMinutes: 0, maximumPostsPerDay: 2, pauseAllPublication: true } }).scheduledAt, null);
  assert.equal(validateCalendarMove({ scheduledAt: new Date(Date.now() + 86_400_000).toISOString(), timezone: 'UTC', minimumSpacingMinutes: 180, maximumPostsPerDay: 2 }).valid, true);
}

async function competitor() {
  assert.equal(honestCompetitorTrafficLabel({ requestedLabel: 'High traffic' }).label, 'Traffic data unavailable');
  assert.equal(honestCompetitorTrafficLabel({ requestedLabel: 'High traffic', verifiedDataSource: 'Approved provider export', observedAt: '2030-01-01T00:00:00Z' }).label, 'High traffic');
  assert.doesNotMatch(source('src/lib/blog/research.ts'), /estimated monthly traffic|ranking probability|traffic potential/i);
}

async function terminology() {
  const blogSources = ['src/lib/blog/server/vercel-workflow.ts', 'src/lib/blog/quality.ts', 'src/components/blog/BlogAutomationPanel.tsx'].map(source).join('\n');
  assert.match(blogSources, /internal links/i); assert.match(blogSources, /external references/i);
  assert.doesNotMatch(blogSources, /create(?:s|d)? backlinks|backlink generation/i);
}

async function calendar() {
  const ui = source('src/components/blog/BlogContentCalendar.tsx'); const api = source('src/api/index.ts');
  for (const token of ['draggable', 'onPointerDown', 'datetime-local', 'Undo move', 'reset_recommended_time', 'data-calendar-drop-target']) assert.match(ui, new RegExp(token));
  assert.match(api, /BLOG_SCHEDULE_CONFLICT/); assert.match(api, /scheduleVersion/);
}

async function section() {
  const post: any = { contentHtml: '<p>Intro stays.</p><h2>First</h2><p>Old first.</p><h2>Second</h2><p>Second stays.</p>', tagline: 'Tagline', summary: 'Summary', metaDescription: 'Meta' };
  const selected = selectBlogSection(post, 'heading:0');
  const changed = replaceSelectedBlogSection(post, selected, '<h2>First</h2><p>New first.</p>');
  assert.match(changed.contentHtml, /New first/); assert.match(changed.contentHtml, /Second stays/); assert.doesNotMatch(changed.contentHtml, /Old first/);
  assert.match(source('src/lib/blog/repository.ts'), /status === 'pending'/);
}

async function images() {
  const fixture = await sharp({ create: { width: 900, height: 506, channels: 3, background: '#2563eb' } }).png().toBuffer();
  const generated = await generateResponsiveImageVariants(fixture, 'image/png');
  const widths = [...new Set(generated.variants.map((variant) => variant.width))];
  assert.deepEqual(widths, [320, 480, 768]); assert.ok(generated.variants.some((variant) => variant.format === 'webp')); assert.ok(generated.variants.some((variant) => variant.format === 'avif')); assert.ok(generated.variants.every((variant) => variant.width <= 900));
  assert.match(source('src/lib/blog/render.ts'), /srcset/); assert.match(source('src/lib/blog/images.ts'), /cleanupOrphanedBlogImageVariants/);
}

async function liveSafety() {
  for (const file of ['scripts/smoke-groq-live.mts', 'scripts/smoke-blog-live-vercel-workflow.mts', 'scripts/smoke-blog-live-vercel-publication.mts']) {
    const text = source(file); assert.match(text, /Skipped:|ALLOW_LIVE/); assert.doesNotMatch(text, /nvapi-/);
  }
}

const tests: Record<string, () => Promise<void>> = { 'blog-length-policy': length, 'blog-freshness-policy': freshness, 'blog-review-threshold': review, 'blog-publication-rules': publication, 'blog-competitor-data-honesty': competitor, 'blog-link-terminology': terminology, 'blog-calendar-drag': calendar, 'blog-calendar-keyboard': calendar, 'blog-section-regeneration': section, 'blog-responsive-images': images, 'blog-live-test-safety': liveSafety };
try {
  const selected = mode === 'all' ? Object.entries(tests) : [[mode, tests[mode]] as const];
  for (const [name, test] of selected) { assert.ok(test, `Unknown test mode: ${name}`); await test(); console.log(`${name}: passed`); }
} finally { /* tests do not mutate process configuration */ }
