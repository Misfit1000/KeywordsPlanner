# Audit Engine Resilience

Reliability is isolated at audit, phase, page, and check boundaries. Each page fetch is protected; a classified failure is persisted and the scheduler continues. Each SEO check runs independently, so one exception marks only that check unavailable. Passive-security checks have a separate boundary.

Retryable DNS-transient, connection interruption/timeout, and HTTP 429/502/503/504 failures receive at most two total attempts with a short delay. Permanent failures are not retried. HTTPS falls back to HTTP once only for controlled TLS/connection cases, and the report states that insecure fallback was used.

Progress is monotonic. Audit deadlines produce a warning when usable evidence exists. Finalisation always writes a terminal status and releases the lease. Stale leases are reclaimable. Target-site failures never change service health; only queue polling, database connectivity, maintenance, or a fatal engine condition can make health unavailable.
