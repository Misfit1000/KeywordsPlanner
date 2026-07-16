import { load } from 'cheerio';
import type { PublicLinkSignals } from './types';

const PROVIDER_ORIGIN = 'https://majestic.com';
const PROVIDER_PATH = '/reports/majestic-million';
const PROVIDER_TIMEOUT_MS = 6_000;
const MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2_000;

type CachedSignals = { expiresAt: number; value: PublicLinkSignals };

const signalCache = new Map<string, CachedSignals>();

function firstInteger(value: string) {
  const match = String(value || '').match(/[\d,]+/);
  if (!match) return null;
  const parsed = Number(match[0].replace(/,/g, ''));
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function normalizedDomainText(value: string) {
  return String(value || '').trim().toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
}

function providerUrl(domain: string) {
  const url = new URL(PROVIDER_PATH, PROVIDER_ORIGIN);
  url.searchParams.set('domain', domain);
  url.searchParams.set('majesticMillionType', '2');
  return url.toString();
}

export function parseMajesticMillionPage(html: string, requestedDomain: string, fetchedAt = new Date().toISOString()): PublicLinkSignals {
  const domain = normalizedDomainText(requestedDomain);
  const $ = load(html);
  const pageText = $.root().text().replace(/\s+/g, ' ');
  const explicitlyAbsent = /is not in the Majestic Million/i.test(pageText);
  if (!pageText.includes('Majestic Million') || (!explicitlyAbsent && !pageText.includes('Referring Sub'))) {
    throw new Error('Majestic Million response format was not recognized.');
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
    sourceUrl: `${PROVIDER_ORIGIN}${PROVIDER_PATH}`,
    license: 'CC BY 3.0' as const,
    scope: 'public_top_million' as const,
  };

  if (!matchingRow) {
    return { ...base, found: false, globalRank: null, tldRank: null, referringSubnets: null, referringIps: null };
  }

  const cells = matchingRow.children('td').map((_index, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get();
  if (cells.length < 7) throw new Error('Majestic Million result row was incomplete.');

  return {
    ...base,
    found: true,
    globalRank: firstInteger(cells[0]),
    tldRank: firstInteger(cells[4]),
    referringSubnets: firstInteger(cells[5]),
    referringIps: firstInteger(cells[6]),
  };
}

async function boundedResponseText(response: Response) {
  const advertisedLength = Number(response.headers.get('content-length') || 0);
  if (advertisedLength > MAX_PROVIDER_RESPONSE_BYTES) throw new Error('Majestic Million response was too large.');
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PROVIDER_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error('Majestic Million response was too large.');
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
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
  signalCache.set(domain, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

export async function getPublicLinkSignals(domainInput: string): Promise<PublicLinkSignals> {
  const domain = normalizedDomainText(domainInput);
  const existing = cached(domain);
  if (existing) return existing;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(providerUrl(domain), {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Crawlio/1.0 (+https://keywordsintel.vercel.app; public-link-signals)',
      },
    });
    if (!response.ok) throw new Error(`Majestic Million returned HTTP ${response.status}.`);
    if (!String(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
      throw new Error('Majestic Million returned an unexpected content type.');
    }
    const value = parseMajesticMillionPage(await boundedResponseText(response), domain);
    cache(domain, value);
    return value;
  } finally {
    clearTimeout(timeout);
  }
}
