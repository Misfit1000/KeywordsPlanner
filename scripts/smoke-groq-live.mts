import { GroqBlogProviderError, testGroqProvider } from '../src/lib/blog/server/groq';

if (!process.env.GROQ_API_KEY || process.env.GROQ_BLOG_ENABLED !== 'true') {
  console.log('Skipped: set GROQ_API_KEY and GROQ_BLOG_ENABLED=true to run one minimal server-path request.');
  process.exit(0);
}
try {
  const result = await testGroqProvider();
  console.log(JSON.stringify({ status: result.status, model: result.model, durationMs: result.durationMs, errorCode: result.errorCode }));
  if (result.status !== 'connected') process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', errorCode: error instanceof GroqBlogProviderError ? error.code : 'GROQ_UNAVAILABLE' }));
  process.exitCode = 1;
}
