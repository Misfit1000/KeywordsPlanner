# Audit Statuses

- `queued`: waiting for an audit engine lease.
- `running`: leased and collecting evidence.
- `completed`: report generated with no crawl-coverage warnings.
- `completed_with_warnings`: report generated from usable evidence, with one or more pages or checks unavailable.
- `failed`: no usable page evidence was collected, or a fatal audit-level error prevented a report.
- `cancelled`: stopped by the user with partial evidence retained where available.

Every terminal transition writes progress `100`, a completion timestamp, and clears `locked_by`, `locked_at`, and `lease_expires_at`. Client clocks stop for every terminal status. Stale running leases can be reclaimed by another compatible audit engine.
