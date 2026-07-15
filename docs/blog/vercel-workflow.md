# Vercel blog workflow

Migration 015 marks new blog jobs with `execution_target=vercel`. Each invocation atomically claims one expected stage, records its execution lease, performs one bounded responsibility, stores a JSON output patch, and advances the stage. Article creation remains idempotent through the unique `generation_job_id` index.

Normal requests do not wait for an article. Admin job status is durable across refreshes, deployments, and interrupted functions. Fixture jobs use the same stages but remain private, draft, noindex, and excluded from public feeds.
