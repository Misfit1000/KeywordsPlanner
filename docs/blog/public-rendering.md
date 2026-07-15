# Public article rendering

Public `/blog/:slug` responses contain complete initial HTML rather than an empty client shell. Verify title, description, canonical, robots, H1, tagline, body headings, links, images, dates, BlogPosting JSON-LD, BreadcrumbList JSON-LD, and Open Graph metadata with `npm run smoke:blog-public-initial-html`.

Drafts, previews, fixtures, scheduled articles, archived records, and noindex records are excluded. Unknown or unpublished slugs return a real 404 with noindex. Internal links, external references, and related articles render as normal crawlable anchors.
