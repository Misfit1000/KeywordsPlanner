# Local Development

## Clone

```bash
mkdir -p seointel-workspace
cd seointel-workspace
git clone https://github.com/Misfit1000/KeywordsPlanner.git SEOIntel
cd SEOIntel
git status
git remote -v
git branch --show-current
git fetch origin
git pull --ff-only
git checkout -b feature/resource-light-audit-worker
```

If the repo already exists, check `git status --short` before changing files. Do not overwrite local changes or force reset unless explicitly instructed.

## Install

This repo uses npm because `package-lock.json` is present.

```bash
npm ci
```

Do not delete lock files, switch package managers, or commit `node_modules`.

## Environment

Create `.env.local` from `.env.example` and fill placeholders locally only.

Frontend Firebase values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Worker/API Firebase Admin values:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Never commit secrets. `.env`, `.env.local`, `.env.*.local`, `node_modules`, `dist`, `.vercel`, and `.firebase` are ignored.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Audit Worker

Run the crawler/check worker in a separate terminal:

```bash
npm run worker:audit
```

For development with file watching:

```bash
npm run worker:audit:dev
```

If an audit stays queued for more than 20 seconds, start the worker or deploy the worker service.

The live audit page warning means the app created the job successfully, but no worker has claimed it yet.

## Checks

Before and after changes, run:

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
git status --short
git diff --check
```
