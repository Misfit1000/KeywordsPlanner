# Incident Response

1. Confirm the application version, audit-engine health, database availability, and current migration ledger.
2. Pause new Free submissions for queue pressure; use maintenance mode only when existing operations are unsafe.
3. Locate failures by request ID in Admin Diagnostics. Do not ask customers for access tokens or credentials.
4. Distinguish target-site failures from service failures. DNS, HTTP, TLS, robots, and timeout findings must not mark the audit engine offline.
5. Requeue only eligible stale/failed audits, provide an administrator reason, and verify the action log.
6. Preserve logs needed for investigation without exporting secrets, full headers, raw HTML, or unrelated personal data.
7. After recovery, disable maintenance controls, run the manual production smoke, document cause and corrective action, and review retention requirements.

For suspected credential exposure, rotate the affected key first, invalidate sessions where applicable, then inspect access logs. Do not commit incident artifacts to the repository.
