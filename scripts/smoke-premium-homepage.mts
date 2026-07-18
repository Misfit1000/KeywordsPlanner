import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [source, planSource] = await Promise.all([
  readFile('src/components/LandingPage.tsx', 'utf8'),
  readFile('src/lib/plans/public-plan-presentation.ts', 'utf8'),
]);

assert.match(source, /See what is holding your website back\./);
assert.match(source, /id="start-audit"/);
assert.match(source, /View example report/);
assert.match(source, /Example report/);
assert.match(source, /Demonstration data/);
assert.match(source, /Audit coverage/);
assert.match(source, /What to fix first|Specific recommendations/);
assert.match(source, /The report becomes a working backlog/);
assert.match(source, /The report is clear about what it knows/);
assert.match(source, /PUBLIC_AUDIT_PLANS/);
assert.match(planSource, /name: 'Free'/);
assert.match(planSource, /name: 'Plus'/);
assert.match(planSource, /name: 'Pro'/);
assert.doesNotMatch(planSource, /name: 'Admin'/);
assert.doesNotMatch(source, /trusted by|customer logos?|testimonials?|traffic growth|ranking increase/i);
assert.match(source, /content-auto/);
console.log('Premium homepage structure smoke test passed.');
