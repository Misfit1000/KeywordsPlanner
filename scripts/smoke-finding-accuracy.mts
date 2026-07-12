import assert from 'node:assert/strict';
import { buildIssueInsight } from '../src/lib/audit/client-insights.ts';
import { runCheckSetSafely } from '../src/lib/seo/checks/runner.ts';
import type { ResourceAuditIssue } from '../src/lib/audit/resource-types.ts';

const issue = (patch: Partial<ResourceAuditIssue>): ResourceAuditIssue => ({
  id: 'finding', severity: 'high', category: 'technical', title: 'Finding', description: 'Measured finding',
  affectedUrl: 'https://example.com/page', evidence: 'Evidence', recommendation: 'Fix it.', detectedAt: new Date().toISOString(), ...patch,
});

const notFound = buildIssueInsight(issue({ title: 'Page returned 404 Not Found', failureCode: 'HTTP_404' }));
assert.match(notFound.whyItMatters, /Broken destinations/);
assert.match(notFound.whyItMatters, /internal links/);
const noindex = buildIssueInsight(issue({ title: 'Page contains a noindex directive', failureCode: 'NOINDEX_DETECTED' }));
assert.match(noindex.whyItMatters, /may be intentional/);
assert.match(noindex.whyItMatters, /sitemap/);

const checks = runCheckSetSafely([
  { id: 'broken', title: 'Broken check', run: () => { throw new Error('private stack detail'); } },
  { id: 'working', title: 'Working check', run: () => [({ id: 'real-result', severity: 'low', category: 'seo', title: 'Real result', description: 'Measured', affectedUrl: 'https://example.com', evidence: 'evidence', recommendation: 'fix' })] },
], { url: 'https://example.com' });
assert.equal(checks.completedChecks, 1, 'an unavailable check must not count as passed');
assert.equal(checks.unavailableChecks.length, 1);
assert.equal(checks.issues.length, 1, 'remaining checks must continue');

const sourceOne = issue({ id: 'one', title: 'Page returned 404 Not Found', affectedUrl: 'https://example.com/missing', sourceUrls: ['https://example.com/a'], findingKey: 'HTTP_404|https://example.com/missing' });
const sourceTwo = issue({ id: 'two', title: 'Page returned 404 Not Found', affectedUrl: 'https://example.com/missing', sourceUrls: ['https://example.com/b'], findingKey: 'HTTP_404|https://example.com/missing' });
const grouped = new Map<string, ResourceAuditIssue[]>();
for (const finding of [sourceOne, sourceTwo]) grouped.set(finding.findingKey!, [...(grouped.get(finding.findingKey!) || []), finding]);
assert.equal(grouped.size, 1, 'duplicate broken-link findings must have a stable grouping key');
assert.equal(new Set([...grouped.values()][0].flatMap((finding) => finding.sourceUrls || [])).size, 2);
console.log('Finding accuracy smoke test passed.');
