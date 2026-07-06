import { auditStore } from '../src/lib/audit/audit-store';

async function run() {
  console.log("Creating test audit...");
  const id = auditStore.createAudit({ url: "https://example.com", type: "seo" });
  console.log("Audit created with ID:", id);

  const initialEvents = auditStore.getAuditEvents(id);
  if (!initialEvents.find(e => e.type === 'audit_queued')) {
    throw new Error("Audit creation did not emit audit_queued");
  }

  let receivedEvents: any[] = [];
  const cb = (ev: any) => { receivedEvents.push(ev); };
  auditStore.subscribeToAudit(id, cb);

  console.log("Emitting sequence of events...");
  
  auditStore.appendAuditEvent(id, { type: 'page_discovered', affectedUrl: 'https://example.com/about' });
  auditStore.appendAuditEvent(id, { type: 'page_crawling', affectedUrl: 'https://example.com/about' });
  auditStore.appendAuditEvent(id, { type: 'page_crawled', affectedUrl: 'https://example.com/about' });
  
  auditStore.appendAuditEvent(id, { type: 'check_started', checkTitle: 'Images' });
  auditStore.appendAuditEvent(id, { type: 'check_completed', checkTitle: 'Images' });
  
  auditStore.appendAuditEvent(id, { type: 'issue_found', severity: 'high', message: 'Missing alt', checkId: 'missing-alt' });
  
  auditStore.appendAuditEvent(id, { type: 'score_updated', data: { score: 85 } });
  
  auditStore.appendAuditEvent(id, { type: 'audit_completed', progress: 100, step: 'Complete' });

  // Verification
  console.log("Verifying event history...");
  const allEvents = auditStore.getAuditEvents(id);
  
  const hasPageDiscovered = allEvents.find(e => e.type === 'page_discovered' && e.affectedUrl === 'https://example.com/about');
  if (!hasPageDiscovered) throw new Error("page_discovered event missing or missing affectedUrl");
  
  if (!allEvents.find(e => e.type === 'page_crawling')) throw new Error("page_crawling event missing");
  if (!allEvents.find(e => e.type === 'page_crawled')) throw new Error("page_crawled event missing");
  if (!allEvents.find(e => e.type === 'check_started')) throw new Error("check_started event missing");
  if (!allEvents.find(e => e.type === 'check_completed')) throw new Error("check_completed event missing");
  if (!allEvents.find(e => e.type === 'score_updated')) throw new Error("score_updated event missing");
  
  const auditCompletedEvent = allEvents.find(e => e.type === 'audit_completed');
  if (!auditCompletedEvent) throw new Error("audit_completed event missing");
  
  const job = auditStore.getAudit(id);
  if (job?.issuesFound !== 1) throw new Error(`issuesFound should be 1, got ${job?.issuesFound}`);
  if (job?.progress !== 100) throw new Error(`progress should be 100 after complete, got ${job?.progress}`);

  if (receivedEvents.length < 8) throw new Error("Subscriber did not receive all events");
  
  auditStore.unsubscribeFromAudit(id, cb);
  auditStore.appendAuditEvent(id, { type: 'step_started', step: 'Post-audit' });
  
  if (receivedEvents.find(e => e.type === 'step_started')) throw new Error("Subscriber received event after unsubscribe");

  console.log("Event history replay works.");
  console.log("Smoke test passed!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
