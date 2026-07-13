# Deployment Compatibility

`GET /api/version` returns only the application version, commit identifier, build timestamp, API schema version, audit-engine version, scoring version, and check-registry version.

Migration 011 creates `deployment_versions`. The API and audit engine write their release contracts with the service role. The protected Admin Diagnostics view compares:

- expected frontend/API contract;
- database migration ledger;
- latest audit-engine heartbeat versions.

A known mismatch blocks new audit admission with `AUDIT_SERVICE_UPDATING` and a customer-safe retry message. Existing report reads remain available. Never expose worker identifiers, connection details, or credentials from the public version endpoint.

Deploy in this order: database migration, frontend/API, audit engine, compatibility check, controlled smoke audit.
