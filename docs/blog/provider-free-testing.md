# Provider-free testing

Migrations 013 and 014 are required. Keep NVIDIA disabled while no credential exists. Normal CI uses deterministic fixtures and must not contact NVIDIA.

Run the fixture, source, feed, editor, calendar, image, rendering, operations, SEO, and security smoke commands before deployment. Credential-backed NVIDIA, scheduler, and publication scripts remain optional and must be reported as skipped until their credentials and explicit flags exist.

Fixture records use `fixture_test=true` and `noindex,nofollow`. Server validation and public repository queries prevent them from entering article pages, topic hubs, sitemaps, news sitemap, or RSS.
