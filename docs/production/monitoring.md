# Production Monitoring

Monitor only supported health and diagnostic surfaces:

- application contract: `https://keywordsintel.vercel.app/api/version`;
- audit engine: `https://seointel-audit-worker.onrender.com/health`;
- protected Admin Diagnostics for queue, failures, stale leases, request IDs, and compatibility.

Never use the homepage or audit-start route as an uptime ping. Never create audits from a recurring uptime monitor.

Alert on prolonged queue age, stale leases, queue polling errors, database disconnects, compatibility mismatch, elevated failed/abandoned jobs, repeated 429/503 responses, and page-failure spikes by stable code. Database storage and Realtime totals are provider-dashboard metrics and must be labelled unavailable when not retrieved.
