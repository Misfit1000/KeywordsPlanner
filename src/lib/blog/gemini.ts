import { buildBlogSeoFields } from './seo';
import { sanitizeBlogHtml, blogTextFromHtml } from './sanitize';
import { createBlogSlug } from './slug';
import type { GeminiBlogDraft } from './types';

type GeminiAction = 'topics' | 'draft';

function modelName() {
  const configured = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  return /^[a-z0-9._-]+$/i.test(configured) ? configured : 'gemini-2.5-flash';
}

async function requestGemini(prompt: string, responseSchema: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini draft assistant is not configured. Add GEMINI_API_KEY to the Vercel server environment.');
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
          maxOutputTokens: 5000,
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
    const payload: any = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
    if (!text) throw new Error('Gemini returned an empty draft.');
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateBlogWithGemini(input: { action: GeminiAction; topic?: string; audience?: string; keywords?: string }) {
  const audience = String(input.audience || 'website owners, marketers, developers, and SEO practitioners').slice(0, 240);
  const keywords = String(input.keywords || '').slice(0, 300);
  if (input.action === 'topics') {
    const result = await requestGemini(
      `Suggest eight useful, non-duplicative blog topics for SEOIntel, a visual SEO, technical SEO, website health, and passive security audit product. Audience: ${audience}. Optional themes: ${keywords || 'on-page SEO, crawlability, website performance observations, and passive browser protections'}. Avoid news claims, invented statistics, guaranteed ranking promises, backlinks, traffic estimates, and paid-data claims. Return concise evergreen titles with a one-sentence angle.`,
      {
        type: 'object',
        properties: {
          topics: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, angle: { type: 'string' } }, required: ['title', 'angle'] } },
        },
        required: ['topics'],
      },
    );
    return { topics: Array.isArray(result.topics) ? result.topics.slice(0, 8) : [] };
  }

  const topic = String(input.topic || '').trim().slice(0, 240);
  if (topic.length < 5) throw new Error('Enter a specific topic before generating a draft.');
  const result = await requestGemini(
    `Write an original, practical, evidence-conscious article about: "${topic}". Audience: ${audience}. Focus phrases: ${keywords || topic}. The article is for SEOIntel. Use clear language, a short introduction, descriptive H2/H3 headings, lists where useful, concrete implementation guidance, and a concise conclusion. Produce 700-1200 words. Do not include an H1. Use only these HTML tags: p, h2, h3, h4, ul, ol, li, strong, em, blockquote, pre, code, hr, br, a. Do not invent statistics, customer claims, ranking guarantees, traffic, backlinks, search volume, or proprietary data. Do not claim current events or facts that require live verification. The draft must be reviewed and fact-checked by an administrator before publication.`,
    {
      type: 'object',
      properties: {
        title: { type: 'string' },
        excerpt: { type: 'string' },
        contentHtml: { type: 'string' },
        focusKeyword: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        seoTitle: { type: 'string' },
        metaDescription: { type: 'string' },
      },
      required: ['title', 'excerpt', 'contentHtml', 'focusKeyword', 'tags', 'seoTitle', 'metaDescription'],
    },
  );

  const contentHtml = sanitizeBlogHtml(result.contentHtml);
  const contentText = blogTextFromHtml(contentHtml);
  const generatedSeo = buildBlogSeoFields({ title: result.title, excerpt: result.excerpt, contentText, focusKeyword: result.focusKeyword });
  const draft: GeminiBlogDraft = {
    title: String(result.title || topic).slice(0, 140),
    excerpt: String(result.excerpt || generatedSeo.excerpt).slice(0, 360),
    contentHtml,
    focusKeyword: String(result.focusKeyword || generatedSeo.focusKeyword).slice(0, 100),
    tags: Array.isArray(result.tags) ? result.tags.map(String).map((tag: string) => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 12) : [],
    suggestedSlug: createBlogSlug(result.title || topic),
    seoTitle: String(result.seoTitle || generatedSeo.seoTitle).slice(0, 70),
    metaDescription: String(result.metaDescription || generatedSeo.metaDescription).slice(0, 180),
  };
  if (contentText.split(/\s+/).filter(Boolean).length < 250) throw new Error('Gemini returned an incomplete article. Try a more specific topic.');
  return draft;
}
