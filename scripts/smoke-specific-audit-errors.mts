import assert from 'node:assert/strict';
import { classifyAuditFailure, customerSafeDiagnosticText, failureForCode, failureForHttpStatus } from '../src/lib/audit/audit-failures';

const systemError = (code: string) => Object.assign(new Error(`internal ${code} detail`), { code });
assert.equal(classifyAuditFailure(systemError('ENOTFOUND')).safeTitle, 'Domain name did not resolve');
assert.equal(classifyAuditFailure(systemError('ETIMEDOUT')).safeTitle, 'Connection timed out');
assert.equal(classifyAuditFailure(systemError('ECONNREFUSED')).safeTitle, 'Connection was refused');
assert.equal(classifyAuditFailure(systemError('ERR_TLS_CERT_ALTNAME_INVALID')).safeTitle, 'HTTPS certificate validation failed');
assert.equal(failureForHttpStatus(403).safeTitle, 'Access was denied');
assert.equal(failureForHttpStatus(404).safeTitle, 'Page returned 404 Not Found');
assert.equal(failureForHttpStatus(429).safeTitle, 'The website rate-limited the audit');
assert.equal(failureForHttpStatus(503).safeTitle, 'Website was temporarily unavailable');
assert.equal(failureForCode('REDIRECT_LOOP').safeTitle, 'Redirect loop detected');
assert.equal(failureForCode('ROBOTS_BLOCKED').safeTitle, 'Page was blocked by robots.txt');
assert.equal(failureForCode('RESPONSE_TOO_LARGE').safeTitle, 'Page response exceeded the safe analysis limit');
assert.equal(failureForCode('UNSUPPORTED_CONTENT_TYPE').safeTitle, 'Content type was not suitable for an HTML audit');

for (const raw of ['ENOTFOUND getaddrinfo host', 'ECONNRESET socket hang up', 'worker-production-1 on Render', 'Error at node:internal/task']) {
  const safe = customerSafeDiagnosticText(raw);
  assert.equal(/ENOTFOUND|getaddrinfo|ECONNRESET|worker-|Render|node:internal/i.test(safe), false);
}

console.log('Specific audit error taxonomy smoke test passed.');
