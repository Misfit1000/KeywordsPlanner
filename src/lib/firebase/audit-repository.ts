import { randomUUID, createHash } from 'node:crypto';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
import {
  AUDIT_LIMITS,
  type AuditMode,
  type ResourceAuditDocument,
  type ResourceAuditEvent,
  type ResourceAuditIssue,
  type ResourceAuditLiveData,
  type ResourceAuditPage,
  type ResourceAuditReport,
  getAuditModeConfig,
} from '../audit/resource-types';

// Server/worker-only repository. Browser live updates must use live-firestore-client.ts.
function nowIso() {
  return new Date().toISOString();
}

function expiresAtIso() {
  const date = new Date();
  date.setDate(date.getDate() + AUDIT_LIMITS.defaultExpiresInDays);
  return date.toISOString();
}

function pageIdForUrl(url: string) {
  return createHash('sha256').update(url).digest('hex').slice(0, 40);
}

function docData<T>(snapshot: QueryDocumentSnapshot): T {
  return snapshot.data() as T;
}

const memory = {
  audits: new Map<string, ResourceAuditDocument>(),
  events: new Map<string, ResourceAuditEvent[]>(),
  pages: new Map<string, ResourceAuditPage[]>(),
  issues: new Map<string, ResourceAuditIssue[]>(),
  reports: new Map<string, ResourceAuditReport>(),
};

