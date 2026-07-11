import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildBlogSeoFields } from '../src/lib/blog/seo';
import { sanitizeBlogHtml } from '../src/lib/blog/sanitize';
import { createBlogSlug, normalizeBlogSlug } from '../src/lib/blog/slug';
import { prepareBlogPost } from '../src/lib/blog/validation';

assert.equal(createBlogSlug('  Technical SEO: A Practical Guide!  '), 'technical-seo-a-practical-guide');
assert.equal(normalizeBlogSlug('../../Unsafe Slug'), 'unsafe-slug');
assert.match(createBlogSlug('SEO audit'), /^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const sanitized = sanitizeBlogHtml('<h2>Safe</h2><script>alert(1)</script><p onclick="bad()">Text <a href="javascript:alert(1)">link</a></p>');
assert.match(sanitized, /<h2>Safe<\/h2>/);
assert.equal(/script|onclick|javascript:/i.test(sanitized), false, 'unsafe blog markup was not removed');

const content = `<p>${'Useful technical SEO guidance for website owners and developers. '.repeat(12)}</p>`;
const prepared = prepareBlogPost({ title: 'A Practical Technical SEO Audit Guide', contentHtml: content, status: 'published' });
assert.equal(prepared.status, 'published');
assert.ok(prepared.published_at);
assert.ok(prepared.meta_description.length >= 70);
assert.ok(prepared.slug.length <= 120);

const seo = buildBlogSeoFields({ title: 'Website Audit Checklist', contentText: content, focusKeyword: 'website audit checklist' });
assert.ok(seo.seoTitle.length <= 60);
assert.ok(seo.metaDescription.length <= 160);

const migration = readFileSync(resolve('supabase/migrations/007_blog_cms.sql'), 'utf8');
for (const requirement of [
  /create table if not exists public\.blog_posts/i,
  /enable row level security/i,
  /published blog posts are public/i,
  /admins can manage blog posts/i,
  /using gin \(search_vector\)/i,
]) assert.match(migration, requirement);

const envExample = readFileSync(resolve('.env.example'), 'utf8');
assert.match(envExample, /^GEMINI_API_KEY=$/m);
assert.equal(/VITE_GEMINI/i.test(envExample), false, 'Gemini key must never use a VITE_ prefix');

const browserSources = [
  resolve('src/App.tsx'),
  resolve('src/components/blog/BlogAdmin.tsx'),
  resolve('src/components/blog/BlogIndex.tsx'),
  resolve('src/components/blog/BlogPostPage.tsx'),
].map((file) => readFileSync(file, 'utf8')).join('\n');
assert.equal(/GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(browserSources), false, 'server-only keys are referenced by browser code');

console.log('Blog CMS smoke test passed: slugs, sanitization, SEO defaults, RLS migration, and key boundaries verified.');
