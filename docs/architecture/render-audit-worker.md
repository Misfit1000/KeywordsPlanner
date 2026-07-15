# Render audit worker

Render runs `npm run worker:audit` and claims only rows from the separate `audits` queue. It crawls public pages, performs SEO and passive-security checks, batches results, updates audit progress, and exposes audit-worker health.

Render has no blog polling loop, provider import, scheduler, publication action, or Groq credential. `render.yaml` contains only Supabase server credentials and audit-specific settings. Health should be interpreted as `audit-only` execution.
