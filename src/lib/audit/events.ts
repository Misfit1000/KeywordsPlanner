export type AuditEventType =
  | "audit_queued"
  | "audit_started"
  | "step_started"
  | "step_completed"
  | "page_discovered"
  | "page_crawling"
  | "page_crawled"
  | "page_failed"
  | "check_started"
  | "check_completed"
  | "issue_found"
  | "score_updated"
  | "audit_completed"
  | "audit_failed"
  | "audit_warning";

export interface AuditLiveEvent {
  id: string;
  auditId: string;
  type: AuditEventType;
  timestamp: string;
  message: string;
  step?: string;
  category?: string;
  checkId?: string;
  checkTitle?: string;
  affectedUrl?: string;
  progress: number;
  pagesDiscovered?: number;
  pagesCrawled?: number;
  checksTotal?: number;
  checksCompleted?: number;
  issuesFound?: number;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  data?: unknown;
}
