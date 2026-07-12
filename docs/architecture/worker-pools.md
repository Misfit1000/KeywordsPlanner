# Audit Engine Pools

Queue rows retain plan, requested/effective mode, priority, processing tier, and lease metadata. Any compatible engine can claim queued work or recover an expired lease. Current free and paid engines support quick and standard modes; deep mode remains gated by deployed capability.

Future always-on or paid pools can use distinct engine IDs, supported modes, and priority policies without changing browser or API contracts. Shared storage remains the coordination boundary. Long crawl loops never run in the frontend request path.
