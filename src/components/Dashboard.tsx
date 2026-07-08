import React, { useEffect, useState } from 'react';
import { Search, Activity, Target, Layers, Upload, TrendingUp, AlertCircle, Lock, Rocket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_ROUTES } from '../lib/api/routes';
import { getAuthHeaders } from '../lib/api/auth-headers';
import { safeJsonFetch } from '../lib/http/safe-json';

export default function Dashboard(props: any) {
  const { user } = useAuth();
  const [planData, setPlanData] = useState<any | null>(null);
  const upgradeUrl = import.meta.env.VITE_UPGRADE_URL;

  useEffect(() => {
    let active = true;
    if (!user) {
      setPlanData(null);
      return;
    }
    getAuthHeaders()
      .then((headers) => safeJsonFetch<any>(API_ROUTES.meProfile, { headers }))
      .then((response) => {
        if (!active) return;
        if (response.success) setPlanData(response.data.data || response.data);
      })
      .catch(() => {
        if (active) setPlanData(null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const profile = planData?.profile || user;
  const limits = planData?.limits;
  const plan = profile?.plan || 'free';
  const dailyUsed = Number(profile?.auditQuotaUsedDaily ?? 0);
  const monthlyUsed = Number(profile?.auditQuotaUsedMonthly ?? 0);
  const dailyRemaining = Math.max(0, Number(limits?.dailyAudits ?? (plan === 'free' ? 3 : 25)) - dailyUsed);
  const monthlyRemaining = Math.max(0, Number(limits?.monthlyAudits ?? (plan === 'free' ? 30 : 500)) - monthlyUsed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-colors font-medium shadow-sm shadow-accent/20">
            <Search className="w-4 h-4" /> New Research
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-2xl font-bold capitalize">{plan}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {plan === 'free'
                  ? 'Free Lightweight Audit: 5 pages, passive security checks, JSON export.'
                  : plan === 'paid'
                    ? 'Paid Standard Audit: 25 pages, deeper checks, priority queue, PDF/report features.'
                    : 'Agency/Admin: deep audit access, highest queue priority, white-label/report features.'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => props.onOpenSeoAudit?.()}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-xl font-semibold flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" /> Run Quick Audit
              </button>
              {plan === 'free' && (
                <a
                  href={upgradeUrl || '#'}
                  onClick={(event) => {
                    if (!upgradeUrl) {
                      event.preventDefault();
                      alert('Paid plans are coming soon. Contact admin to upgrade.');
                    }
                  }}
                  className="px-4 py-2 border border-border rounded-xl font-semibold flex items-center gap-2 hover:bg-muted"
                >
                  <Lock className="w-4 h-4" /> Upgrade
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Audits remaining</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className="text-2xl font-bold">{dailyRemaining}</div>
            </div>
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <div className="text-xs text-muted-foreground">Month</div>
              <div className="text-2xl font-bold">{monthlyRemaining}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-3">Standard and Deep audits stay locked unless your plan allows them.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Security Score', value: 'A-', icon: Activity, color: 'text-green-500' },
          { label: 'Critical Security', value: '2', icon: AlertCircle, color: 'text-red-500' },
          { label: 'Keywords Analyzed', value: '12,403', icon: Search, color: 'text-green-500' },
          { label: 'Total Clusters', value: '142', icon: Layers, color: 'text-purple-500' },
          { label: 'Avg Opp. Score', value: '72/100', icon: TrendingUp, color: 'text-orange-500' }
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-muted rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-display font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-accent" /> Top Keyword Opportunities</h2>
          <div className="space-y-4">
            {[
              { kw: 'local seo for plumbers', opp: 92, intent: 'Transactional' },
              { kw: 'how to do keyword research', opp: 88, intent: 'Informational' },
              { kw: 'best seo software', opp: 85, intent: 'Commercial' }
            ].map((kw, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="font-medium">{kw.kw}</p>
                  <p className="text-xs text-muted-foreground">{kw.intent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-500">{kw.opp} Opp</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-red-500" /> Recent Site Audits</h2>
          <div className="space-y-4">
            {[
              { url: 'example.com', score: 65, issues: 12 },
              { url: 'competitor.com', score: 82, issues: 4 },
            ].map((audit, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="font-medium truncate max-w-[200px]">{audit.url}</p>
                  <p className="text-xs text-muted-foreground">{audit.issues} issues found</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${audit.score > 80 ? 'text-green-500' : 'text-orange-500'}`}>{audit.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-red-500" /> Recent Security Audits</h2>
          <div className="space-y-4">
            {[
              { url: 'example.com', score: 92, issues: 1, type: 'Secure' },
              { url: 'insecure.local', score: 45, issues: 12, type: 'Vulnerable' },
            ].map((audit, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="font-medium truncate max-w-[200px]">{audit.url}</p>
                  <p className="text-xs text-muted-foreground">{audit.issues} issues found</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${audit.score > 80 ? 'text-green-500' : 'text-orange-500'}`}>{audit.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Just creating a mock icon since we mapped `Folder` in the loop above and I didn't import it. 
