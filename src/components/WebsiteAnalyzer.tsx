import { API_ROUTES } from '../lib/api/routes';
import { getAuditStartHeaders } from '../lib/api/auth-headers';
import { createAuditSubmitGuard } from '../lib/api/audit-submit-guard';
import { safeJsonFetch } from '../lib/http/safe-json';
import React, { useEffect, useRef, useState } from 'react';
import { LiveAuditProgress } from './audit/LiveAuditProgress';
import { Globe, Loader2, FileText, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { ParsedPageData } from '../lib/seo/html-parser';
import { AuditResult } from '../lib/audit/types';
import { useAuth } from '../contexts/AuthContext';
import { SitePreviewSection } from './ui/visual-system';

export default function WebsiteAnalyzer() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    data: ParsedPageData, 
    audit: AuditResult, 
    crawledPages: number, 
    fullAudit: { overallScore: number, allIssues: any[] } 
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [auditId, setAuditId] = useState<string | null>(null);
  const auditStartGuardRef = useRef(createAuditSubmitGuard());
  const plan = user?.plan || 'free';
  const canUseStandard = plan === 'paid' || plan === 'agency' || plan === 'admin';
  const canUseDeep = plan === 'agency' || plan === 'admin';

  useEffect(() => {
    if (mode === 'standard' && !canUseStandard) setMode('quick');
    if (mode === 'deep' && !canUseDeep) setMode('quick');
  }, [canUseDeep, canUseStandard, mode]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!auditStartGuardRef.current.begin()) return;

    setLoading(true);
    setError(null);
    setAuditId(null);
    setResult(null);

    try {
      const dataResp = await safeJsonFetch<any>(API_ROUTES.websiteAnalyze, {
        method: 'POST',
        headers: await getAuditStartHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ url: url.trim(), mode })
      });
      const data = dataResp.success ? dataResp.data : { success: false, error: (dataResp as any).error };
      if (!data.success) throw new Error(data.error || 'Failed to analyze website');
      
      const nextAuditId = data.data.auditId;
      setAuditId(nextAuditId);
      window.history.pushState(null, '', `/audit/live/${nextAuditId}`);
      window.dispatchEvent(new CustomEvent('navigate-live-audit', { detail: nextAuditId }));
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } finally {
      auditStartGuardRef.current.end();
    }
  };

  if (auditId) {
    return (
       <div className="w-full space-y-6 animate-rise">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Website scan</h1>
          <p className="text-muted-foreground">Check pages, content signals, search visibility, and fix priorities as the audit runs.</p>
        </div>
        <LiveAuditProgress 
          auditId={auditId} 
           
          onComplete={async () => {
             try {
                const dataResp = await safeJsonFetch<any>(API_ROUTES.auditResult(auditId));
        const data = dataResp.success ? dataResp.data : { success: false, error: (dataResp as any).error };
                if (data.success) {
                   setResult({
                     data: data.data.data,
                     audit: data.data.audit,
                     crawledPages: data.data.crawledPages,
                     fullAudit: data.data.fullAudit
                   });
                   setAuditId(null);
                }
             } catch(e) {}
          }} 
        />
       </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-rise">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Website scan</h1>
        <p className="text-muted-foreground">Scan a website for page titles, descriptions, content signals, internal links, and Google access issues.</p>
      </div>

      <div className="trust-card p-5 md:p-6">
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Enter a website URL (e.g. https://example.com)"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium whitespace-nowrap">Scan type</label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as any)}
              className="bg-muted/50 border border-border rounded-xl py-3 px-3 outline-none focus:border-accent"
            >
              <option value="quick">Quick - free 5-page scan</option>
              <option value="standard" disabled={!canUseStandard}>Full - paid/admin 25-page scan {!canUseStandard ? '(locked)' : ''}</option>
              <option value="deep" disabled={!canUseDeep}>Deep - agency/admin expanded scan {!canUseDeep ? '(locked)' : ''}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="trust-button px-6 py-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
            {loading ? 'Starting scan...' : 'Start scan'}
          </button>
        </form>
        {mode === 'deep' && (
          <div className="mt-3 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            Deep scans may take longer and require more audit engine capacity.
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <SitePreviewSection
            url={url}
            hostname={url}
            title={result.data?.title || 'Website analyzer preview'}
            description={result.data?.metaDescription || 'Page preview from the scanned website.'}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm text-muted-foreground">Site health score</p>
                <p className={`text-3xl font-bold ${result.fullAudit.overallScore >= 80 ? 'text-green-500' : result.fullAudit.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {result.fullAudit.overallScore}
                </p>
              </div>
              <ActivityIcon score={result.fullAudit.overallScore} />
            </div>
            
            <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm text-muted-foreground">Pages scanned</p>
                <p className="text-3xl font-bold text-accent">{result.crawledPages}</p>
              </div>
              <Layers className="w-8 h-8 text-accent/20" />
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm text-muted-foreground">Open fixes</p>
                <p className="text-3xl font-bold text-orange-500">{result.fullAudit.allIssues.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500/20" />
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm text-muted-foreground">Words on first page</p>
                <p className="text-3xl font-bold text-accent">{result.data?.wordCount || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-accent/20" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 border-b border-border pb-2">Main words found on the homepage</h2>
              <div className="flex flex-wrap gap-2">
                {result.data?.topKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 border-b border-border pb-2">Main phrases found on the homepage</h2>
              <div className="flex flex-wrap gap-2">
                {result.data?.topPhrases.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold">First page details</h3>
            </div>
            <div className="p-4 space-y-2 text-sm">
               <div><span className="font-semibold w-24 inline-block">Title:</span> <span className="text-muted-foreground">{result.data?.title || 'Missing'}</span></div>
               <div><span className="font-semibold w-36 inline-block">Description:</span> <span className="text-muted-foreground">{result.data?.metaDescription || 'Missing'}</span></div>
               <div><span className="font-semibold w-36 inline-block">Main headings:</span> <span className="text-muted-foreground">{result.data?.h1.join(', ') || 'Missing'}</span></div>
               <div><span className="font-semibold w-36 inline-block">Preferred URL:</span> <span className="text-muted-foreground">{result.data?.canonical || 'Missing'}</span></div>
               <div><span className="font-semibold w-36 inline-block">Internal links:</span> <span className="text-muted-foreground">{result.data?.internalLinks.length}</span></div>
               <div><span className="font-semibold w-36 inline-block">External links:</span> <span className="text-muted-foreground">{result.data?.externalLinks.length}</span></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold">All SEO fixes found across the site</h3>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {result.fullAudit.allIssues.length === 0 ? (
                <div className="p-6 text-center text-green-500 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8" />
                  <p className="font-medium">No SEO fixes found.</p>
                </div>
              ) : (
                result.fullAudit.allIssues.map((issue, i) => (
                  <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex gap-4 items-start">
                    <div className={`mt-1 flex-shrink-0 ${issue.severity === 'critical' ? 'text-red-500' : issue.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">{issue.title}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">{issue.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                      <p className="text-xs mt-1 text-accent break-all">{issue.affectedUrl}</p>
                      <div className="mt-2 text-sm bg-muted/50 p-2 rounded-lg border border-border inline-block">
                        <span className="font-semibold">How to fix:</span> {issue.recommendation}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function ActivityIcon({ score }: { score: number }) {
  if (score >= 80) return <CheckCircle2 className="w-8 h-8 text-green-500/20" />;
  if (score >= 50) return <AlertTriangle className="w-8 h-8 text-yellow-500/20" />;
  return <AlertTriangle className="w-8 h-8 text-red-500/20" />;
}
