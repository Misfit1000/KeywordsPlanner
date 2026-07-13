import { API_ROUTES } from '../api/routes';
import { getAuthHeaders } from '../api/auth-headers';
import { safeJsonFetch } from '../http/safe-json';
import type { BlogAdminOverview, BlogGenerationJob, BlogListResult, BlogPost, BlogPostInput } from './types';

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

export async function runAdminBlogWorkflow(id: string, input: { action: 'hold' | 'cancel' | 'publish_now' | 'reschedule' | 'convert_manual'; scheduledAt?: string; reason: string }) {
  return request<{ post: BlogPost }>(API_ROUTES.adminBlogPostWorkflow(id), {
    method: 'POST', headers: await getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(input),
  });
}

export async function getBlogAutomationDashboard() {
  return request<{ overview: BlogAdminOverview; jobs: BlogGenerationJob[]; discoveries: Array<Record<string, any>> }>(API_ROUTES.adminBlogOverview, { headers: await getAuthHeaders() });
}

export async function getBlogAutomationSettings() {
  return request<{ settings: Record<string, any> }>(API_ROUTES.adminBlogSettings, { headers: await getAuthHeaders() });
}

export async function saveBlogAutomationSettings(settings: Record<string, unknown>) {
  return request<{ settings: Record<string, any> }>(API_ROUTES.adminBlogSettings, {
    method: 'PUT', headers: await getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(settings),
  });
}

export async function queueBlogJob(input: { mode: 'manual' | 'custom_headline' | 'discover'; topic?: string; headline?: string; audience?: string; keywords?: string; feedUrls?: string[]; sourceUrls?: string[]; competitorUrls?: string[]; requestId?: string }) {
  return request<{ job: BlogGenerationJob }>(API_ROUTES.adminBlogJobs, {
    method: 'POST', headers: await getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(input),
  });
}

export async function queueBlogBatch(input: { headlines: string[]; audience?: string; keywords?: string; sourceUrls?: string[]; competitorUrls?: string[]; maximumCost?: number }) {
  return request<{ batch: Record<string, any>; jobs: BlogGenerationJob[] }>(API_ROUTES.adminBlogBatches, {
    method: 'POST', headers: await getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(input),
  });
}

export async function importAdminBlogImage(input: { sourceUrl: string; creator?: string; publisher: string; licence: string; attribution?: string; attributionUrl?: string; altText: string; caption?: string; articleId?: string | null }) {
  return request<{ image: Record<string, any> }>(API_ROUTES.adminBlogImageImport, {
    method: 'POST', headers: await getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(input),
  });
}
