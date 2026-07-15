# SEOIntel

SEOIntel is a resource-aware SEO, technical SEO, and passive security audit platform. Vercel serves the Vite application and lightweight API; Supabase stores jobs and results; a separate Render worker performs public-site analysis.

## Features

- **Deterministic Audit Engine**: Technical, on-page, crawlability, content, and passive browser-protection checks.
- **Safe Worker Crawling**: SSRF controls, pinned DNS, redirect revalidation, response limits, per-host scheduling, and bounded audit duration.
- **Technical SEO**: Find broken links, redirect chains, missing schemas, and more.
- **Search Data Imports**: Import real performance data from Google Search Console and Bing Webmaster Tools.
- **Imported Link Data**: Review user-supplied Common Crawl or generic SEO CSV exports without inventing backlink metrics.
- **Transparent Scores**: Measured deductions are stored with limitations; unavailable provider data does not affect scores.
- **Account History And Comparison**: Owner-scoped Supabase history with new, resolved, and persistent issue comparison.
- **No Paid Audit APIs**: Audit evidence comes from bounded public-page analysis and user imports.
- **Editorial Content Operations**: Administrator-controlled manual, batch, and optional Groq-backed Vercel jobs with source records, quality gates, review, scheduling, static HTML, RSS, and sitemaps.

## Getting Started

1. Clone the repository.
2. Use Node.js 22 and run `npm ci` to install the locked dependencies.
3. Run `npm run dev` to start the local development server.
4. Open the app in your browser and start an audit.

## Deployment

Deploy the frontend and bounded API to Vercel, apply Supabase migrations, and deploy the audit worker separately to Render. Never run the crawl loop inside a Vercel function. The source of truth is `docs/deployment/production-architecture.md`.

## License

MIT
