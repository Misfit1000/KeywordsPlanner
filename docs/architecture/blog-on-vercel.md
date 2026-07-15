# Blog execution on Vercel

Vercel owns protected blog APIs and all blog execution. A job request authenticates the administrator, inserts one `blog_generation_jobs` row, returns `202` with a queued job ID, and requests a finite chain of bounded dispatches. Supabase stores stages, leases, attempts, outputs, retries, articles, revisions, schedules, and progress. A daily Vercel Cron is the free-plan-compatible recovery safety net; no permanent blog process is required.

Groq is imported only by `src/lib/blog/server`. The browser receives safe status and model names, never credentials or raw provider bodies. Render does not contain blog code or blog variables.
