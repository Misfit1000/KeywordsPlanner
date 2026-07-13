import { pathToFileURL } from 'node:url';
import { blogAutomationRepository } from '../lib/blog/automation-repository';
import { assessCustomHeadline, blogJobIdempotencyKey, publicationBlockers } from '../lib/blog/automation';
import { discoverApprovedFeedItems } from '../lib/blog/discovery';
import { selectAutomaticBlogOpportunities, selectAutomaticPublicationTime } from '../lib/blog/freshness';
import { generateBlogWithGemini } from '../lib/blog/gemini';
import { evaluateBlogQuality } from '../lib/blog/quality';
import { renderBlogArticleHtml } from '../lib/blog/render';
import { buildCompetitorGapBrief, researchCompetitorReferences, researchSourceUrls } from '../lib/blog/research';
import { blogRepository } from '../lib/blog/repository';
import { canonicalSiteOrigin } from '../lib/blog/sitemap';
import type { BlogGenerationJob, BlogPostInput, BlogSource, BlogTrendOpportunity } from '../lib/blog/types';
import { prepareBlogPost } from '../lib/blog/validation';
import { requireSupabaseAdminClient } from '../lib/supabase/server';

const FINAL_JOB_STATES = ['published', 'ready_for_review', 'scheduled', 'skipped', 'failed', 'cancelled'];
let nextMaintenanceAt = 0;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function nowIso() {
  return new Date().toISOString();
}

function sourceFromOpportunity(opportunity: BlogTrendOpportunity): BlogSource {
  return {
    url: opportunity.sourceUrl,
    title: opportunity.sourceTitle,
    publisher: opportunity.publisher,
    publishedAt: opportunity.publishedAt,
    updatedAt: opportunity.updatedAt || null,
    accessedAt: opportunity.discoveredAt,
    sourceType: 'primary research source',
    supportedClaims: ['Publication date', 'Material update', 'Documented source announcement'],
    primary: opportunity.primarySource,
    reliability: opportunity.primarySource ? 'high' : 'medium',
    citationStatus: 'verified',
  };
}

async function publishDueArticles() {
  return (await blogRepository.publishDueScheduled(10)).length;
}

async function ensureScheduledDiscovery() {
  const settings = await blogAutomationRepository.getSettings();
  if (!settings.enabled || !Array.isArray(settings.approved_feed_urls) || !settings.approved_feed_urls.length) return null;
  const current = new Date();
  const sixHourBucket = `${current.toISOString().slice(0, 10)}-${Math.floor(current.getUTCHours() / 6)}`;
  return blogAutomationRepository.createJob({
    origin: 'autopilot',
    payload: { jobType: 'discover_trends', feedUrls: settings.approved_feed_urls },
    idempotencyKey: blogJobIdempotencyKey({ origin: 'autopilot', topic: 'scheduled-discovery', dateBucket: sixHourBucket }),
  });
}

