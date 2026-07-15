# Blog automation setup

Apply every Supabase migration in numeric order through 015. Migration 015 preserves historical execution records, defaults new jobs to Vercel, enables Realtime progress, and adds atomic stage claim, completion, defer, and recovery functions.

Vercel serves the Vite application, protected blog APIs, bounded workflow stages, source/feed processing, publication, complete article HTML, sitemap, news sitemap, and RSS. Configure the server variables in `docs/deployment/vercel-blog-environment.md`. Never use a `VITE_` prefix for Groq, service-role, dispatcher, or cron secrets.

Render runs audits only. Configure the variables in `docs/deployment/render-audit-environment.md`; do not add blog or provider settings. Keep `GROQ_BLOG_ENABLED=false` and `BLOG_AUTOMATION_ENABLED=false` for the first Vercel deploy. Test Groq, process one unpublished draft through every stage, verify section revision and discovery output, then enable automation while review-first mode remains active.

Publication requires valid source, originality, metadata, link, image/no-image, quality, and initial-HTML gates. Published public responses include canonical, robots, Open Graph, Article JSON-LD, Breadcrumb JSON-LD, related links, and responsive images. Drafts, previews, fixtures, and scheduled posts before release remain private and noindex.
