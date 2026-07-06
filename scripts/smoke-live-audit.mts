import { auditStore } from '../src/lib/audit/audit-store';

async function run() {
  console.log("Creating test audit...");
  const id = auditStore.createAudit({ url: "https://example.com", type: "seo" });
  console.log("Audit created with ID:", id);
  
  console.log("Testing append event...");
  auditStore.appendAuditEvent(id, { type: "step_started", message: "Smoke test running", step: "Init" });
  
  const events = auditStore.getAuditEvents(id);
  if (events.length !== 2) {
    throw new Error(`Expected 2 events (queued + smoke test), got ${events.length}`);
  }
  
  console.log("Testing subscribe...");
  let gotEvent = false;
  const cb = (ev: any) => { gotEvent = true; console.log("Received event:", ev.type); };
  auditStore.subscribeToAudit(id, cb);
  
  auditStore.appendAuditEvent(id, { type: "issue_found", message: "Smoke issue", severity: "high" });
  
  if (!gotEvent) throw new Error("Subscribe failed to receive event");
  
  auditStore.unsubscribeFromAudit(id, cb);
  
  const job = auditStore.getAudit(id);
  if (job?.issuesFound !== 1) throw new Error("Job state did not update based on event");
  
  console.log("Smoke test passed!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
