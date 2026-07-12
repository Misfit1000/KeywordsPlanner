import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell = readFileSync('src/components/layout/ProductShells.tsx', 'utf8');
const sidebar = readFileSync('src/components/Sidebar.tsx', 'utf8');
assert.match(shell, /h-dvh[^"\n]*overflow-hidden/);
assert.match(shell, /overflow-y-auto/);
assert.match(shell, /overscroll-contain/);
assert.match(sidebar, /h-\[calc\(100dvh-4\.25rem\)\]/);
assert.match(sidebar, /min-h-0 flex-1[^"\n]*overflow-y-auto/);
assert.match(sidebar, /shrink-0 border-t/, 'footer controls must remain outside the scrolling nav');
assert.match(sidebar, /fixed left-0 top-\[4\.25rem\]/, 'mobile navigation must remain an accessible drawer');
console.log('Workspace sidebar smoke test passed.');
