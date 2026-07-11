import { randomUUID } from 'node:crypto';
import { getSupabaseAdminClient } from '../supabase/server';
import { estimateReadingTime } from './seo';
import type { BlogListResult, BlogPost, BlogPostStatus } from './types';

type BlogPostRow = Record<string, any>;

const memoryPosts = new Map<string, BlogPostRow>();

function toPost(row: BlogPostRow): BlogPost {
  const contentText = String(row.content_text ?? row.contentText ?? '');
  return {
    id: String(row.id),
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    excerpt: String(row.excerpt || ''),
    contentHtml: String(row.content_html ?? row.contentHtml ?? ''),
    contentText,
    focusKeyword: String(row.focus_keyword ?? row.focusKeyword ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    seoTitle: String(row.seo_title ?? row.seoTitle ?? ''),
    metaDescription: String(row.meta_description ?? row.metaDescription ?? ''),
    canonicalUrl: String(row.canonical_url ?? row.canonicalUrl ?? ''),
    ogImageUrl: String(row.og_image_url ?? row.ogImageUrl ?? ''),
    status: String(row.status || 'draft') as BlogPostStatus,
    authorId: row.author_id ?? row.authorId ?? null,
    updatedBy: row.updated_by ?? row.updatedBy ?? null,
    publishedAt: row.published_at ?? row.publishedAt ?? null,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
    readingTimeMinutes: estimateReadingTime(contentText),
  };
}

function isPublic(row: BlogPostRow) {
  return row.status === 'published' && row.published_at && new Date(row.published_at).getTime() <= Date.now();
}

function publicMemoryRows() {
  return [...memoryPosts.values()].filter(isPublic).sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
}

export const blogRepository = {
  async listPublished({ query = '', limit = 12, offset = 0 } = {}): Promise<BlogListResult> {
    const safeLimit = Math.max(1, Math.min(30, Number(limit) || 12));
    const safeOffset = Math.max(0, Number(offset) || 0);
    const search = String(query || '').replace(/[^\p{L}\p{N}\s'"-]/gu, ' ').trim().slice(0, 100);
    const client = getSupabaseAdminClient();
    if (!client) {
      const filtered = publicMemoryRows().filter((row) => !search || `${row.title} ${row.excerpt} ${row.content_text}`.toLowerCase().includes(search.toLowerCase()));
      return { posts: filtered.slice(safeOffset, safeOffset + safeLimit).map(toPost), total: filtered.length, limit: safeLimit, offset: safeOffset };
    }

    let request = client
      .from('blog_posts')
      .select('id,slug,title,excerpt,focus_keyword,tags,seo_title,meta_description,canonical_url,og_image_url,status,author_id,published_at,created_at,updated_at,content_text', { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);
    if (search) request = request.textSearch('search_vector', search, { config: 'english', type: 'websearch' });
    const { data, error, count } = await request;
    if (error) throw error;
    return { posts: (data || []).map(toPost), total: count || 0, limit: safeLimit, offset: safeOffset };
  },

  async getPublishedBySlug(slug: string) {
    const client = getSupabaseAdminClient();
    if (!client) {
      const row = [...memoryPosts.values()].find((item) => item.slug === slug && isPublic(item));
      return row ? toPost(row) : null;
    }
    const { data, error } = await client.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').lte('published_at', new Date().toISOString()).maybeSingle();
    if (error) throw error;
    return data ? toPost(data) : null;
  },

  async listAdmin(limit = 100) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    const client = getSupabaseAdminClient();
    if (!client) return [...memoryPosts.values()].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, safeLimit).map(toPost);
    const { data, error } = await client.from('blog_posts').select('*').order('updated_at', { ascending: false }).limit(safeLimit);
    if (error) throw error;
    return (data || []).map(toPost);
  },

  async getAdminById(id: string) {
    const client = getSupabaseAdminClient();
    if (!client) {
      const row = memoryPosts.get(id);
      return row ? toPost(row) : null;
    }
    const { data, error } = await client.from('blog_posts').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toPost(data) : null;
  },

  async slugExists(slug: string, exceptId?: string) {
    const client = getSupabaseAdminClient();
    if (!client) return [...memoryPosts.values()].some((row) => row.slug === slug && row.id !== exceptId);
    let request = client.from('blog_posts').select('id').eq('slug', slug).limit(1);
    if (exceptId) request = request.neq('id', exceptId);
    const { data, error } = await request;
    if (error) throw error;
    return Boolean(data?.length);
  },

  async create(row: BlogPostRow) {
    const now = new Date().toISOString();
    const client = getSupabaseAdminClient();
    if (!client) {
      const stored = { ...row, id: randomUUID(), created_at: now, updated_at: now };
      memoryPosts.set(stored.id, stored);
      return toPost(stored);
    }
    const { data, error } = await client.from('blog_posts').insert(row).select('*').single();
    if (error) throw error;
    return toPost(data);
  },

  async update(id: string, row: BlogPostRow) {
    const client = getSupabaseAdminClient();
    if (!client) {
      const existing = memoryPosts.get(id);
      if (!existing) return null;
      const stored = { ...existing, ...row, id, updated_at: new Date().toISOString() };
      memoryPosts.set(id, stored);
      return toPost(stored);
    }
    const { data, error } = await client.from('blog_posts').update(row).eq('id', id).select('*').maybeSingle();
    if (error) throw error;
    return data ? toPost(data) : null;
  },

  async sitemapRows() {
    const client = getSupabaseAdminClient();
    if (!client) return publicMemoryRows().map((row) => ({ slug: String(row.slug), updatedAt: String(row.updated_at) }));
    const { data, error } = await client.from('blog_posts').select('slug,updated_at').eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(5000);
    if (error) throw error;
    return (data || []).map((row) => ({ slug: String(row.slug), updatedAt: String(row.updated_at) }));
  },
};
