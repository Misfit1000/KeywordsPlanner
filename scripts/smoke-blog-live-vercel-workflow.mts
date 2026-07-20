import { blogAutomationRepository } from '../src/lib/blog/automation-repository';
import { dispatchVercelBlogStages } from '../src/lib/blog/server/vercel-workflow';

if (process.env.ALLOW_LIVE_BLOG_TEST !== 'true' || !process.env.GROQ_API_KEY || process.env.GROQ_BLOG_ENABLED !== 'true' || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Skipped: live Vercel workflow requires explicit flag, Groq credentials, and Supabase server credentials.');
  process.exit(0);
}
const key = `live-vercel-workflow:${Date.now()}`;
const job = await blogAutomationRepository.createJob({ origin: 'admin_manual', topic: '[TEST] HTML title element workflow', provider: 'groq', payload: { jobType: 'generate_article', articleType: 'evergreen_guide' }, idempotencyKey: key });
for (let stage = 0; stage < 20; stage += 1) {
  const result = await dispatchVercelBlogStages({ requestedJobId: job.id, maxStages: 1 });
  const current = await blogAutomationRepository.getJob(job.id);
  if (!result.processedStages || ['ready_for_review', 'failed', 'cancelled'].includes(current?.workflowStage || '')) break;
}
const current = await blogAutomationRepository.getJob(job.id);
console.log(JSON.stringify({
  jobId: job.id,
  state: current?.state,
  stage: current?.workflowStage,
  executionTarget: current?.executionTarget,
  stageAttemptCount: current?.stageAttemptCount,
  lastSafeErrorCode: current?.lastSafeErrorCode,
  statusMessage: current?.statusMessage,
  nextRetryAt: current?.nextRetryAt,
  published: false,
}));
if (current?.workflowStage !== 'ready_for_review') process.exitCode = 1;
