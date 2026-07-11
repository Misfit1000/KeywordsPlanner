import { buildBlogSeoFields } from './seo';
import { blogTextFromHtml, sanitizeBlogHtml } from './sanitize';
import { normalizeBlogSlug } from './slug';
import type { BlogPostInput, BlogPostStatus } from './types';

export class BlogValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function optionalHttpUrl(value: unknown, field: string) {
  const text = String(value || '').trim().slice(0, 500);
  if (!text) return '';
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
    return url.toString();
  } catch {
    throw new BlogValidationError(`${field} must be a valid HTTP or HTTPS URL.`);
  }
}

function normalizeTags(value: unknown) {
  const tags = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(tags.map(String).map((tag) => tag.trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean))].slice(0, 12);
}

export function prepareBlogPost(input: BlogPostInput, options: { publishing?: boolean } = {}) {
  const title = String(input.title || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  if (title.length < 3) throw new BlogValidationError('Title must be at least 3 characters.');

  const contentHtml = sanitizeBlogHtml(input.contentHtml);
  const contentText = blogTextFromHtml(contentHtml);
  const status = (['draft', 'published', 'archived'].includes(String(input.status)) ? input.status : 'draft') as BlogPostStatus;
  const seo = buildBlogSeoFields({ title, excerpt: input.excerpt, contentText, focusKeyword: input.focusKeyword });
  const excerpt = String(input.excerpt || seo.excerpt).replace(/\s+/g, ' ').trim().slice(0, 360);
  const seoTitle = String(input.seoTitle || seo.seoTitle).replace(/\s+/g, ' ').trim().slice(0, 70);
  const metaDescription = String(input.metaDescription || seo.metaDescription).replace(/\s+/g, ' ').trim().slice(0, 180);
  const focusKeyword = String(input.focusKeyword || seo.focusKeyword).replace(/\s+/g, ' ').trim().slice(0, 100);
  const slug = normalizeBlogSlug(input.slug || title);
  const publishing = options.publishing || status === 'published';

  if (publishing) {
    if (contentText.length < 500) throw new BlogValidationError('Published articles need at least 500 characters of useful content.');
    if (excerpt.length < 60) throw new BlogValidationError('Published articles need a clear excerpt of at least 60 characters.');
    if (seoTitle.length < 20) throw new BlogValidationError('Published articles need an SEO title of at least 20 characters.');
    if (metaDescription.length < 70) throw new BlogValidationError('Published articles need a meta description of at least 70 characters.');
  }

  let publishedAt: string | null = null;
  if (status === 'published') {
    const parsed = input.publishedAt ? new Date(input.publishedAt) : new Date();
    if (Number.isNaN(parsed.getTime())) throw new BlogValidationError('Publish date is invalid.');
    publishedAt = parsed.toISOString();
  }

  return {
    slug,
    title,
    excerpt,
    content_html: contentHtml,
    content_text: contentText,
    focus_keyword: focusKeyword || null,
    tags: normalizeTags(input.tags),
    seo_title: seoTitle,
    meta_description: metaDescription,
    canonical_url: optionalHttpUrl(input.canonicalUrl, 'Canonical URL') || null,
    og_image_url: optionalHttpUrl(input.ogImageUrl, 'Social image URL') || null,
    status,
    published_at: publishedAt,
  };
}
