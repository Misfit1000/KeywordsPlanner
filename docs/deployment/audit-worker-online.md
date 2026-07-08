# SEOIntel Online Audit Worker

The live site needs three separate parts:

1. Vercel frontend and lightweight API routes.
2. Supabase Postgres and Realtime.
3. An always-on Node audit worker running outside Vercel.

Vercel creates queued audit rows and returns an audit ID immediately. The worker claims those queued rows from Supabase, crawls public pages with resource-light fetches, writes live events/pages/issues/reports, and refreshes its lease while it works. If the worker is not running, audits remain queued.

## Required Supabase Step

Run this migration in the Supabase SQL Editor before deploying the worker:

```sql
-- Paste and run supabase/migrations/002_worker_heartbeat.sql
```

This adds `platform_settings.value jsonb` for worker heartbeat rows keyed as `audit_worker:<workerId>`.

## Required Worker Environment

Set these on the worker service only:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AUDIT_WORKER_ID=worker-production-1
AUDIT_POLL_INTERVAL_MS=4000
```

Optional:

```bash
WORKER_HEALTH_PORT=3000
```

Never set `SUPABASE_SERVICE_ROLE_KEY` in browser code. Never create `VITE_SUPABASE_SERVICE_ROLE_KEY`. Vercel should only use client-safe browser vars plus the server-side vars needed by lightweight API routes.

## Expected Worker Logs

```text
SEOIntel audit worker started as worker-production-1
Supabase admin: connected
Supabase project: xxxxx.supabase.co
Polling interval: 4000ms
```

During operation:

```text
No queued audits found
Claimed audit <auditId> for <normalizedUrl>
Audit <auditId> running
Audit <auditId> completed
```

## Render Background Worker

Render is the recommended first deployment path.

1. Push `main` to GitHub.
2. In Render, create a new Blueprint or Background Worker from the GitHub repo.
3. If using the Blueprint, select `render.yaml`.
4. Confirm:

```bash
Build Command: npm ci --legacy-peer-deps
Start Command: npm run worker:audit
```

5. Add worker env vars:

```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AUDIT_WORKER_ID=worker-production-1
AUDIT_POLL_INTERVAL_MS=4000
```

6. Deploy the service and watch logs for the expected startup lines.
7. From local terminal, verify heartbeat:

```bash
npm run check:worker
```

8. Start a Quick Audit on the Vercel preview or production site. The audit should move from queued to running and show live events.

## Railway

Use the included `railway.json`.

1. Create a Railway project from the GitHub repo.
2. Add the same worker env vars.
3. Confirm the deploy start command:

```bash
npm run worker:audit
```

4. Deploy and verify with:

```bash
npm run check:worker
```

## Docker

Build and run with the worker Dockerfile:

```bash
docker build -f Dockerfile.worker -t seointel-audit-worker .
docker run --rm \
  -e SUPABASE_URL=https://xxxxx.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -e AUDIT_WORKER_ID=worker-production-1 \
  -e AUDIT_POLL_INTERVAL_MS=4000 \
  seointel-audit-worker
```

Do not bake `.env` files into the image. `.dockerignore` excludes local env files, `node_modules`, `dist`, and Vercel/Supabase local folders.

## VPS

Install Node LTS, clone the repo, then run:

```bash
npm ci --legacy-peer-deps
SUPABASE_URL=https://xxxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
AUDIT_WORKER_ID=worker-production-1 \
AUDIT_POLL_INTERVAL_MS=4000 \
npm run worker:audit
```

Use a process manager such as systemd or PM2 so the worker restarts after crashes or deploys.

## Diagnostics

Check worker heartbeat and latest audit statuses:

```bash
npm run check:worker
```

List recent queued/running audits:

```bash
npm run check:queued-audits
```

If audits stay queued forever, check:

- Worker service is deployed and running.
- Worker has `SUPABASE_URL`.
- Worker has `SUPABASE_SERVICE_ROLE_KEY`.
- Worker and Vercel use the same Supabase project.
- `supabase/migrations/002_worker_heartbeat.sql` was run.
- Supabase Realtime is enabled for audit tables from migration 001.
- The worker logs do not show startup env refusal.
- Stale locked jobs have an expired lease and can be reclaimed.

Environment changes require redeployment. The crawler must not run inside Vercel serverless request paths.