async function handleDiscovery(job: BlogGenerationJob) {
  await blogAutomationRepository.updateJob(job.id, { state: 'discovering' });
  const settings = await blogAutomationRepository.getSettings();
  if (!settings.enabled && job.payload.manualDiscovery !== true) {
    await blogAutomationRepository.updateJob(job.id, { state: 'skipped', error: 'Automatic discovery is disabled by an administrator.', completedAt: nowIso() });
    return;
  }
  const feedUrls = Array.isArray(job.payload.feedUrls) && job.payload.feedUrls.length ? job.payload.feedUrls.map(String) : Array.isArray(settings.approved_feed_urls) ? settings.approved_feed_urls.map(String) : [];
  if (!feedUrls.length) {
    await blogAutomationRepository.updateJob(job.id, { state: 'skipped', error: 'No administrator-approved feed URLs are configured.', completedAt: nowIso() });
    return;
  }
  const existing = await blogRepository.listAdmin(300);
  const opportunities = await discoverApprovedFeedItems({ feedUrls, existingTitles: existing.map((post) => post.title) });
  const overview = await blogAutomationRepository.overview();
  const dailyRemaining = Math.max(0, Math.min(2, Number(settings.daily_automatic_limit ?? 2)) - overview.automaticGeneratedToday);
  const weeklyRemaining = Math.max(0, Number(settings.weekly_automatic_limit ?? 10) - overview.automaticGeneratedWeek);
  const selected = selectAutomaticBlogOpportunities(opportunities, new Date(), Math.min(dailyRemaining, weeklyRemaining, 2));
  for (const opportunity of opportunities) {
    const chosen = selected.some((item) => item.sourceUrl === opportunity.sourceUrl);
    const status = chosen ? 'selected' : opportunity.existingCoverage ? 'covered' : opportunity.freshnessStatus === 'high' ? 'high_priority' : opportunity.freshnessStatus === 'medium' ? 'review' : opportunity.audienceRelevance < 0.5 ? 'not_relevant' : 'monitor';
    const priorityLabel = chosen ? 'Selected for generation' : status === 'covered' ? 'Already covered' : status === 'high_priority' ? 'High editorial priority' : status === 'review' ? 'Worth reviewing' : status === 'not_relevant' ? 'Not relevant' : 'Monitor';
    await blogAutomationRepository.upsertDiscovery({ ...opportunity, status, priorityLabel });
  }
  for (const opportunity of selected) {
    await blogAutomationRepository.createJob({
      origin: 'trend_autopilot',
      topic: opportunity.proposedAngle,
      payload: { jobType: 'generate_article', opportunity, sources: [sourceFromOpportunity(opportunity)], autoPublish: settings.require_review_for_urgent === false },
      idempotencyKey: blogJobIdempotencyKey({ origin: 'trend_autopilot', topic: opportunity.sourceUrl, dateBucket: opportunity.publishedAt }),
    });
  }
  await blogAutomationRepository.updateJob(job.id, { state: 'published', result: { discovered: opportunities.length, selected: selected.length }, completedAt: nowIso() });
}

function draftInput(job: BlogGenerationJob, generated: Awaited<ReturnType<typeof generateBlogWithGemini>>, sources: BlogSource[]): BlogPostInput {
  if ('topics' in generated) throw new Error('Topic suggestions cannot be stored as an article.');
  return {
    title: generated.title,
    slug: generated.suggestedSlug,
    excerpt: generated.excerpt,
    tagline: generated.tagline,
    summary: generated.summary,
    contentHtml: generated.contentHtml,
    focusKeyword: generated.focusKeyword,
    tags: generated.tags,
    seoTitle: generated.seoTitle,
    metaDescription: generated.metaDescription,
    status: 'needs_review',
    origin: job.origin,
    articleType: job.origin === 'trend_autopilot' ? 'news analysis' : 'evergreen guide',
    topicCluster: String(job.payload.topicCluster || generated.focusKeyword).slice(0, 120),
    freshnessStatus: job.origin === 'trend_autopilot' ? 'high' : 'evergreen',
    sourcePublishedAt: sources[0]?.publishedAt || null,
    sourceUpdatedAt: sources[0]?.updatedAt || null,
    discoveredAt: sources[0]?.accessedAt || null,
    sources,
    qualityStatus: generated.qualityReport?.status || 'pending',
    qualityResults: generated.qualityReport || null,
    originalityStatus: 'passed',
    sourceStatus: sources.length > 0 && sources.every((source) => source.citationStatus === 'verified') ? 'passed' : 'needs_review',
    prerenderStatus: 'pending',
    imageStatus: 'not_required',
    generationJobId: job.id,
    batchId: job.batchId,
    publicationReason: job.origin === 'trend_autopilot' ? 'Fresh, relevant source selected by deterministic freshness rules.' : 'Administrator-requested article.',
  };
}

