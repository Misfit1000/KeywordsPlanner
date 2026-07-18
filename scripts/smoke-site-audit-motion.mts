import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [landing, liveAudit, activity, workspace, visualSystem, motion, styles, admin] = await Promise.all([
  readFile('src/components/LandingPage.tsx', 'utf8'),
  readFile('src/components/audit/LiveAuditProgress.tsx', 'utf8'),
  readFile('src/components/audit/AuditActivityPanel.tsx', 'utf8'),
  readFile('src/components/audit/AuditWorkspace.tsx', 'utf8'),
  readFile('src/components/ui/visual-system.tsx', 'utf8'),
  readFile('src/components/ui/motion.tsx', 'utf8'),
  readFile('src/index.css', 'utf8'),
  readFile('src/components/admin/AdminControlPrimitives.tsx', 'utf8'),
]);

assert.match(landing, /MotionReveal/, 'Homepage sections should reveal when they enter the viewport.');
assert.match(landing, /site-hero-copy/, 'Homepage hero copy should have a focused entrance.');
assert.match(landing, /site-hero-preview/, 'Homepage product preview should have a focused entrance.');
assert.match(landing, /site-panel-swap/, 'Interactive homepage examples should transition between real states.');

assert.match(liveAudit, /active=\{auditActive\}/, 'Live chart and activity motion should use the real active audit state.');
assert.match(liveAudit, /audit-work-signal/, 'The current-work panel should show audit-engine activity.');
assert.match(activity, /active = false/, 'The activity panel must default to a stopped motion state.');
assert.match(activity, /audit-activity-event/, 'New audit events should enter visibly.');
assert.match(workspace, /audit-section-enter/, 'Stored report sections should transition when routes change.');

assert.match(visualSystem, /useAnimatedNumber/, 'Measured scores should animate between numeric values.');
assert.match(visualSystem, /data-chart-live-point/, 'The event chart should identify the current live point.');
assert.match(motion, /IntersectionObserver/, 'Homepage reveals should avoid scroll polling.');
assert.match(motion, /prefers-reduced-motion: reduce/, 'Numeric and reveal motion should respect reduced-motion preferences.');

assert.match(styles, /\.audit-live-signal\.is-active::after/, 'Continuous activity motion must require an active state.');
assert.match(styles, /\.audit-work-signal\.is-active span/, 'Audit work bars must stop outside active audits.');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/, 'Global reduced-motion handling must remain available.');
assert.match(admin, /AdminAnimatedNumber/, 'Existing administrator motion should remain intact.');

console.log('Site and audit motion smoke checks passed.');
