# Sitemap and RSS

The sitemap includes only published canonical indexable articles and uses each article's update time for `lastmod`. RSS uses canonical article links and publication dates. The news sitemap includes only recent high-priority eligible news; older indexable news remains in the normal sitemap.

Drafts, previews, fixtures, scheduled, archived, deleted, and noindex records are excluded. Run `npm run smoke:blog-feed-output` and use the protected Operations validation actions after deployment.
