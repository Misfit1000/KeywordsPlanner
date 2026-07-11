import { API_ROUTES } from '../lib/api/routes';
import { getAuditAccessHeaders, getAuditStartHeaders } from '../lib/api/auth-headers';
import { createAuditSubmitGuard } from '../lib/api/audit-submit-guard';
import { safeJsonFetch } from '../lib/http/safe-json';
import { normalizeDomainInput } from '../lib/seo/url-utils';
import React, { useRef, useState } from 'react';
import { LiveAuditProgress } from './audit/LiveAuditProgress';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, CheckCircle2, Loader2, Lock, Download, Printer } from 'lucide-react';
import { SecurityAuditResult, SecurityIssue } from '../lib/security/types';

export default function SecurityAudit() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [result, setResult] = useState<SecurityAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const auditStartGuardRef = useRef(createAuditSubmitGuard());

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!auditStartGuardRef.current.begin()) return;
    let targetUrl = normalizeDomainInput(url);
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const dataResp = await safeJsonFetch<any>(API_ROUTES.auditStart, {
        method: 'POST',
        headers: await getAuditStartHeaders({ 'Content-Type': 'application/json' }),
        
        body: JSON.stringify({ url: targetUrl, mode: 'quick', type: 'security', options: {} })
      });
      const data = dataResp.success ? dataResp.data : { success: false, error: (dataResp as any).error };
      if (!data.success) throw new Error(data.error);
      
      setAuditId(data.data.auditId);
      setLoading(false);
      return;
    } catch(err: any) {
      setError(err.message);
    } finally {
      auditStartGuardRef.current.end();
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-rise">
      <div>
        <h1 className="text-3xl font-bold font-display">Passive Security Review</h1>
        <p className="text-muted-foreground">Check public safety settings such as HTTPS and browser protections. This is passive and does not attack or exploit the website.</p>
      </div>

      <form onSubmit={startAudit} className="trust-card flex flex-col gap-3 p-3 md:flex-row">
        <input 
          type="text" 
          required 
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="suite-input flex-1"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="trust-button px-6 py-3"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
          {loading ? 'Starting review...' : 'Start passive review'}
        </button>
      </form>

      {auditId && !result && (
        <LiveAuditProgress 
          auditId={auditId} 
          onComplete={async () => {
            const dataResp = await safeJsonFetch<any>(API_ROUTES.auditResult(auditId), { headers: await getAuditAccessHeaders() });
        const data = dataResp.success ? dataResp.data : { success: false, error: (dataResp as any).error };
            if (data.success) {
              setResult(data.data.result || data.data);
              setAuditId(null);
            }
          }} 
        />
      )}
      
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-sm font-medium text-muted-foreground mb-2">Passive security score</span>
              <span className={`text-5xl font-display font-bold ${result.securityScore >= 90 ? 'text-green-500' : result.securityScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                {result.securityScore}
              </span>
              <span className="text-sm text-muted-foreground mt-1">out of 100</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> Urgent fixes</span>
              <span className="text-3xl font-display font-bold text-red-500">{result.criticalCount}</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> High priority</span>
              <span className="text-3xl font-display font-bold text-amber-500">{result.highCount}</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Total fixes</span>
              <span className="text-3xl font-display font-bold text-foreground">{result.issues.length}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-bold text-lg font-display">Passive security findings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Finding</th>
                    <th className="p-4 font-medium">Area</th>
                    <th className="p-4 font-medium">Fix priority</th>
                    <th className="p-4 font-medium">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.issues.map((issue, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-4">
                        <div className="font-medium text-foreground">{humanizeSecurityText(issue.title)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{humanizeSecurityText(issue.description)}</div>
                        <div className="text-xs text-emerald-600 mt-1">How to fix: {humanizeSecurityText(issue.recommendation)}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-muted rounded-md text-xs font-medium">{humanizeSecurityText(issue.category)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                          issue.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                          issue.severity === 'high' ? 'bg-amber-500/20 text-amber-500' :
                          issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          issue.severity === 'low' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {priorityLabel(issue.severity)}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                        {humanizeSecurityText(issue.evidence)}
                      </td>
                    </tr>
                  ))}
                  {result.issues.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <p>No urgent passive security fixes found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function priorityLabel(severity: string) {
  if (severity === 'critical') return 'fix now';
  if (severity === 'high') return 'high priority';
  if (severity === 'medium') return 'review soon';
  if (severity === 'low') return 'nice to fix';
  return severity;
}

function humanizeSecurityText(value?: string) {
  if (!value) return '';
  return value
    .replace(/security headers/gi, 'browser protections')
    .replace(/Strict-Transport-Security|HSTS/gi, 'HTTPS protection')
    .replace(/Content-Security-Policy|CSP/gi, 'content protection policy')
    .replace(/X-Frame-Options/gi, 'clickjacking protection')
    .replace(/X-Content-Type-Options/gi, 'file type protection')
    .replace(/Referrer-Policy/gi, 'referrer privacy policy')
    .replace(/vulnerabilities/gi, 'security weaknesses');
}