async function handleGeneration(job: BlogGenerationJob) {
  const recoveredPost = await blogRepository.getByGenerationJobId(job.id);
  if (recoveredPost) {
    await blogAutomationRepository.updateJob(job.id, { state: recoveredPost.status === 'published' ? 'published' : recoveredPost.status === 'scheduled' ? 'scheduled' : 'ready_for_review', articleId: recoveredPost.id, result: { recoveredAfterRestart: true }, completedAt: nowIso() });
    return;
  }
  const posts = await blogRepository.listAdmin(300);
  if (job.customHeadline) {
    const assessment = assessCustomHeadline(job.customHeadline, posts.map((post) => post.title));
    if (assessment.status !== 'passed') {
      await blogAutomationRepository.updateJob(job.id, { state: 'ready_for_review', result: { headlineAssessment: assessment }, error: assessment.warnings.join(' '), completedAt: nowIso() });
      return;
    }
  }
  await blogAutomationRepository.updateJob(job.id, { state: 'drafting' });
  const suppliedSources = (Array.isArray(job.payload.sources) ? job.payload.sources : []).map((source: any) => ({ ...source, citationStatus: source.citationStatus || 'verified' })) as BlogSource[];
  const verifiedSuppliedSources = suppliedSources.length ? await researchSourceUrls(suppliedSources.map((source) => source.url)) : [];
  const enrichedSuppliedSources = verifiedSuppliedSources.map((verified, index) => ({
    ...verified,
    ...suppliedSources[index],
    url: verified.url,
    title: suppliedSources[index]?.title || verified.title,
    publisher: suppliedSources[index]?.publisher || verified.publisher,
    publishedAt: suppliedSources[index]?.publishedAt || verified.publishedAt,
    updatedAt: suppliedSources[index]?.updatedAt || verified.updatedAt,
    citationStatus: 'verified' as const,
  }));
  const researchedSources = Array.isArray(job.payload.sourceUrls) && job.payload.sourceUrls.length ? await researchSourceUrls(job.payload.sourceUrls.map(String)) : [];
  const sources = [...enrichedSuppliedSources, ...researchedSources].filter((source, index, all) => all.findIndex((item) => item.url === source.url) === index);
  const competitorReferences = Array.isArray(job.payload.competitorUrls) && job.payload.competitorUrls.length ? await researchCompetitorReferences(job.payload.competitorUrls.map(String)) : [];
  const contentGapBrief = buildCompetitorGapBrief(competitorReferences, [job.customHeadline || job.topic, String(job.payload.keywords || '')].filter(Boolean));
  const generated = await generateBlogWithGemini({
    action: job.customHeadline ? 'custom_headline' : 'draft',
    topic: job.topic,
    headline: job.customHeadline,
    audience: String(job.payload.audience || ''),
    keywords: String(job.payload.keywords || ''),
    sources,
    contentGapBrief,
  });
  if ('topics' in generated) throw new Error('Generation provider returned topic suggestions instead of an article.');
  await blogAutomationRepository.updateJob(job.id, { state: 'validating' });
  const input = draftInput(job, generated, sources);
  const qualityReport = evaluateBlogQuality(input, { requireSources: true, sourceTexts: Array.isArray(job.payload.sourceTexts) ? job.payload.sourceTexts.map(String) : [] });
  input.qualityStatus = qualityReport.status;
  input.qualityResults = qualityReport;
  input.originalityStatus = qualityReport.checks.find((check) => check.id === 'originality')?.passed ? 'passed' : 'blocked';
  const row = prepareBlogPost(input);
  let candidateSlug = row.slug;
  for (let suffix = 2; await blogRepository.slugExists(candidateSlug); suffix += 1) candidateSlug = `${row.slug.slice(0, 110)}-${suffix}`;
  row.slug = candidateSlug;
  let post = await blogRepository.create({ ...row, author_id: job.requestedBy, updated_by: job.requestedBy });
  try {
    const html = renderBlogArticleHtml(post, canonicalSiteOrigin());
    if ((html.match(/<h1>/g) || []).length !== 1 || !html.includes('application/ld+json')) throw new Error('Initial article HTML is incomplete.');
    post = (await blogRepository.update(post.id, { prerender_status: 'passed' })) || post;
    await blogRepository.syncEditorialRecords(post, job.requestedBy, '');
    await blogRepository.storeCompetitorResearch(post.id, competitorReferences, contentGapBrief);
  } catch (error) {
    await blogRepository.update(post.id, { prerender_status: 'blocked', status: 'failed' });
    throw error;
  }

  const blockers = publicationBlockers({ qualityReport, originalityStatus: post.originalityStatus, sourceStatus: post.sourceStatus, imageStatus: post.imageStatus, prerenderStatus: post.prerenderStatus });
  const settingsForPublication = await blogAutomationRepository.getSettings();
  const autoPublish = job.payload.autoPublish === true && job.origin === 'trend_autopilot' && Number(settingsForPublication.maximum_posts_per_day || 0) > 0;
  if (autoPublish && blockers.length === 0) {
    const settings = settingsForPublication;
    const schedule = selectAutomaticPublicationTime({
      opportunity: job.payload.opportunity as BlogTrendOpportunity,
      existingPublicationTimes: posts.map((item) => item.scheduledAt || item.publishedAt).filter(Boolean) as string[],
      settings: {
        automaticTiming: Boolean(settings.automatic_timing), timezone: String(settings.timezone || 'UTC'),
        preferredStartHour: Number(settings.preferred_start_hour || 9), preferredEndHour: Number(settings.preferred_end_hour || 17),
        minimumSpacingMinutes: Number(settings.minimum_spacing_minutes || 180), delayAfterDiscoveryMinutes: Number(settings.delay_after_discovery_minutes || 60),
        maximumPostsPerDay: Number(settings.maximum_posts_per_day || 2), blackoutWeekdays: settings.blackout_weekdays || [],
      },
    });
    const expiresAt = String((job.payload.opportunity as BlogTrendOpportunity)?.expiresAt || '');
    if (expiresAt && new Date(schedule.scheduledAt).getTime() > new Date(expiresAt).getTime()) {
      await blogAutomationRepository.updateJob(job.id, { state: 'ready_for_review', articleId: post.id, result: { blockers: ['Freshness window expires before the next valid publication time.'], scheduledAt: null, providerUsage: generated.providerUsage }, inputTokens: generated.providerUsage?.inputTokens, outputTokens: generated.providerUsage?.outputTokens, completedAt: nowIso() });
      return;
    }
    const scheduledRow = prepareBlogPost({ ...input, slug: post.slug, status: 'scheduled', scheduledAt: schedule.scheduledAt, prerenderStatus: 'passed' });
    const scheduledPost = await blogRepository.update(post.id, scheduledRow);
    if (scheduledPost) await blogRepository.syncEditorialRecords(scheduledPost, job.requestedBy, post.status);
    await blogAutomationRepository.updateJob(job.id, { state: 'scheduled', articleId: post.id, result: { scheduledAt: schedule.scheduledAt, blockers: [], providerUsage: generated.providerUsage }, inputTokens: generated.providerUsage?.inputTokens, outputTokens: generated.providerUsage?.outputTokens, completedAt: nowIso() });
    return;
  }
  await blogAutomationRepository.updateJob(job.id, { state: 'ready_for_review', articleId: post.id, result: { blockers, qualityStatus: qualityReport.status, providerUsage: generated.providerUsage }, inputTokens: generated.providerUsage?.inputTokens, outputTokens: generated.providerUsage?.outputTokens, completedAt: nowIso() });
}

