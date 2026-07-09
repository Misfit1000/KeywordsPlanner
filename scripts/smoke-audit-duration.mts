import assert from 'node:assert/strict';
import {
  formatAuditElapsed,
  getAuditTerminalTime,
  isTerminalAuditStatus,
} from '../src/lib/audit/audit-time';

const baseAudit = {
  createdAt: '2026-01-01T00:00:00.000Z',
  startedAt: '2026-01-01T00:00:05.000Z',
  updatedAt: '2026-01-01T00:00:05.000Z',
  completedAt: null,
  cancelledAt: null,
};

assert.equal(isTerminalAuditStatus('running'), false);
assert.equal(isTerminalAuditStatus('completed'), true);
assert.equal(isTerminalAuditStatus('failed'), true);
assert.equal(isTerminalAuditStatus('cancelled'), true);

assert.equal(
  formatAuditElapsed(
    { ...baseAudit, status: 'running' },
    Date.parse('2026-01-01T00:01:05.000Z'),
  ),
  '1m 0s',
);

assert.equal(
  formatAuditElapsed(
    {
      ...baseAudit,
      status: 'completed',
      completedAt: '2026-01-01T00:01:35.000Z',
      updatedAt: '2026-01-01T00:10:00.000Z',
    },
    Date.parse('2026-01-01T00:20:00.000Z'),
  ),
  '1m 30s',
);

assert.equal(
  formatAuditElapsed(
    {
      ...baseAudit,
      status: 'cancelled',
      cancelledAt: '2026-01-01T00:00:45.000Z',
      updatedAt: '2026-01-01T00:10:00.000Z',
    },
    Date.parse('2026-01-01T00:20:00.000Z'),
  ),
  '40s',
);

assert.equal(
  formatAuditElapsed(
    {
      ...baseAudit,
      status: 'failed',
      completedAt: '2026-01-01T00:02:05.000Z',
      updatedAt: '2026-01-01T00:10:00.000Z',
    },
    Date.parse('2026-01-01T00:20:00.000Z'),
  ),
  '2m 0s',
);

assert.equal(
  getAuditTerminalTime({
    ...baseAudit,
    status: 'failed',
    completedAt: null,
    updatedAt: '2026-01-01T00:02:05.000Z',
  }),
  Date.parse('2026-01-01T00:02:05.000Z'),
);

console.log('Audit duration smoke test passed.');