export const auditRepository = {
  isFirestoreEnabled() {
    return Boolean(getAdminFirestore());
  },

  async createAuditJob(input: {
    submittedInput: string;
    normalizedUrl: string;
    hostname: string;
    mode?: AuditMode;
    userId?: string | null;
    projectId?: string | null;
  }): Promise<ResourceAuditDocument> {
    const id = randomUUID();
    const config = getAuditModeConfig(input.mode);
    const timestamp = nowIso();
    const audit: ResourceAuditDocument = {
      id,
      userId: input.userId ?? null,
      projectId: input.projectId ?? null,
      submittedInput: input.submittedInput,
      normalizedUrl: input.normalizedUrl,
      finalUrl: null,
      hostname: input.hostname,
      mode: config.mode,
      status: 'queued',
      progress: 0,
      currentPhase: 'Queued',
      currentUrl: null,
      currentCheck: null,
      pageLimit: config.pageLimit,
      pagesDiscovered: 0,
      pagesCrawled: 0,
      checksTotal: 0,
      checksCompleted: 0,
      issuesFound: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      expiresAt: expiresAtIso(),
      cancelledAt: null,
      error: null,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
    };

    const db = getAdminFirestore();
    if (db) {
      await db.collection('audits').doc(id).set(audit);
    } else {
      memory.audits.set(id, audit);
      memory.events.set(id, []);
      memory.pages.set(id, []);
      memory.issues.set(id, []);
    }

    await this.appendEvent(id, {
      type: 'audit_queued',
      message: `Audit queued for ${input.hostname}`,
      phase: 'Queued',
      progress: 0,
    });

    return audit;
  },

  async getAudit(id: string): Promise<ResourceAuditDocument | null> {
    const db = getAdminFirestore();
    if (db) {
      const snapshot = await db.collection('audits').doc(id).get();
      return snapshot.exists ? (snapshot.data() as ResourceAuditDocument) : null;
    }
    return memory.audits.get(id) ?? null;
  },

  async updateAudit(id: string, patch: Partial<ResourceAuditDocument>) {
    const update = { ...patch, updatedAt: nowIso() };
    const db = getAdminFirestore();
    if (db) {
      await db.collection('audits').doc(id).set(update, { merge: true });
      return;
    }
    const current = memory.audits.get(id);
    if (current) {
      memory.audits.set(id, { ...current, ...update });
    }
  },

  async cancelAudit(id: string) {
    const timestamp = nowIso();
    await this.updateAudit(id, {
      status: 'cancelled',
      cancelledAt: timestamp,
      completedAt: timestamp,
      currentPhase: 'Cancelled by user',
      currentCheck: null,
      lockedBy: null,
      lockedAt: null,
      leaseExpiresAt: null,
    });
    await this.appendEvent(id, {
      type: 'audit_cancelled',
      timestamp,
      message: 'Audit cancelled by user',
      phase: 'Cancelled by user',
    });
  },

  async appendEvent(auditId: string, event: Omit<Partial<ResourceAuditEvent>, 'id'>) {
    const id = randomUUID();
    const audit = await this.getAudit(auditId);
    const fullEvent: ResourceAuditEvent = {
      id,
      type: event.type || 'progress_update',
      timestamp: event.timestamp || nowIso(),
      message: event.message || '',
      phase: event.phase,
      currentUrl: event.currentUrl,
      affectedUrl: event.affectedUrl,
      category: event.category,
      checkId: event.checkId,
      checkTitle: event.checkTitle,
      severity: event.severity,
      progress: event.progress ?? audit?.progress,
      data: event.data,
    };

    const db = getAdminFirestore();
    if (db) {
      await db.collection('audits').doc(auditId).collection('events').doc(id).set(fullEvent);
      const oldEvents = await db.collection('audits').doc(auditId).collection('events')
        .orderBy('timestamp', 'asc')
        .limit(25)
        .get();
      const eventCount = (await db.collection('audits').doc(auditId).collection('events').count().get()).data().count;
      if (eventCount > AUDIT_LIMITS.maxEvents) {
        const batch = db.batch();
        oldEvents.docs.slice(0, eventCount - AUDIT_LIMITS.maxEvents).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    } else {
      const events = memory.events.get(auditId) ?? [];
      events.push(fullEvent);
      memory.events.set(auditId, events.slice(-AUDIT_LIMITS.maxEvents));
    }
  },

  async appendPage(auditId: string, page: Omit<ResourceAuditPage, 'id'>) {
    const fullPage: ResourceAuditPage = { id: pageIdForUrl(page.url), ...page };
    const db = getAdminFirestore();
    if (db) {
      await db.collection('audits').doc(auditId).collection('pages').doc(fullPage.id).set(fullPage, { merge: true });
      return fullPage;
    }
    const pages = memory.pages.get(auditId) ?? [];
    const next = pages.filter((item) => item.id !== fullPage.id);
    next.push(fullPage);
    memory.pages.set(auditId, next);
    return fullPage;
  },

  async appendIssue(auditId: string, issue: Omit<ResourceAuditIssue, 'id' | 'detectedAt'> & { id?: string; detectedAt?: string }) {
    const fullIssue: ResourceAuditIssue = {
      id: issue.id || randomUUID(),
      severity: issue.severity,
      category: issue.category,
      title: issue.title,
      description: issue.description,
      affectedUrl: issue.affectedUrl,
      evidence: issue.evidence,
      recommendation: issue.recommendation,
      detectedAt: issue.detectedAt || nowIso(),
    };

    const db = getAdminFirestore();
    if (db) {
      const issuesCount = (await db.collection('audits').doc(auditId).collection('issues').count().get()).data().count;
      if (issuesCount >= AUDIT_LIMITS.maxIssues) {
        return null;
      }
      await db.collection('audits').doc(auditId).collection('issues').doc(fullIssue.id).set(fullIssue);
    } else {
      const issues = memory.issues.get(auditId) ?? [];
      if (issues.length >= AUDIT_LIMITS.maxIssues) {
        return null;
      }
      issues.push(fullIssue);
      memory.issues.set(auditId, issues);
    }

    const countPatch: Partial<ResourceAuditDocument> = {
      issuesFound: (await this.getIssues(auditId)).length,
    };
    if (fullIssue.severity === 'critical') countPatch.criticalCount = (await this.getIssues(auditId)).filter((item) => item.severity === 'critical').length;
    if (fullIssue.severity === 'high') countPatch.highCount = (await this.getIssues(auditId)).filter((item) => item.severity === 'high').length;
    if (fullIssue.severity === 'medium') countPatch.mediumCount = (await this.getIssues(auditId)).filter((item) => item.severity === 'medium').length;
    if (fullIssue.severity === 'low') countPatch.lowCount = (await this.getIssues(auditId)).filter((item) => item.severity === 'low').length;
    await this.updateAudit(auditId, countPatch);

    await this.appendEvent(auditId, {
      type: 'issue_found',
      message: fullIssue.title,
      affectedUrl: fullIssue.affectedUrl,
      category: fullIssue.category,
      severity: fullIssue.severity,
      data: {
        evidence: fullIssue.evidence,
        recommendation: fullIssue.recommendation,
      },
    });

    return fullIssue;
  },

  async getEvents(auditId: string, limit = 50): Promise<ResourceAuditEvent[]> {
    const db = getAdminFirestore();
    if (db) {
      const snapshot = await db.collection('audits').doc(auditId).collection('events')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => docData<ResourceAuditEvent>(doc)).reverse();
    }
    return (memory.events.get(auditId) ?? []).slice(-limit);
  },

  async getPages(auditId: string, limit = 100): Promise<ResourceAuditPage[]> {
    const db = getAdminFirestore();
    if (db) {
      const snapshot = await db.collection('audits').doc(auditId).collection('pages')
        .orderBy('crawledAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => docData<ResourceAuditPage>(doc)).reverse();
    }
    return (memory.pages.get(auditId) ?? []).slice(-limit);
  },

  async getIssues(auditId: string, limit = 1000): Promise<ResourceAuditIssue[]> {
    const db = getAdminFirestore();
    if (db) {
      const snapshot = await db.collection('audits').doc(auditId).collection('issues')
        .orderBy('detectedAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => docData<ResourceAuditIssue>(doc)).reverse();
    }
    return (memory.issues.get(auditId) ?? []).slice(-limit);
  },

  async setFinalReport(auditId: string, report: ResourceAuditReport) {
    const db = getAdminFirestore();
    if (db) {
      await db.collection('audits').doc(auditId).collection('reports').doc('final').set(report);
      return;
    }
    memory.reports.set(auditId, report);
  },

  async getFinalReport(auditId: string): Promise<ResourceAuditReport | null> {
    const db = getAdminFirestore();
    if (db) {
      const snapshot = await db.collection('audits').doc(auditId).collection('reports').doc('final').get();
      return snapshot.exists ? (snapshot.data() as ResourceAuditReport) : null;
    }
    return memory.reports.get(auditId) ?? null;
  },

  async getLiveData(auditId: string): Promise<ResourceAuditLiveData> {
    return {
      audit: await this.getAudit(auditId),
      latestEvents: await this.getEvents(auditId, 50),
      latestPages: await this.getPages(auditId, 100),
      latestIssues: await this.getIssues(auditId, 100),
      finalReport: await this.getFinalReport(auditId),
    };
  },

  async claimNextQueuedAudit(workerId: string): Promise<ResourceAuditDocument | null> {
    const leaseExpiresAt = new Date(Date.now() + AUDIT_LIMITS.lockLeaseMs).toISOString();
    const timestamp = nowIso();
    const db = getAdminFirestore();

    if (db) {
      let candidate = await db.collection('audits')
        .where('status', '==', 'queued')
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

      if (candidate.empty) {
        candidate = await db.collection('audits')
          .where('status', '==', 'running')
          .where('leaseExpiresAt', '<', timestamp)
          .orderBy('leaseExpiresAt', 'asc')
          .limit(1)
          .get();
      }

      if (candidate.empty) return null;

      const docRef = candidate.docs[0].ref;
      const claimed = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(docRef);
        if (!snapshot.exists) return null;
        const audit = snapshot.data() as ResourceAuditDocument;
        const lockExpired = !audit.leaseExpiresAt || new Date(audit.leaseExpiresAt).getTime() < Date.now();
        if (audit.status !== 'queued' && !(audit.status === 'running' && lockExpired)) return null;
        if (audit.lockedBy && !lockExpired) return null;
        transaction.set(docRef, {
          status: 'running',
          progress: Math.max(audit.progress, 1),
          currentPhase: 'Audit worker started',
          lockedBy: workerId,
          lockedAt: timestamp,
          leaseExpiresAt,
          updatedAt: timestamp,
        }, { merge: true });
        return { ...audit, status: 'running' as const, lockedBy: workerId, lockedAt: timestamp, leaseExpiresAt };
      });
      return claimed;
    }

    const next = Array.from(memory.audits.values())
      .filter((audit) => {
        if (audit.status === 'queued') return true;
        return audit.status === 'running' && Boolean(audit.leaseExpiresAt) && audit.leaseExpiresAt < timestamp;
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (!next) return null;

    const claimed = {
      ...next,
      status: 'running' as const,
      progress: Math.max(next.progress, 1),
      currentPhase: 'Audit worker started',
      lockedBy: workerId,
      lockedAt: timestamp,
      leaseExpiresAt,
      updatedAt: timestamp,
    };
    memory.audits.set(next.id, claimed);
    return claimed;
  },

  async clearExpiredAuditData() {
    const db = getAdminFirestore();
    const current = nowIso();
    if (!db) {
      for (const audit of memory.audits.values()) {
        if (audit.expiresAt < current) {
          memory.events.delete(audit.id);
          memory.pages.delete(audit.id);
          memory.issues.delete(audit.id);
          memory.reports.delete(audit.id);
          memory.audits.delete(audit.id);
        }
      }
      return;
    }

    const expired = await db.collection('audits').where('expiresAt', '<', current).limit(25).get();
    for (const auditDoc of expired.docs) {
      for (const child of ['events', 'pages', 'issues', 'reports']) {
        const snapshot = await auditDoc.ref.collection(child).limit(100).get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    }
  },
};
