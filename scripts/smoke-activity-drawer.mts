import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/audit/AuditActivityPanel.tsx', 'utf8');
const live = readFileSync('src/components/audit/LiveAuditProgress.tsx', 'utf8');
assert.match(source, /localStorage\.getItem\(PREFERENCE_KEY\) === 'open'/, 'activity must be closed on first use');
assert.match(source, /role="dialog"/);
assert.match(source, /aria-modal="true"/);
assert.match(source, /event\.key === 'Escape'/);
assert.match(source, /event\.key !== 'Tab'/, 'drawer must trap keyboard focus');
assert.match(source, /md:w-\[min\(460px,calc\(100vw-2rem\)\)\]/, 'desktop drawer width must be bounded');
assert.match(source, /inset-x-0 bottom-0/, 'mobile must use a bottom sheet');
assert.match(source, /warning_summary/);
assert.match(source, /customerSafeDiagnosticText/);
assert.match(live, /<AuditActivityPanel events=\{data\.latestEvents\}/);
assert.doesNotMatch(live, /Audit timeline/);
console.log('Activity drawer smoke test passed.');
