# Audit Coverage

Reports distinguish successful page analysis from unavailable evidence. Coverage records pages discovered, pages analysed, failed pages, robots-blocked pages, and a coverage percentage. Warning summaries group failures by stable code.

Failed and blocked pages are retained as page evidence but do not receive SEO or passive-security results. An unavailable check is reported and does not count as completed or passed. A report is `completed_with_warnings` when at least one page was analysed and some evidence was unavailable; it is `failed` when no page returned usable evidence.

The page allowance counts successfully analysed pages, not failed attempts. The worker keeps a bounded pool of same-site candidates and continues after failed or blocked URLs until the allowance is reached, the site has no more discoverable pages, the candidate safety budget is exhausted, or the audit deadline is reached. Reports state which condition ended the crawl; they never claim that an unreachable page was audited.

Coverage stop reasons are stable and customer-safe: `page_limit_reached`, `crawl_queue_exhausted`, `audit_deadline_reached`, `robots_restricted`, `access_failures`, and `safety_limit_reached`. Redirect aliases that resolve to an already analysed final URL are skipped rather than counted as another analysed page.
