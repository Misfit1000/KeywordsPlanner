import React, { useEffect, useState } from 'react';
import { ExternalLink, Link2, Loader2, Network, RefreshCw } from 'lucide-react';
import { API_ROUTES } from '../../lib/api/routes';
import type { PublicLinkSignals } from '../../lib/backlinks/types';
import { safeJsonFetch } from '../../lib/http/safe-json';
import { Notice } from '../ui/page-system';
import { StatusBadge, SurfaceCard } from '../ui/visual-system';

function number(value: number | null) {
  return value == null ? '—' : new Intl.NumberFormat().format(value);
}

export default function PublicLinkSignalsCard({ domain }: { domain: string }) {
  const [signals, setSignals] = useState<PublicLinkSignals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSignals(null);
    safeJsonFetch<{ success: boolean; data?: PublicLinkSignals }>(`${API_ROUTES.domainLinkSignals}?domain=${encodeURIComponent(domain)}`, { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        if ('error' in response) {
          setError(response.error);
          return;
        }
        if (!response.data.success || !response.data.data) {
          setError('Public link signals are temporarily unavailable.');
          return;
        }
        setSignals(response.data.data);
      })
      .catch(() => {
        if (active) setError('Public link signals are temporarily unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [domain, retryKey]);

  return (
    <SurfaceCard className="p-5 md:p-6" aria-labelledby="public-link-signals-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-accent" />
            <h2 id="public-link-signals-title" className="text-xl font-semibold">Public backlink signals</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Backlink-derived rank and referring-network coverage from the public Majestic Million dataset. This is not Moz Domain Authority, does not list individual backlinks, and never changes the Crawlio audit score.</p>
        </div>
        <StatusBadge tone={signals?.found ? 'success' : error ? 'neutral' : loading ? 'neutral' : 'warning'}>{loading ? 'Checking public data' : error ? 'Unavailable' : signals?.found ? 'Public data found' : 'Outside top million'}</StatusBadge>
      </div>

      {loading && <div className="mt-6 flex min-h-28 items-center justify-center gap-3 rounded-xl bg-muted/35 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-accent" /> Checking the public backlink ranking…</div>}
      {!loading && error && <div className="mt-6"><Notice tone="warning" title="Public backlink data could not be loaded">{error} The website audit and its score are unaffected.</Notice><button type="button" className="quiet-button mt-3 min-h-10 px-3 py-2 text-sm" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw className="h-4 w-4" /> Try again</button></div>}
      {!loading && !error && signals && !signals.found && (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
          <div className="font-semibold">{signals.domain} is not present in the public top million</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">This does not mean the website has no backlinks or no authority. It only means this provider did not include it in the current one-million-domain ranking.</p>
        </div>
      )}
      {!loading && !error && signals?.found && (
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">Global backlink rank</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">#{number(signals.globalRank)}</dd></div>
          <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">Rank within TLD</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">#{number(signals.tldRank)}</dd></div>
          <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">Referring network blocks</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{number(signals.referringSubnets)}</dd></div>
          <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">Referring IPs</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{number(signals.referringIps)}</dd></div>
        </dl>
      )}

      {!loading && !error && signals && (
        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{signals.datasetDate ? `Dataset generated ${signals.datasetDate}` : 'Current public dataset'} · Cached for 24 hours</span>
          <a className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline" href={signals.sourceUrl} target="_blank" rel="noreferrer">Majestic Million · CC BY 3.0 <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      )}
      <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Link2 className="mt-0.5 h-4 w-4 shrink-0" />Import a Google Search Console or Bing backlink CSV in Data Sources to inspect individual source pages, targets, and anchor text.</div>
    </SurfaceCard>
  );
}
