import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Server/worker-only Firebase Admin setup. Never import this module from Vite/browser code.
let cachedDb: Firestore | null | undefined;

export function getAdminFirestore(): Firestore | null {
  if (cachedDb !== undefined) {
    return cachedDb;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    cachedDb = null;
    return cachedDb;
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  cachedDb = getFirestore();
  return cachedDb;
}