export async function processOneBlogJob(workerId = `blog-worker-${process.pid}`) {
  if (Date.now() >= nextMaintenanceAt) {
    await Promise.all([publishDueArticles(), ensureScheduledDiscovery()]);
    nextMaintenanceAt = Date.now() + 60_000;
  }
  const job = await blogAutomationRepository.claimJob(workerId);
  if (!job) return false;
  if (FINAL_JOB_STATES.includes(job.state)) return false;
  try {
    if (job.payload.jobType === 'discover_trends') await handleDiscovery(job);
    else await handleGeneration(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blog job failed.';
    const terminal = job.attemptCount >= job.maxAttempts;
    await blogAutomationRepository.updateJob(job.id, { state: terminal ? 'failed' : 'queued', error: message, completedAt: terminal ? nowIso() : null });
    console.error(`Blog job ${job.id} failed: ${message}`);
  }
  return true;
}

export async function runBlogWorkerLoop() {
  requireSupabaseAdminClient('Supabase service-role configuration is required by the blog worker.');
  const workerId = process.env.BLOG_WORKER_ID || `blog-worker-${process.pid}`;
  const interval = Math.max(2_000, Math.min(60_000, Number(process.env.BLOG_WORKER_POLL_INTERVAL_MS || 10_000)));
  let stopping = false;
  process.once('SIGINT', () => { stopping = true; });
  process.once('SIGTERM', () => { stopping = true; });
  console.log(`SEOIntel blog worker started as ${workerId}`);
  while (!stopping) {
    const processed = await processOneBlogJob(workerId);
    if (!processed) await wait(interval);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runBlogWorkerLoop().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
