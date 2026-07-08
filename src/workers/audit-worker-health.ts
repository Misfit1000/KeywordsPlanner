import http from 'node:http';
import type { AuditWorkerRuntimeState } from './audit-worker-runtime';

export function startWorkerHealthServer(
  state: AuditWorkerRuntimeState,
  isReady: () => boolean,
  portValue: string | undefined,
) {
  if (!portValue) return null;
  const port = Number(portValue);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('WORKER_HEALTH_PORT must be a valid TCP port.');
  }

  const server = http.createServer((req, res) => {
    const payload = {
      ok: state.status !== 'failed' && state.status !== 'stopped',
      workerId: state.workerId,
      status: state.status,
      lastSeenAt: state.lastSeenAt,
      currentAuditId: state.currentAuditId,
    };

    if (req.url === '/ready') {
      const ready = isReady();
      res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ...payload, ok: ready }));
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Audit worker health server listening on ${port}`);
  });

  return server;
}
