# Blog operations

The protected Operations tab reports provider state, active and failed jobs, stale leases, source failures, stale sources, image failures, static-HTML failures, feed readiness, and migration compatibility.

Safe actions include retrying eligible jobs, cancelling jobs, recovering expired leases, validating sitemap/RSS output, pausing automation, and pausing publication. Each mutating action requires administrator authorization, a reason, rate limiting, and an audit-log record. No SQL, shell, or filesystem console is exposed.
