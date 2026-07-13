import { requireSupabaseAdminClient } from '../src/lib/supabase/server.ts';

const apply = process.env.RETENTION_APPLY === 'true' || process.argv.includes('--apply');
const client = requireSupabaseAdminClient('Supabase service-role configuration is required for retention cleanup.');
const { data, error } = await client.rpc('run_data_retention_cleanup', { p_apply: apply });
if (error) throw error;
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...data }, null, 2));
