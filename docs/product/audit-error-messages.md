# Audit Error Messages

Customer-facing failures use stable codes and reviewed copy. Categories cover DNS, connection, TLS, HTTP status, redirects, crawl policy, content safety, restricted networks, unavailable checks, and audit deadlines.

Examples include `DNS_NAME_NOT_FOUND` (Domain name did not resolve), `CONNECTION_TIMEOUT` (Connection timed out), `TLS_CERTIFICATE_INVALID` (HTTPS certificate validation failed), `HTTP_403` (Access was denied), `HTTP_404` (Page returned 404 Not Found), `HTTP_429` (The website rate-limited the audit), `HTTP_503` (Website was temporarily unavailable), `REDIRECT_LOOP`, `ROBOTS_BLOCKED`, `RESPONSE_TOO_LARGE`, and `UNSUPPORTED_CONTENT_TYPE`.

Normal users receive a safe title, explanation, action, affected URL, public HTTP status, retry count, and recovery state. Raw network codes, provider names, process details, worker identifiers, and stack traces are stored only in `audit_diagnostics`, which has RLS enabled and no browser read policy.
