import { Router } from 'express';
import { normalizeDomainInput, normalizeUserUrl } from '../lib/seo/url-utils';
import { generateKeywords } from '../lib/keywords/generator';
import { clusterKeywords } from '../lib/keywords/clustering';
import { buildContentBrief } from '../lib/keywords/content-brief';
import { auditStore } from '../lib/audit/audit-store';
import { auditRepository } from '../lib/supabase/audit-repository';
import { getSupabaseProjectHostname } from '../lib/supabase/server';
import { getAuditModeConfig, type AuditMode } from '../lib/audit/resource-types';
import {
  EntitlementError,
  canStartAudit,
  consumeAuditQuota,
  ensureUserProfileFromAuthUser,
  getAuthenticatedUserFromRequest,
  getPlanLimits,
} from '../lib/billing/entitlements';


function asyncJsonRoute(handler: any) {
  return async (req: any, res: any, next: any) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  };
}

export const apiRouter = Router();

function guestKeyForRequest(req: any) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return `guest:${forwarded || req.ip || req.socket?.remoteAddress || 'unknown'}`;
}

function isDeepAuditEnabled() {
  return process.env.DEEP_AUDIT_ENABLED === 'true';
}

async function getRequester(req: any) {
  const authUser = await getAuthenticatedUserFromRequest(req);
  if (!authUser) return { userId: null, profile: null };
  const profile = await ensureUserProfileFromAuthUser(authUser);
  return { userId: authUser.id, profile };
}

function sendEntitlementError(res: any, error: unknown) {
  if (error instanceof EntitlementError) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
      upgradeRequired: error.upgradeRequired,
    });
  }
  throw error;
}

apiRouter.get('/me/profile', asyncJsonRoute(async (req, res) => {
  const authUser = await getAuthenticatedUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  const profile = await ensureUserProfileFromAuthUser(authUser);
  const limits = await getPlanLimits(profile.plan);
  res.json({ success: true, data: { profile, limits } });
}));

async function startQueuedAudit(req: any, res: any, defaultMode: AuditMode = 'quick') {
  const { url, mode = defaultMode, projectId = null } = req.body || {};
  const normalized = normalizeUserUrl(String(url || ''));
  if (!normalized.isValid) {
    return res.status(400).json({ success: false, error: normalized.error || 'Invalid URL' });
  }

  const requestedMode = getAuditModeConfig(mode).mode as AuditMode;
  const { userId } = await getRequester(req);
  let decision;
  try {
    decision = await canStartAudit(userId, requestedMode, {
      guestKey: guestKeyForRequest(req),
      deepAuditEnabled: isDeepAuditEnabled(),
    });
  } catch (error) {
    return sendEntitlementError(res, error);
  }

  const audit = await auditRepository.createAuditJob({
    submittedInput: String(url || '').trim(),
    normalizedUrl: normalized.normalizedUrl,
    hostname: normalized.hostname,
    mode: decision.effectiveMode,
    requestedMode: decision.requestedMode,
    effectiveMode: decision.effectiveMode,
    plan: decision.plan,
    processingTier: decision.processingTier,
    pageLimit: decision.pageLimit,
    queuePriority: decision.queuePriority,
    userId: decision.userId,
    projectId,
  });

  await consumeAuditQuota(decision.userId, audit.id, decision.effectiveMode, {
    plan: decision.plan,
    pagesLimit: decision.pageLimit,
    guestKey: guestKeyForRequest(req),
  });
  await auditRepository.updateAudit(audit.id, { quotaCounted: true });

  console.info(`Audit start using Supabase project: ${getSupabaseProjectHostname() || 'not configured'}`);
  res.json({
    success: true,
    data: {
      auditId: audit.id,
      status: 'queued',
      submittedInput: audit.submittedInput,
      normalizedUrl: audit.normalizedUrl,
      hostname: audit.hostname,
      requestedMode: decision.requestedMode,
      effectiveMode: decision.effectiveMode,
      plan: decision.plan,
      pageLimit: decision.pageLimit,
      queuePriority: decision.queuePriority,
      quotaRemaining: decision.quotaRemaining,
    },
  });
}


