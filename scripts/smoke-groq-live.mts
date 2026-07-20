import {
  getGroqBlogConfiguration,
  GroqBlogProviderError,
  testGroqProvider,
} from '../src/lib/blog/server/groq';

async function availableModelIds() {
  const config = getGroqBlogConfiguration();
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];
    const body = await response.json() as { data?: Array<{ id?: unknown }> };
    return (body.data || [])
      .map((model) => String(model.id || ''))
      .filter((model) => /^[a-z0-9._/-]+$/i.test(model))
      .sort();
  } catch {
    return [];
  }
}

if (!process.env.GROQ_API_KEY || process.env.GROQ_BLOG_ENABLED !== 'true') {
  console.log('Skipped: set GROQ_API_KEY and GROQ_BLOG_ENABLED=true to run one minimal server-path request.');
  process.exit(0);
}
try {
  const result = await testGroqProvider();
  const models = result.status === 'connected' ? [] : await availableModelIds();
  console.log(JSON.stringify({
    status: result.status,
    model: result.model,
    durationMs: result.durationMs,
    errorCode: result.errorCode,
    ...(models.length ? { availableModels: models } : {}),
  }));
  if (result.status !== 'connected') process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', errorCode: error instanceof GroqBlogProviderError ? error.code : 'GROQ_UNAVAILABLE' }));
  process.exitCode = 1;
}
