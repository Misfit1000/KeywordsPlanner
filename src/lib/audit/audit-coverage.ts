export type CrawlStopReason =
  | 'page_limit_reached'
  | 'crawl_queue_exhausted'
  | 'audit_deadline_reached'
  | 'robots_restricted'
  | 'access_failures'
  | 'safety_limit_reached';

export function describeCrawlCompletion(input: {
  stopReason?: string | null;
  pagesAnalysed: number;
  pageLimit: number;
}) {
  const count = `${input.pagesAnalysed} of ${input.pageLimit} pages analysed.`;
  if (input.stopReason === 'page_limit_reached') return `${count} The audit reached its page allowance.`;
  if (input.stopReason === 'audit_deadline_reached') return `${count} The audit reached its safe execution deadline.`;
  if (input.stopReason === 'robots_restricted') return `${count} Search engine access rules prevented additional eligible pages from being checked.`;
  if (input.stopReason === 'access_failures') return `${count} Additional discovered pages could not be accessed safely.`;
  if (input.stopReason === 'safety_limit_reached') return `${count} The audit reached its safe candidate-attempt limit.`;
  if (input.stopReason === 'crawl_queue_exhausted') return `${count} No additional eligible public pages were found.`;
  return count;
}
