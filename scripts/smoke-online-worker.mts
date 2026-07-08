import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  WORKER_ENV_ERROR,
  buildWorkerHeartbeat,
  createInitialWorkerState,
  loadWorkerConfig,
  updateWorkerState,
} from '../src/workers/audit-worker-runtime.ts';
import { isAuditQueuedTooLong } from '../src/lib/audit/queued-worker-warning.ts';

const root = process.cwd();

function assertThrowsWorkerEnv(env: Record<string, string | undefined>) {
  assert.throws(() => loadWorkerConfig(env), {
    message: WORKER_ENV_ERROR,
  });
}

assertThrowsWorkerEnv({});
assertThrowsWorkerEnv({ SUPABASE_SERVICE_ROLE_KEY: 'service-role-key' });
assertThrowsWorkerEnv({ SUPABASE_URL: 'https://example.supabase.co' });

const config = loadWorkerConfig({
  SUPABASE_URL: 'https://example.supabase.co/',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
});
assert.equal(config.workerId, 'worker-production-1');
assert.equal(config.pollIntervalMs, 4000);
assert.equal(config.supabaseHost, 'example.supabase.co');

const workerSource = readFileSync(join(root, 'src/workers/audit-worker.ts'), 'utf8');
assert.match(workerSource, /requireSupabaseAdminClient/);
assert.match(workerSource, /loadWorkerConfig/);
assert.match(workerSource, /WORKER_ENV_ERROR/);

const state = createInitialWorkerState(config);
updateWorkerState(state, { status: 'running', currentAuditId: 'audit-123' });
const heartbeat = buildWorkerHeartbeat(state);
assert.deepEqual(
  {
    workerId: heartbeat.workerId,
    status: heartbeat.status,
    pollIntervalMs: heartbeat.pollIntervalMs,
    currentAuditId: heartbeat.currentAuditId,
  },
  {
    workerId: 'worker-production-1',
    status: 'running',
    pollIntervalMs: 4000,
    currentAuditId: 'audit-123',
  },
);
assert.ok(heartbeat.lastSeenAt);

assert.equal(
  isAuditQueuedTooLong(
    {
      status: 'queued',
      createdAt: new Date(Date.now() - 21_000).toISOString(),
    },
    Date.now(),
    20_000,
  ),
  true,
);
assert.equal(
  isAuditQueuedTooLong(
    {
      status: 'running',
      createdAt: new Date(Date.now() - 60_000).toISOString(),
    },
    Date.now(),
    20_000,
  ),
  false,
);

for (const file of [
  'Dockerfile.worker',
  '.dockerignore',
  'render.yaml',
  'railway.json',
  'Procfile',
  'docs/deployment/audit-worker-online.md',
  'supabase/migrations/002_worker_heartbeat.sql',
]) {
  assert.equal(existsSync(join(root, file)), true, `${file} should exist`);
}

const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8');
assert.match(dockerignore, /^\.env$/m);
assert.match(dockerignore, /^\.env\.local$/m);
assert.match(dockerignore, /^node_modules$/m);

const migration = readFileSync(join(root, 'supabase/migrations/002_worker_heartbeat.sql'), 'utf8');
assert.match(migration, /add column if not exists value jsonb not null default '\{\}'::jsonb/i);
assert.match(migration, /platform_settings_set_updated_at/i);

console.log('Online worker smoke test passed.');
