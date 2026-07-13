# Safe API Errors

Unexpected failures pass through the central API mapper and return:

```json
{"success":false,"error":{"code":"INTERNAL_REQUEST_FAILURE","message":"The request could not be completed. Please try again.","requestId":"..."}}
```

Known audit and admission errors use stable customer-safe codes and appropriate status codes. HTTP 429 includes `Retry-After`.

Internal details are written to the service-role-only `api_error_logs` table with request ID, route, authenticated user ID when available, internal code, timestamp, and deployment version. Redaction removes bearer tokens and common credential assignments. Normal responses never include SQL text, table/column names, file paths, stack traces, provider internals, worker IDs, or secrets.
