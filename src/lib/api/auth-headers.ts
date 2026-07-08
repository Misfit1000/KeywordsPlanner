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