apiRouter.post('/audit/start', asyncJsonRoute(async (req, res) => {
  try {
    return startQueuedAudit(req, res, 'quick');
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.get('/audit/events/:id', asyncJsonRoute((req, res) => {
  const auditId = req.params.id;
  const audit = typeof auditStore.getAudit === 'function' ? auditStore.getAudit(auditId) : auditStore.getJob(auditId);
  
  if (!audit) {
    return res.status(404).json({ success: false, error: 'Audit not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send existing history
  const history = typeof auditStore.getAuditEvents === 'function' ? auditStore.getAuditEvents(auditId) : [];
  for (const ev of history) {
    sendEvent('audit-event', ev);
  }

  // Subscribe to new events
  const onEvent = (ev) => {
    sendEvent('audit-event', ev);
    if (ev.type === 'audit_completed') {
      sendEvent('audit-complete', { auditId, resultAvailable: true });
    } else if (ev.type === 'audit_failed') {
      sendEvent('audit-error', { auditId, error: ev.message });
    }
  };

  if (typeof auditStore.subscribeToAudit === 'function') {
    auditStore.subscribeToAudit(auditId, onEvent);
  }

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    if (typeof auditStore.unsubscribeFromAudit === 'function') {
      auditStore.unsubscribeFromAudit(auditId, onEvent);
    }
  });
}));


apiRouter.get('/audit/status/:id', asyncJsonRoute(async (req, res) => {
  try {
    const liveData = await auditRepository.getLiveData(req.params.id);
    if (!liveData.audit) return res.status(404).json({ success: false, error: 'Audit not found' });
    res.json({ success: true, data: liveData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.post('/audit/cancel/:id', asyncJsonRoute(async (req, res) => {
  const audit = await auditRepository.getAudit(req.params.id);
  if (!audit) return res.status(404).json({ success: false, error: 'Audit not found' });
  await auditRepository.cancelAudit(req.params.id);
  res.json({ success: true, data: { auditId: req.params.id, status: 'cancelled' } });
}));

apiRouter.get('/audit/result/:id', asyncJsonRoute(async (req, res) => {
  try {
    const liveData = await auditRepository.getLiveData(req.params.id);
    if (!liveData.audit) return res.status(404).json({ success: false, error: 'Audit not found' });
    res.json({ success: true, data: liveData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.get('/audit/export/:id/:format', asyncJsonRoute(async (req, res) => {
  const { id, format } = req.params;
  const liveData = await auditRepository.getLiveData(id);
  if (!liveData.audit) return res.status(404).json({ success: false, error: 'Audit not found' });

  if (format === 'json') {
    return res.json({ success: true, data: liveData.finalReport || liveData });
  }

  if (format === 'issues.csv') {
    const header = 'severity,category,title,affectedUrl,evidence,recommendation\n';
    const rows = liveData.latestIssues.map((issue) => [issue.severity, issue.category, issue.title, issue.affectedUrl, issue.evidence, issue.recommendation]
      .map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(header + rows);
  }

  if (format === 'pages.csv') {
    const header = 'statusCode,url,responseTimeMs,pageSizeBytes,title,wordCount,crawlDepth,issueCount\n';
    const rows = liveData.latestPages.map((page) => [page.statusCode, page.url, page.responseTimeMs, page.pageSizeBytes, page.title, page.wordCount, page.crawlDepth, page.issueCount]
      .map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(header + rows);
  }

  return res.status(400).json({ success: false, error: 'Unsupported export format' });
}));

apiRouter.post('/audit/rerun/:id', asyncJsonRoute((req, res) => {
  try {
    return res.status(409).json({ success: false, error: 'Rerun is disabled for worker-backed audits. Start a new audit instead.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.post('/keyword/research', asyncJsonRoute((req, res) => {
  try {
    const { seed } = req.body;
    if (!seed) return res.status(400).json({ success: false, error: 'Seed keyword is required' });
    
    const keywords = generateKeywords(seed);
    res.json({ success: true, data: { keywords } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.post('/website/analyze', asyncJsonRoute(async (req, res) => {
  try {
    return startQueuedAudit(req, res, 'standard');
  } catch(e: any) {
    res.status(500).json({ success: false, error: e.message || 'Internal Server Error' });
  }
}));

apiRouter.post('/clusters', asyncJsonRoute((req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) return res.status(400).json({ success: false, error: 'Keywords array is required' });
    
    const clusters = clusterKeywords(keywords);
    res.json({ success: true, data: { clusters } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.post('/content-brief', asyncJsonRoute((req, res) => {
  try {
    const { cluster } = req.body;
    if (!cluster) return res.status(400).json({ success: false, error: 'Cluster object is required' });
    
    const brief = buildContentBrief(cluster);
    res.json({ success: true, data: { brief } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}));

apiRouter.post('/competitor-gap', asyncJsonRoute(async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Competitor Gap is temporarily disabled while worker-backed analysis is being enabled.',
  });
}));
