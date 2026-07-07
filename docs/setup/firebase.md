# Firebase Setup

## Create Project

1. Create a Firebase project in the Firebase console.
2. Enable Firestore in native mode.
3. Enable Firebase Authentication if users will own audits directly.
4. Create a web app and copy the client config values.
5. Create a service account key for the worker/API runtime.

## Frontend Environment

Set these in Vercel and local `.env.local`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

These are browser Firebase client values. Do not put service account credentials in `VITE_*` variables.

## Worker/Admin Environment

Set these only in the server/API and worker environment:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`FIREBASE_PRIVATE_KEY` should preserve newlines or use escaped `\n` sequences. Never commit this value.

## Rules And Indexes

Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore
```

Files:

- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`
- `firebase.json`

The production rules are safe by default:

- Signed-in users can read audits they own.
- Signed-in users can create queued audit jobs for themselves.
- Browser clients cannot mutate worker-owned fields such as locks, final URLs, counts, scores, events, pages, issues, or reports.
- The worker uses `firebase-admin` and bypasses rules.

Temporary local smoke tests can run without Firebase credentials; those tests use the in-memory repository fallback and print that they are not production Firestore.

## Run Worker Locally

```bash
npm run worker:audit
```

Run the frontend/API separately:

```bash
npm run dev
```

## Test Live Updates

1. Start the app with `npm run dev`.
2. Start the worker with `npm run worker:audit`.
3. Open the app and start a Quick Audit for `example.com`.
4. Confirm the live audit page shows queued state immediately.
5. Confirm current URL, current check, pages, issues, and timeline update.
6. Confirm final report exports read stored Firestore data.
