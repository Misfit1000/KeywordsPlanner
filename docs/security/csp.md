# Content Security Policy

Vercel applies a deny-by-default policy for scripts, frames, objects, base URLs, and form targets. Connections are limited to the same origin, Supabase HTTPS/WebSocket endpoints, and the configured audit-engine health origin. Images may use HTTPS, data, or blob URLs for report/download previews.

The stylesheet permits inline styles because the current Tailwind/runtime components set bounded dynamic styles. Scripts do not permit `unsafe-inline` or `unsafe-eval`. External Google font loading was removed; system font stacks avoid a render-blocking third-party request.

Also enabled: HSTS, `nosniff`, frame denial, strict referrer policy, restrictive permissions policy, and Cross-Origin-Opener-Policy. Run `npm run smoke:csp` after any integration change.
