import { load } from 'cheerio';
import type { DomainSignalStatus, PublicLinkSignals, WebRankHistoryPoint } from './types';

const LINK_PROVIDER_ORIGIN = 'https://majestic.com';
const LINK_PROVIDER_PATH = '/reports/majestic-million';
const RANK_PROVIDER_ORIGIN = 'https://tranco-list.eu';
const PROVIDER_TIMEOUT_MS = 6_000;
const MAX_LINK_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_RANK_RESPONSE_BYTES = 256 * 1024;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PARTIAL_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2_000;
const RANK_PROVIDER_INTERVAL_MS = 1_050;

interface BacklinkSnapshot {
  domain: string;
  found: boolean;
  globalRank: number | null;
  tldRank: number | null;
  referringSubnets: number | null;
  referringIps: number | null;
  datasetDate: string | null;
  fetchedAt: string;
  source: 'Majestic Million';
  sourceUrl: string;
  license: 'CC BY 3.0';
  scope: 'public_top_million';
}

interface WebRankSnapshot {
  domain: string;
  status: DomainSignalStatus;
  history: WebRankHistoryPoint[];
}

type CachedSignals = { expiresAt: number; value: PublicLinkSignals };

const signalCache = new Map<string, CachedSignals>();
const inFlight = new Map<string, Promise<PublicLinkSignals>>();
let rankProviderQueue: Promise<void> = Promise.resolve();
let lastRankProviderRequestAt = 0;

function firstInteger(value: string) {
  const match = String(value || '').match(/[\d,]+/);
  if (!match) return null;
  const parsed = Number(match[0].replace(/,/g, ''));
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function normalizedDomainText(value: string) {
  return String(value || '').trim().toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
}

function linkProviderUrl(domain: string) {
  const url = new URL(LINK_PROVIDER_PATH, LINK_PROVIDER_ORIGIN);
  url.searchParams.set('domain', domain);
  url.searchParams.set('majesticMillionType', '2');
  return url.toString();
}

function rankProviderUrl(domain: string) {
  return new URL(`/api/ranks/domain/${encodeURIComponent(domain)}`, RANK_PROVIDER_ORIGIN).toString();
}

export function parseMajesticMillionPage(html: string, requestedDomain: string, fetchedAt = new Date().toISOString()): BacklinkSnapshot {
  const domain = normalizedDomainText(requestedDomain);
  const $ = load(html);
  const pageText = $.root().text().replace(/\s+/g, ' ');
  const explicitlyAbsent = /is not in the Majestic Million/i.test(pageText);
  if (!pageText.includes('Majestic Million') || (!explicitlyAbsent && !pageText.includes('Referring Sub'))) {
    throw new Error('Link provider response format was not recognized.');
  }

  const datasetDate = pageText.match(/Top Million Root Domains List generated on\s+(.+?)\s+using data/i)?.[1]?.trim() || null;
  let matchingRow: ReturnType<ReturnType<typeof load>> | null = null;

  $('a.domainname').each((_index, element) => {
    if (matchingRow) return;
    if (normalizedDomainText($(element).text()) === domain) matchingRow = $(element).closest('tr');
  });

  const base = {
    domain,
    datasetDate,
    fetchedAt,
    source: 'Majestic Million' as const,
    sourceUrl: `${LINK_PROVIDER_ORIGIN}${LINK_PROVIDER_PATH}`,
    license: 'CC BY 3.0' as const,
    scope: 'public_top_million' as const,
  };

  if (!matchingRow) {
    return { ...base, found: false, globalRank: null, tldRank: null, referringSubnets: null, referringIps: null };
  }

  const cells = matchingRow.children('td').map((_index, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get();
  if (cells.length < 7) throw new Error('Link provider result row was incomplete.');

  return {
    ...base,
    found: true,
    globalRank: firstInteger(cells[0]),
    tldRank: firstInteger(cells[4]),
    referringSubnets: firstInteger(cells[5]),
    referringIps: firstInteger(cells[6]),
  };
}

export function parseTrancoRankResponse(value: unknown, requestedDomain: string): WebRankSnapshot {
  const domain = normalizedDomainText(requestedDomain);
  if (!value || typeof value !== 'object' || !Array.isArray((value as { ranks?: unknown }).ranks)) {
    throw new Error('Web rank provider response format was not recognized.');
  }
  const returnedDomain = normalizedDomainText(String((value as { domain?: unknown }).domain || ''));
  if (returnedDomain && returnedDomain !== domain) throw new Error('Web rank provider returned a different domain.');

  const history = (value as { ranks: unknown[] }).ranks
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const date = String((item as { date?: unknown }).date || '');
      const rank = Number((item as { rank?: unknown }).rank);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isSafeInteger(rank) || rank < 1) return null;
      return { date, rank };
    })
    .filter((item): item is WebRankHistoryPoint => item != null)
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 31);

  return { domain, status: history.length ? 'measured' : 'not_ranked', history };
}

