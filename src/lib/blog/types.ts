export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  contentText: string;
  focusKeyword: string;
  tags: string[];
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  status: BlogPostStatus;
  authorId: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
}

export interface BlogPostInput {
  slug?: string;
  title: string;
  excerpt?: string;
  contentHtml: string;
  focusKeyword?: string;
  tags?: string[];
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  status?: BlogPostStatus;
  publishedAt?: string | null;
}

export interface BlogListResult {
  posts: BlogPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface GeminiBlogDraft {
  title: string;
  excerpt: string;
  contentHtml: string;
  focusKeyword: string;
  tags: string[];
  suggestedSlug: string;
  seoTitle: string;
  metaDescription: string;
}
