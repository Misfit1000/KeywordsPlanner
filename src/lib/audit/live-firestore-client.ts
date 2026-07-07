import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { API_ROUTES } from '../api/routes';
import { getClientFirestore } from '../firebase/client';
import { safeJsonFetch } from '../http/safe-json';
import { AUDIT_LIMITS } from './audit-config';
import type { ResourceAuditLiveData } from './resource-types';

// Browser-only live subscription client. Server/worker Firestore writes use audit-repository.ts.
export function subscribeToAuditLiveData(
  auditId: string,
  callback: (data: ResourceAuditLiveData) => void,
  onError?: (error: Error) => void,
) {
  const db = getClientFirestore();

  if (!db) {
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await safeJsonFetch<any>(API_ROUTES.auditStatus(auditId));
        if (!cancelled && response.success) {
          callback(response.data.data || response.data);
        }
      } catch (error: any) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };
    const interval = window.setInterval(poll, AUDIT_LIMITS.livePollIntervalMs);
    poll();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }

  let liveData: ResourceAuditLiveData = {
    audit: null,
    latestEvents: [],
    latestPages: [],
    latestIssues: [],
  };

  const emit = () => callback(liveData);
  const auditRef = doc(db, 'audits', auditId);
  const eventsQuery = query(collection(db, 'audits', auditId, 'events'), orderBy('timestamp', 'desc'), limit(50));
  const pagesQuery = query(collection(db, 'audits', auditId, 'pages'), orderBy('crawledAt', 'desc'), limit(100));
  const issuesQuery = query(collection(db, 'audits', auditId, 'issues'), orderBy('detectedAt', 'desc'), limit(100));

  const unsubscribers = [
    onSnapshot(auditRef, (snapshot) => {
      liveData = {
        ...liveData,
        audit: snapshot.exists() ? snapshot.data() as any : null,
      };
      emit();
    }, (error) => onError?.(error)),
    onSnapshot(eventsQuery, (snapshot) => {
      liveData = {
        ...liveData,
        latestEvents: snapshot.docs.map((item) => item.data() as any).reverse(),
      };
      emit();
    }, (error) => onError?.(error)),
    onSnapshot(pagesQuery, (snapshot) => {
      liveData = {
        ...liveData,
        latestPages: snapshot.docs.map((item) => item.data() as any).reverse(),
      };
      emit();
    }, (error) => onError?.(error)),
    onSnapshot(issuesQuery, (snapshot) => {
      liveData = {
        ...liveData,
        latestIssues: snapshot.docs.map((item) => item.data() as any).reverse(),
      };
      emit();
    }, (error) => onError?.(error)),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
