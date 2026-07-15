# Fixture provider

The fixture provider returns stable article and section-revision structures without a network request. It supports evergreen, news, invalid, timeout, malformed-output, originality-failure, missing-source, and image-failure scenarios.

It requires `BLOG_FIXTURE_PROVIDER_ENABLED=true` and `ALLOW_BLOG_FIXTURE_GENERATION=true`. Production also requires `BLOG_FIXTURE_STAGING_ONLY=true` and `ALLOW_PRODUCTION_BLOG_FIXTURE_GENERATION=true`; all four defaults are false. Use production overrides only in a protected staging deployment.

The provider is admin-only, labelled **Fixture test content**, records provider `fixture_test`, and cannot publish. It is not a Groq fallback and must never be presented as public editorial content.
