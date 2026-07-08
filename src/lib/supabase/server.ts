import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normalizeSupabaseProjectUrl } from './url';

let cachedClient: SupabaseClient | null | undefined;

function hasSupabaseServerConfig() {
  return Boolean(normalizeSupabaseProjectUrl(process.env.SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabaseAdminEnabled() {
  return hasSupabaseServerConfig();
}

export function getSupabaseProjectHostname() {
  const supabaseUrl = normalizeSupabaseProjectUrl(process.env.SUPABASE_URL);
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  if (cachedClient === undefined) {
    const supabaseUrl = normalizeSupabaseProjectUrl(process.env.SUPABASE_URL);
    cachedClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return cachedClient;
}

export function requireSupabaseAdminClient(message = 'Supabase admin client is required for this operation.') {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error(message);
  }
  return client;
}
