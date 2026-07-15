# Environment Variable Inventory

Use independent secrets for each purpose. Never copy a service-role or provider key into a `VITE_` variable.

## Browser-safe Vercel build variables

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/publishable browser key.
- `VITE_UPGRADE_URL`: optional external upgrade destination.

## Vercel server-only

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: privileged API and durable job access.
- `APP_URL`: canonical origin, currently `https://keywordsintel.vercel.app`.
- `RATE_LIMIT_HASH_SECRET`: independent random secret used to hash request identifiers.
- `BLOG_DISPATCH_SECRET`: independent random secret for internal bounded dispatch calls.
- `CRON_SECRET`: independent random secret supplied by Vercel Cron.
- `ADMIN_EMAILS`: optional bootstrap list; database roles remain authoritative.
- `GUEST_DAILY_AUDIT_LIMIT`, `DOMAIN_DAILY_AUDIT_LIMIT`, `GLOBAL_ACTIVE_AUDIT_LIMIT`, `API_JSON_BODY_LIMIT`: optional server limits.
- `TURNSTILE_SECRET_KEY`: optional server-side verification; enable only with a matching browser widget and platform setting.

## Vercel blog-only

- `GROQ_API_KEY`, `GROQ_API_BASE_URL`, `GROQ_BLOG_STRUCTURED_MODEL`, `GROQ_BLOG_WRITER_MODEL`.
- `GROQ_BLOG_ENABLED`, `BLOG_AUTOMATION_ENABLED`.
- Optional bounded capacity: `GROQ_BLOG_MAX_CONCURRENCY`, `GROQ_BLOG_MIN_REQUEST_INTERVAL_MS`, `GROQ_BLOG_MAX_RETRIES`.
- Fixture and live-test flags in `.env.example` are disabled by default and must not be enabled casually in production.

## Audit worker-only

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- `AUDIT_WORKER_ID`, `AUDIT_POLL_INTERVAL_MS`, `WORKER_RUNTIME`, `DEEP_AUDIT_ENABLED`.
- Render injects `PORT`; do not define `WORKER_HEALTH_PORT` there. `WORKER_HEALTH_PORT` is an optional override for local or non-Render hosts only.
- `AUDIT_MAX_HTML_BYTES` is optional. `SEOINTEL_ALLOW_PRIVATE_TEST_TARGETS` is local-test-only and must never be deployed.

Do not add `GROQ_*`, `BLOG_*`, `CRON_SECRET`, `RATE_LIMIT_HASH_SECRET`, or browser `VITE_*` variables to Render.

## CI and local verification

- `BUILD_TIMESTAMP`, `GIT_COMMIT_SHA`: optional version metadata; CI sets these for builds.
- `APP_URL`, `WORKER_URL`, `RUN_AUDIT_SMOKE`: production smoke inputs. Audit creation remains opt-in.
- Supabase CLI/local variables are optional for local database workflows and are not browser configuration.
