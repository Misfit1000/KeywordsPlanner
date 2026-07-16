import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ExternalLink, Gauge, Globe2, Link2, ListChecks, Loader2, Network, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { API_ROUTES } from '../../lib/api/routes';
import { extractReportScores } from '../../lib/audit/report-insights';
import { calculateDomainStrength } from '../../lib/backlinks/domain-strength';
import type { PublicLinkSignals } from '../../lib/backlinks/types';
import { safeJsonFetch } from '../../lib/http/safe-json';
import { ProgressBar, StatusBadge, SurfaceCard } from '../ui/visual-system';

function formatNumber(value: number | null) {
  return value == null ? 'Not measured' : new Intl.NumberFormat().format(value);
}

function scoreTone(score: number | null) {
  if (score == null) return 'accent' as const;
  if (score >= 80) return 'green' as const;
  if (score >= 60) return 'accent' as const;
  if (score >= 40) return 'yellow' as const;
  return 'red' as const;
}

function rankTrendLabel(change: number | null) {
  if (change == null) return 'No 30-day comparison';
  if (change === 0) return 'No change over 30 days';
  return `${change > 0 ? 'Improved' : 'Declined'} by ${new Intl.NumberFormat().format(Math.abs(change))}`;
}

function RankSparkline({ signals }: { signals: PublicLinkSignals }) {
  const history = [...signals.webRankHistory].reverse();
  if (history.length < 2) return null;
  const ranks = history.map((item) => item.rank);
  const minimum = Math.min(...ranks);
  const maximum = Math.max(...ranks);
  const range = Math.max(1, maximum - minimum);
  const points = ranks.map((rank, index) => {
    const x = (index / Math.max(1, ranks.length - 1)) * 100;
    const y = 38 - ((maximum - rank) / range) * 28;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 42" role="img" aria-label="Web rank over the last 30 days" className="mt-3 h-16 w-full overflow-visible text-accent">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: React.ReactNode; detail: string }) {
  return (
    <div className="min-w-0 border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">{icon}{label}</div>
      <div className="mt-2 truncate text-xl font-bold tabular-nums" title={typeof value === 'string' ? value : undefined}>{value}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</div>
    </div>
  );
}

export default function DomainStrengthCard({ domain, auditScores }: { domain: string; auditScores: Record<string, unknown> }) {
  const [signals, setSignals] = useState<PublicLinkSignals | null>(null);
  const [externalError, setExternalError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const scores = useMemo(() => extractReportScores(auditScores), [auditScores]);
  const strength = useMemo(() => calculateDomainStrength(scores, signals), [scores, signals]);
  const measuredFactors = strength.factors.filter((factor) => factor.score != null);
  const weakestFactor = [...measuredFactors].sort((left, right) => (left.score || 0) - (right.score || 0))[0];
  const tone = scoreTone(strength.score);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setExternalError(false);
    setSignals(null);
    safeJsonFetch<{ success: boolean; data?: PublicLinkSignals }>(`${API_ROUTES.domainLinkSignals}?domain=${encodeURIComponent(domain)}`, { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        if ('error' in response || !response.data.success || !response.data.data) {
          setExternalError(true);
          return;
        }
        setSignals(response.data.data);
      })
      .catch(() => {
        if (active) setExternalError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [domain, retryKey]);

  const rankChange = signals?.webRankChange ?? null;
  const rankTone = rankChange == null || rankChange === 0 ? 'text-muted-foreground' : rankChange > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300';

  return (
    <SurfaceCard aria-labelledby="domain-strength-title" aria-label="Domain strength" className="p-0">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between md:p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-accent" />
            <h2 id="domain-strength-title" className="text-xl font-semibold">Domain strength</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A Crawlio score built from this audit, with web-rank and link evidence added when it can be measured.</p>
        </div>
        <StatusBadge tone={strength.confidence === 'standard' ? 'success' : 'warning'}>{strength.confidence === 'standard' ? 'Standard confidence' : 'Limited confidence'}</StatusBadge>
      </div>

      <div className="grid lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.5fr)]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r md:p-6">
          {strength.score == null ? (
            <div className="flex min-h-48 flex-col justify-center">
              <div className="text-sm font-semibold text-muted-foreground">Crawlio Domain Strength</div>
              <div className="mt-2 text-2xl font-bold">Not enough evidence</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">At least three measured audit sections are required.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">Crawlio Domain Strength</div>
                  <div className="mt-2 flex items-baseline gap-1.5 tabular-nums"><span className="text-6xl font-bold leading-none">{strength.score}</span><span className="text-sm font-semibold text-muted-foreground">/100</span></div>
                  <div className="mt-3 text-sm font-semibold">{strength.band}</div>
                </div>
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent"><span className="text-[10px] font-semibold uppercase tracking-wider">Grade</span><span className="text-3xl font-bold leading-none">{strength.grade}</span></div>
              </div>
              <div className="mt-6"><ProgressBar value={strength.score} tone={tone} /></div>
              <dl className="mt-5 grid grid-cols-2 divide-x divide-border border-y border-border py-3 text-sm">
                <div className="pr-3"><dt className="text-xs text-muted-foreground">Evidence coverage</dt><dd className="mt-1 font-semibold tabular-nums">{strength.coverage}%</dd></div>
                <div className="min-w-0 pl-3"><dt className="text-xs text-muted-foreground">Focus area</dt><dd className="mt-1 truncate font-semibold" title={weakestFactor?.label}>{weakestFactor?.label || 'No weak factor'}</dd></div>
              </dl>
            </>
          )}
        </div>

        <div className="min-w-0">
          <div className="grid border-b border-border sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Globe2 className="h-4 w-4 text-accent" />} label="Web rank" value={signals?.webRank ? `#${formatNumber(signals.webRank)}` : 'Not measured'} detail={loading ? 'Checking rank history' : rankTrendLabel(rankChange)} />
            <Metric icon={<BarChart3 className="h-4 w-4 text-accent" />} label="Link visibility" value={strength.linkVisibility == null ? 'Not measured' : `${strength.linkVisibility}/100`} detail={strength.linkVisibility == null ? 'No reliable link rank available' : 'Rank and network coverage'} />
            <Metric icon={<Network className="h-4 w-4 text-accent" />} label="Referring networks" value={formatNumber(signals?.referringSubnets ?? null)} detail="Distinct network blocks observed" />
            <Metric icon={<Link2 className="h-4 w-4 text-accent" />} label="Referring IPs" value={formatNumber(signals?.referringIps ?? null)} detail="Distinct linking addresses observed" />
          </div>

          <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)]">
            <div>
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Measured strength factors</h3><p className="mt-1 text-xs text-muted-foreground">Only completed audit sections contribute.</p></div><span className="text-xs font-semibold tabular-nums text-muted-foreground">{measuredFactors.length}/6</span></div>
              <div className="mt-4 space-y-3">
                {strength.factors.map((factor) => factor.score == null ? (
                  <div key={factor.id} className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{factor.label}</span><span>Not measured</span></div>
                ) : <ProgressBar key={factor.id} label={factor.label} value={factor.score} tone={scoreTone(factor.score)} />)}
              </div>
            </div>

            <div className="border-t border-border pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-accent" /><h3 className="font-semibold">What improves this score</h3></div>
              <ol className="mt-4 space-y-3 text-sm leading-5 text-muted-foreground">
                {strength.recommendations.map((recommendation, index) => <li key={recommendation} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">{index + 1}</span><span>{recommendation}</span></li>)}
              </ol>
              {signals && <RankSparkline signals={signals} />}
              {!loading && rankChange != null && <div className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${rankTone}`}>{rankChange > 0 ? <TrendingUp className="h-4 w-4" /> : rankChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}{rankTrendLabel(rankChange)}</div>}
            </div>
          </div>
        </div>
      </div>

      {(loading || externalError || signals?.partial) && (
        <div className="flex flex-col gap-2 border-t border-border bg-muted/25 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
          <span className="inline-flex items-center gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}{loading ? 'Checking optional external evidence' : 'Some external evidence is unavailable; the audit-based score remains valid.'}</span>
          {(externalError || signals?.partial) && <button type="button" className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg px-2.5 font-semibold text-accent hover:bg-accent/10 sm:self-auto" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw className="h-4 w-4" /> Retry</button>}
        </div>
      )}

      <details className="group border-t border-border px-5 py-4 md:px-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold marker:content-none"><span>Methodology and sources</span><ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" /></summary>
        <div className="mt-3 grid gap-4 text-xs leading-5 text-muted-foreground md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div><p>Site factors come from the completed Crawlio audit. External link and web-rank evidence is included only when measured. Missing evidence is excluded rather than scored as zero. Crawlio Domain Strength is not Moz Domain Authority, Ahrefs Domain Rating, or a Google score.</p><a href="/app/imports" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"><Link2 className="h-3.5 w-3.5" /> Add first-party backlink data</a></div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">{(signals?.attributions || [{ label: 'Majestic Million', url: 'https://majestic.com/reports/majestic-million', license: 'CC BY 3.0' }, { label: 'Tranco', url: 'https://tranco-list.eu/' }]).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">{source.label}{source.license ? ` · ${source.license}` : ''}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div>
        </div>
      </details>
    </SurfaceCard>
  );
}
