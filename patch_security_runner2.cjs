const fs = require('fs');
let code = fs.readFileSync('src/lib/security/audit-runner.ts', 'utf8');

code = code.replace(
  `import { auditStore } from '../audit/audit-store';`,
  `import { auditStore } from '../audit/audit-store';\nimport { eventEmitter } from '../audit/event-emitter';`
);

code = code.replace(/if \(auditId\) auditStore\.appendAuditEvent\(auditId, \{ type: 'audit_started', message: 'Starting security audit', progress: 5, step: 'Fetching homepage' \}\);/,
  `if (auditId) {
    eventEmitter.emitAuditEvent(auditId, { type: 'audit_started', message: 'Starting security audit', progress: 5 });
    eventEmitter.emitStepStarted(auditId, 'Fetching homepage', 'Fetching homepage');
  }`);

code = code.replace(/if \(auditId\) auditStore\.appendAuditEvent\(auditId, \{ type: 'audit_failed', message: 'Failed to fetch security page: ' \+ pageResult\.error \}\);/,
  `if (auditId) eventEmitter.emitAuditFailed(auditId, pageResult.error || 'Unknown error');`);

code = code.replace(/if \(auditId\) auditStore\.appendAuditEvent\(auditId, \{ type: 'step_started', message: 'Running security checks', progress: 50, step: 'Security Checks' \}\);/,
  `if (auditId) {
    eventEmitter.emitStepCompleted(auditId, 'Fetching homepage', 'Homepage fetched');
    eventEmitter.emitStepStarted(auditId, 'Security Checks', 'Running security checks');
    eventEmitter.emitAuditEvent(auditId, { progress: 50 });
  }`);

code = code.replace(/if \(auditId\) auditStore\.appendAuditEvent\(auditId, \{ type: 'step_started', message: 'Calculating security score', progress: 90, step: 'Scoring' \}\);/,
  `if (auditId) {
    eventEmitter.emitStepCompleted(auditId, 'Security Checks', 'Security checks completed');
    eventEmitter.emitStepStarted(auditId, 'Scoring', 'Calculating security score');
    eventEmitter.emitAuditEvent(auditId, { progress: 90 });
  }`);

code = code.replace(/if \(auditId\) \{\s*auditStore\.updateAudit\(auditId, \{ result \}\);\s*auditStore\.appendAuditEvent\(auditId, \{ type: 'audit_completed', message: 'Security audit complete', progress: 100, step: 'Complete' \}\);\s*\}/,
  `if (auditId) {
    eventEmitter.emitScoreUpdated(auditId, { score: scoreResult.securityScore });
    eventEmitter.emitStepCompleted(auditId, 'Scoring', 'Score calculated');
    eventEmitter.emitStepStarted(auditId, 'Report Building', 'Building final report');
    eventEmitter.emitAuditEvent(auditId, { progress: 95 });
    
    auditStore.updateAudit(auditId, { result });
    
    eventEmitter.emitStepCompleted(auditId, 'Report Building', 'Report built');
    eventEmitter.emitAuditCompleted(auditId);
  }`);

fs.writeFileSync('src/lib/security/audit-runner.ts', code);
