import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseProjectUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

const supabaseUrl = normalizeSupabaseProjectUrl(process.env.SUPABASE_URL);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to inspect queued audits.');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await client
  .from('audits')
  .select('id,status,submitted_input,normalized_url,current_phase,locked_by,lease_expires_at,error,created_at,updated_at')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error(`Could not read latest audits: ${error.message}`);
  process.exit(1);
}

console.log(`Supabase project: ${new URL(supabaseUrl).hostname}`);
console.log('Latest 10 audits:');
if (data?.length) {
  console.table(data);
} else {
  console.log('No audits found.');
}
