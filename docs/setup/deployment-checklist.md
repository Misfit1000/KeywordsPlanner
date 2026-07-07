# Deployment Checklist

## Pre-Deploy

```bash
npm run lint
npm run build
npm run smoke:url
npm run smoke:api-json
npm run smoke:live-audit
npm run smoke:resource-light-audit
npm run e2e:local-audit
npm run verify:seo
npm run verify:security
git diff --check
```

## Vercel

- Set `VITE_FIREBASE_*` environment variables.
- Do not set service account private keys in public `VITE_*` variables.
- Deploy frontend and lightweight API routes only.
- Do not run audit workers or multi-page crawlers in Vercel serverless functions.

## Worker

- Set `FIREBASE_PROJECT_ID`.
- Set `FIREBASE_CLIENT_EMAIL`.
- Set `FIREBASE_PRIVATE_KEY`.
- Run `npm run worker:audit`.
- Verify worker logs show the worker started and can claim queued audits.

## Firebase

- Deploy Firestore rules.
- Deploy Firestore indexes.
- Confirm Firestore database exists.
- Confirm production rules are not open.
- Confirm client reads work for owned audits.

## Post-Deploy

1. Start a Quick Audit with `example.com`.
2. Confirm queued state appears immediately.
3. Confirm the worker picks it up.
4. Confirm current page URL updates.
5. Confirm current check updates.
6. Confirm issue feed updates.
7. Confirm final report appears.
8. Confirm JSON/pages CSV/issues CSV exports work.
9. Confirm cancel works for a queued audit.
