import { API_ROUTES } from '../api/routes';
import { getAuthHeaders } from '../api/auth-headers';
import { safeJsonFetch } from '../http/safe-json';
import type { BlogListResult, BlogPost, BlogPostInput, GeminiBlogDraft } from './types';

type Envelope<T> = { success: boolean; data: T; error?: string };

async function request<T>(url: string, init?: RequestInit) {
  const response = await safeJsonFetch<Envelope<T>>(url, init);
  if (response.success === false) throw new Error(response.error);
  if (!response.data.success) throw new Error(response.data.error || 'Blog request failed.');
  return response.data.data;
}

export function getPublishedPosts(options: { query?: string; limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams();
  if (options.query) params.set('q', options.query);
  params.set('limit', String(options.limit || 12));
  params.set('offset', String(options.offset || 0));
  return request<BlogListResult>(`${API_ROUTES.blogPosts}?${params}`);
}

export function getPublishedPost(slug: string) {
  return request<{ post: BlogPost }>(API_ROUTES.blogPost(slug));
}

export async function getAdminBlogPosts() {
  return request<{ posts: BlogPost[] }>(API_ROUTES.adminBlogPosts, { headers: await getAuthHeaders() });
}

export async function saveAdminBlogPost(input: BlogPostInput, id?: string) {
  return request<{ post: BlogPost }>(id ? API_ROUTES.adminBlogPost(id) : API_ROUTES.adminBlogPosts, {
    method: id ? 'PUT' : 'POST',
    headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
}

export async function archiveAdminBlogPost(id: string) {
  return request<{ post: BlogPost }>(API_ROUTES.adminBlogPost(id), { method: 'DELETE', headers: await getAuthHeaders() });
}

export async function generateAdminBlog(input: { action: 'topics' | 'draft'; topic?: string; audience?: string; keywords?: string }) {
  return request<GeminiBlogDraft | { topics: Array<{ title: string; angle: string }> }>(API_ROUTES.adminBlogGenerate, {
    method: 'POST',
    headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
}