async function boundedResponseText(response: Response, maximumBytes: number) {
  const advertisedLength = Number(response.headers.get('content-length') || 0);
  if (advertisedLength > maximumBytes) throw new Error('Provider response was too large.');
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      throw new Error('Provider response was too large.');
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchBacklinkSnapshot(domain: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(linkProviderUrl(domain), {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Crawlio/1.0 (+https://keywordsintel.vercel.app; domain-signals)',
      },
    });
    if (!response.ok) throw new Error(`Link provider returned HTTP ${response.status}.`);
    if (!String(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
      throw new Error('Link provider returned an unexpected content type.');
    }
    return parseMajesticMillionPage(await boundedResponseText(response, MAX_LINK_RESPONSE_BYTES), domain);
  } finally {
    clearTimeout(timeout);
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withRankProviderSlot<T>(work: () => Promise<T>) {
  const result = rankProviderQueue
    .catch(() => undefined)
    .then(async () => {
      const delay = Math.max(0, RANK_PROVIDER_INTERVAL_MS - (Date.now() - lastRankProviderRequestAt));
      if (delay) await wait(delay);
      lastRankProviderRequestAt = Date.now();
      return work();
    });
  rankProviderQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function fetchWebRankSnapshot(domain: string) {
  return withRankProviderSlot(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const response = await fetch(rankProviderUrl(domain), {
        signal: controller.signal,
        redirect: 'error',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Crawlio/1.0 (+https://keywordsintel.vercel.app; domain-signals)',
        },
      });
      if (!response.ok) throw new Error(`Web rank provider returned HTTP ${response.status}.`);
      if (!String(response.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
        throw new Error('Web rank provider returned an unexpected content type.');
      }
      return parseTrancoRankResponse(JSON.parse(await boundedResponseText(response, MAX_RANK_RESPONSE_BYTES)), domain);
    } finally {
      clearTimeout(timeout);
    }
  });
}

function cached(domain: string) {
  const entry = signalCache.get(domain);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    signalCache.delete(domain);
    return null;
  }
  return entry.value;
}

function cache(domain: string, value: PublicLinkSignals) {
  if (signalCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = signalCache.keys().next().value;
    if (oldestKey) signalCache.delete(oldestKey);
  }
  signalCache.set(domain, { expiresAt: Date.now() + (value.partial ? PARTIAL_CACHE_TTL_MS : CACHE_TTL_MS), value });
}

async function loadSignals(domain: string): Promise<PublicLinkSignals> {
  const [linkResult, rankResult] = await Promise.allSettled([
    fetchBacklinkSnapshot(domain),
    fetchWebRankSnapshot(domain),
  ]);
  if (linkResult.status === 'rejected' && rankResult.status === 'rejected') throw new Error('Domain signal providers are unavailable.');

  const backlink = linkResult.status === 'fulfilled' ? linkResult.value : null;
  const rank = rankResult.status === 'fulfilled' ? rankResult.value : null;
  const history = rank?.history || [];
  const currentRank = history[0]?.rank ?? null;
  const previousRank = history.length > 1 ? history[history.length - 1].rank : null;
  const fetchedAt = backlink?.fetchedAt || new Date().toISOString();

  return {
    domain,
    found: Boolean(backlink?.found),
    globalRank: backlink?.globalRank ?? null,
    tldRank: backlink?.tldRank ?? null,
    referringSubnets: backlink?.referringSubnets ?? null,
    referringIps: backlink?.referringIps ?? null,
    datasetDate: backlink?.datasetDate ?? null,
    fetchedAt,
    source: 'Majestic Million',
    sourceUrl: `${LINK_PROVIDER_ORIGIN}${LINK_PROVIDER_PATH}`,
    license: 'CC BY 3.0',
    scope: 'public_top_million',
    linkStatus: linkResult.status === 'rejected' ? 'unavailable' : backlink?.found ? 'measured' : 'not_ranked',
    webRankStatus: rankResult.status === 'rejected' ? 'unavailable' : rank?.status || 'not_ranked',
    webRank: currentRank,
    previousWebRank: previousRank,
    webRankChange: currentRank != null && previousRank != null ? previousRank - currentRank : null,
    webRankHistory: history,
    partial: linkResult.status === 'rejected' || rankResult.status === 'rejected',
    attributions: [
      { label: 'Majestic Million', url: `${LINK_PROVIDER_ORIGIN}${LINK_PROVIDER_PATH}`, license: 'CC BY 3.0' },
      { label: 'Tranco', url: 'https://tranco-list.eu/' },
    ],
  };
}

export async function getPublicLinkSignals(domainInput: string): Promise<PublicLinkSignals> {
  const domain = normalizedDomainText(domainInput);
  const existing = cached(domain);
  if (existing) return existing;
  const currentRequest = inFlight.get(domain);
  if (currentRequest) return currentRequest;

  const request = loadSignals(domain)
    .then((value) => {
      cache(domain, value);
      return value;
    })
    .finally(() => inFlight.delete(domain));
  inFlight.set(domain, request);
  return request;
}
