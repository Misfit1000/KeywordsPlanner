const MAX_SLUG_LENGTH = 110;

export function createBlogSlug(value: string) {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return normalized || 'article';
}

export function normalizeBlogSlug(value: string) {
  return createBlogSlug(value).slice(0, 120);
}
