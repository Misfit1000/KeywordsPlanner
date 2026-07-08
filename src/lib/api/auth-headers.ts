export async function getAuthHeaders(base: Record<string, string> = {}) {
  try {
    const { getSupabaseBrowserClient } = await import('../supabase/client');
    const client = getSupabaseBrowserClient();
    if (!client) return base;
    const { data } = await client.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return base;
    return { ...base, Authorization: `Bearer ${token}` };
  } catch {
    return base;
  }
}

export function getOrCreateGuestSessionId() {
  const key = 'seointel_guest_id';
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, next);
    return next;
  } catch {
    return '';
  }
}

export async function getAuditStartHeaders(base: Record<string, string> = {}) {
  const headers = await getAuthHeaders(base);
  const guestId = getOrCreateGuestSessionId();
  return guestId ? { ...headers, 'X-SEOIntel-Guest-Id': guestId } : headers;
}
