import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/audit/FindingWorkspace.tsx', 'utf8');
const live = readFileSync('src/components/audit/LiveAuditProgress.tsx', 'utf8');
assert.match(source, /selected \? 'xl:grid-cols-\[minmax\(0,1fr\)_minmax\(380px,440px\)\]' : ''/, 'no inspector column may be reserved while closed');
assert.match(source, /setSelectedId\(issue\.id\)/);
assert.match(source, /setSelectedId\(null\)/);
assert.match(source, /PAGE_SIZE = 20/, 'long lists must be paginated');
assert.match(source, /Search URL or finding/);
assert.match(source, /Filter by error type/);
assert.match(source, /min-w-0 overflow-hidden/);
assert.match(source, /max-h-\[calc\(100dvh-12rem\)\].*overflow-y-auto/);
assert.match(live, /<FindingWorkspace/);
assert.doesNotMatch(live, /grid-cols-\[minmax\(0,1\.2fr\)_minmax\(360px,\.8fr\)\]/);
console.log('Findings layout smoke test passed.');
