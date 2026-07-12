# Finding Accuracy

Findings are created only from measured page evidence or an explicit unavailable-evidence condition. Failed pages do not receive successful SEO or security checks, and unavailable checks do not count as passed.

HTTP 404 guidance explains broken visitor journeys, crawl paths, internal links, and sitemap cleanup. `noindex` guidance is conditional because exclusion may be intentional; users should review sitemap inclusion, internal prominence, page purpose, and canonical destination first.

Failure findings carry a stable `finding_key`, `failure_code`, source URLs, and affected-page count. These fields support grouping duplicate broken destinations and showing source context without inventing evidence.
