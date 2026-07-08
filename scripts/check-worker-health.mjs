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
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for worker diagnostics.');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const heartbeatResult = await client
  .from('platform_settings')
  .select('id,value,updated_at')
  .like('id', 'audit_worker:%')
  .order('updated_at', { ascending: false });

if (heartbeatResult.error) {
  console.error(`Could not read worker heartbeat rows: ${heartbeatResult.error.message}`);
  console.error('Confirm supabase/migrations/002_worker_heartbeat.sql has been run.');
  process.exit(1);
}

const heartbeats = (heartbeatResult.data ?? []).map((row) => ({
  workerId: row.value?.workerId || String(row.id).replace(/^audit_worker:/, ''),
  status: row.value?.status || 'unknown',
  lastSeenAt: row.value?.lastSeenAt || row.updated_at,
  currentAuditId: row.value?.currentAuditId || null,
  pollIntervalMs: row.value?.pollIntervalMs || null,
  version: row.value?.version || 'unknown',
  runtime: row.value?.runtime || 'unknown',
  supportedModes: Array.isArray(row.value?.supportedModes) ? row.value.supportedModes.join(',') : 'unknown',
  deepAuditEnabled: row.value?.deepAuditEnabled === true,
}));

console.log(`Supabase project: ${new URL(supabaseUrl).hostname}`);
console.log('Worker heartbeats:');
if (heartbeats.length) {
  console.table(heartbeats);
} else {
  console.log('No audit_worker:* heartbeat rows found.');
}

const auditsResult = await client
  .from('audits')
  .select('id,status,submitted_input,normalized_url,current_phase,locked_by,lease_expires_at,error,created_at,updated_at')
  .order('created_at', { ascending: false })
  .limit(5);

if (auditsResult.error) {
  console.error(`Could not read latest audits: ${auditsResult.error.message}`);
  process.exit(1);
}

const audits = auditsResult.data ?? [];
console.log('Latest audits:');
if (audits.length) {
  console.table(
    audits.map((audit) => ({
      id: audit.id,
      status: audit.status,
      current_phase: audit.current_phase,
      locked_by: audit.locked_by,
      lease_expires_at: audit.lease_expires_at,
      created_at: audit.created_at,
      updated_at: audit.updated_at,
    })),
  );
} else {
  console.log('No audits found.');
}

if (!heartbeats.length && audits.some((audit) => audit.status === 'queued')) {
  console.warn('Queued audits exist, but no worker heartbeat was found. Deploy/start the online worker with the same Supabase project.');
}
