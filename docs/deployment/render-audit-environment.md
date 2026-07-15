# Render audit environment

Render requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUDIT_WORKER_ID`, `AUDIT_POLL_INTERVAL_MS`, `WORKER_RUNTIME`, and audit feature flags such as `DEEP_AUDIT_ENABLED`. Do not add `WORKER_HEALTH_PORT`; the service binds to Render's injected `PORT` automatically.

Remove all `GROQ_*`, `BLOG_*`, provider, scheduler, dispatcher, and fixture variables from Render. Deploy the same commit as Vercel and confirm the service starts with `npm run worker:audit` and reports audit-only health before running Quick, Full/Deep, and Passive Security regressions.
