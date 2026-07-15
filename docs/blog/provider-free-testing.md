# Provider-free testing

Normal CI does not contact Groq. Deterministic fixture jobs exercise the same Vercel/Supabase stage transitions and remain draft, noindex, and public-feed excluded. Run the fixture, source, feed, editor, calendar, image, rendering, operations, architecture, audit, SEO, and security smoke commands before deployment.

`smoke:groq-live`, `smoke:blog-live-vercel-workflow`, and `smoke:blog-live-vercel-publication` are opt-in. Missing credentials or explicit flags must be reported as skipped, never passed.
