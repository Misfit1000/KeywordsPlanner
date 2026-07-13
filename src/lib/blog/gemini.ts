import { buildBlogSeoFields } from './seo';
import { sanitizeBlogHtml, blogTextFromHtml } from './sanitize';
import { createBlogSlug } from './slug';
import type { GeminiBlogDraft } from './types';
import { evaluateBlogQuality } from './quality';

type GeminiAction = 'topics' | 'draft' | 'custom_headline';

function modelName() {
  const configured = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  return /^[a-z0-9._-]+$/i.test(configured) ? configured : 'gemini-2.5-flash';
}

async function requestGemini(prompt: string, responseSchema: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Blog generation is not configured. Add GEMINI_API_KEY to the worker environment only.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName())}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.55,
          maxOutputTokens: 10000,
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
    const payload: any = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
    if (!text) throw new Error('Gemini returned an empty draft.');
    return { data: JSON.parse(text), usage: payload?.usageMetadata || {} };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateBlogWithGemini(input: { action: GeminiAction; topic?: string; headline?: string; audience?: string; keywords?: string; sources?: Array<{ url: string; title: string; publisher: string }>; contentGapBrief?: { coveredSubtopics?: string[]; contentGaps?: string[]; proposedOriginalAngle?: string } }) {
  const audience = String(input.audience || 'website owners, marketers, developers, and SEO practitioners').slice(0, 240);
  const keywords = String(input.keywords || '').slice(0, 300);
  if (input.action === 'topics') {
    const response = await requestGemini(
      `Suggest eight useful, non-duplicative blog topics for SEOIntel, a visual SEO, technical SEO, website health, and passive security audit product. Audience: ${audience}. Optional themes: ${keywords || 'on-page SEO, crawlability, website performance observations, and passive browser protections'}. Avoid news claims, invented statistics, guaranteed ranking promises, backlinks, traffic estimates, and paid-data claims. Return concise evergreen titles with a one-sentence angle.`,
      {
        type: 'object',
        properties: {
          topics: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, angle: { type: 'string' } }, required: ['title', 'angle'] } },
        },
        required: ['topics'],
      },
    );
    return { topics: Array.isArray(response.data.topics) ? response.data.topics.slice(0, 8) : [] };
  }

  const customHeadline = String(input.headline || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  const topic = String(input.action === 'custom_headline' ? customHeadline : input.topic || '').trim().slice(0, 240);
  if (topic.length < 5) throw new Error('Enter a specific topic before generating a draft.');
  const sources = (input.sources || []).filter((source) => /^https?:\/\//.test(source.url) && source.title && source.publisher).slice(0, 12);
  const sourceContext = sources.length
    ? `Use only these supplied research sources for factual claims and add crawlable hyperlinks to them where relevant: ${sources.map((source) => `${source.title} (${source.publisher}): ${source.url}`).join('; ')}.`
    : 'Do not invent current facts, dates, quotes, statistics, or sources. Mark claims that need a source with [SOURCE REVIEW REQUIRED].';
  const gapContext = input.contentGapBrief
    ? `Reference pages cover these broad subtopics: ${(input.contentGapBrief.coveredSubtopics || []).slice(0, 20).join('; ')}. Original gaps to address: ${(input.contentGapBrief.contentGaps || []).slice(0, 20).join('; ')}. Original angle: ${input.contentGapBrief.proposedOriginalAngle || 'Use independent evidence and examples'}. Do not copy their wording, examples, tables, paragraph order, or heading sequence.`
    : '';
  const response = await requestGemini(
    `Write an original, practical, evidence-conscious article about: "${topic}". ${input.action === 'custom_headline' ? `Preserve this exact administrator headline: "${customHeadline}".` : ''} Audience: ${audience}. Focus phrases: ${keywords || topic}. The article is for SEOIntel. Answer the main question near the beginning. Write 1,500-2,200 meaningful words without filler. Use varied concise sentences, readable paragraphs, descriptive H2/H3 headings, concrete examples, one practical workflow or checklist, and a concise conclusion. Do not include an H1 because the renderer supplies it. Use only these HTML tags: p, h2, h3, h4, ul, ol, li, strong, em, blockquote, pre, code, hr, br, a. ${sourceContext} ${gapContext} Do not copy source sentences, paragraph order, examples, tables, or heading sequences. Do not invent statistics, quotes, customer claims, ranking guarantees, traffic, backlinks, search volume, or proprietary data. Every factual external reference must be a standard HTML hyperlink. Include at least two useful internal links to relevant SEOIntel pages using paths beginning with /. The draft must be reviewed and fact-checked before publication.`,
    {
      type: 'object',
      properties: {
        title: { type: 'string' },
        excerpt: { type: 'string' },
        tagline: { type: 'string' },
        summary: { type: 'string' },
        contentHtml: { type: 'string' },
        focusKeyword: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        seoTitle: { type: 'string' },
        metaDescription: { type: 'string' },
      },
      required: ['title', 'excerpt', 'tagline', 'summary', 'contentHtml', 'focusKeyword', 'tags', 'seoTitle', 'metaDescription'],
    },
  );

  const result = response.data;
  const contentHtml = sanitizeBlogHtml(result.contentHtml);
  const contentText = blogTextFromHtml(contentHtml);
  const generatedSeo = buildBlogSeoFields({ title: result.title, excerpt: result.excerpt, contentText, focusKeyword: result.focusKeyword });
  const draft: GeminiBlogDraft = {
    title: String(result.title || topic).slice(0, 140),
    excerpt: String(result.excerpt || generatedSeo.excerpt).slice(0, 360),
    tagline: String(result.tagline || '').slice(0, 240),
    summary: String(result.summary || result.excerpt || generatedSeo.excerpt).slice(0, 600),
    contentHtml,
    focusKeyword: String(result.focusKeyword || generatedSeo.focusKeyword).slice(0, 100),
    tags: Array.isArray(result.tags) ? result.tags.map(String).map((tag: string) => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 12) : [],
    suggestedSlug: createBlogSlug(result.title || topic),
    seoTitle: String(result.seoTitle || generatedSeo.seoTitle).slice(0, 70),
    metaDescription: String(result.metaDescription || generatedSeo.metaDescription).slice(0, 180),
    providerUsage: {
      model: modelName(),
      inputTokens: Number.isFinite(Number(response.usage.promptTokenCount)) ? Number(response.usage.promptTokenCount) : null,
      outputTokens: Number.isFinite(Number(response.usage.candidatesTokenCount)) ? Number(response.usage.candidatesTokenCount) : null,
      totalTokens: Number.isFinite(Number(response.usage.totalTokenCount)) ? Number(response.usage.totalTokenCount) : null,
    },
  };
  if (input.action === 'custom_headline') draft.title = customHeadline;
  const qualityReport = evaluateBlogQuality({ ...draft, slug: draft.suggestedSlug, sources }, { requireSources: sources.length > 0 });
  draft.qualityReport = qualityReport;
  if (qualityReport.wordCount < 1500) throw new Error('The draft did not reach 1,500 useful words. Refine the topic or generate a broader article.');
  if (qualityReport.blockedReasons.some((reason) => !/Required research sources/.test(reason))) {
    throw new Error(`The draft failed content quality checks: ${qualityReport.blockedReasons.join('; ')}.`);
  }
  return draft;
}
