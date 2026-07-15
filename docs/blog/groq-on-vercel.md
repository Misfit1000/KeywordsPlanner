# Groq on Vercel

Groq calls run only from trusted Vercel server modules. Structured work defaults to `openai/gpt-oss-120b`; section writing and revisions default to `llama-3.3-70b-versatile`. Clients cannot select a model or provider URL.

The provider retries only timeouts, 429, and 500/502/503/504 responses, respects bounded `Retry-After`, limits output, and maps failures to safe `GROQ_*` codes. Start disabled. Never create `VITE_GROQ_API_KEY`, add Groq variables to Render, or persist raw responses.
